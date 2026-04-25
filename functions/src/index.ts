import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { scrapeFarmaciasData } from './scraper';
import { ScraperResult } from './types';

admin.initializeApp();

const db = admin.firestore();

const GMAIL_USER = functions.config().gmail?.user || process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = functions.config().gmail?.app_password || process.env.GMAIL_APP_PASSWORD;
const NOTIFICATION_EMAIL = functions.config().gmail?.notification_email || process.env.NOTIFICATION_EMAIL || 'alandelleore@gmail.com';

async function sendEmail(subject: string, body: string, isError: boolean = false): Promise<void> {
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
    console.log('Email: credentials not configured, skipping notification');
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${body}`);
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_APP_PASSWORD
    }
  });

  const mailOptions = {
    from: `"Farmacias Carcarañá" <${GMAIL_USER}>`,
    to: NOTIFICATION_EMAIL,
    subject: `[${isError ? 'ERROR' : 'OK'}] ${subject}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2 style="color: ${isError ? '#d32f2f' : '#4caf50'};">
          ${isError ? '❌ Scraper Falló' : '✅ Scraper Exitoso'}
        </h2>
        <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
        <hr style="border: 1px solid #eee;">
        <div style="margin: 20px 0;">
          ${body}
        </div>
        <hr style="border: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          Automatizado por Firebase Cloud Functions
        </p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email enviado exitosamente');
  } catch (error) {
    console.error('Error enviando email:', error);
  }
}

async function saveToFirestore(result: ScraperResult): Promise<void> {
  console.log('Guardando datos en Firestore...');

  for (const farmacia of result.farmacias) {
    const existingQuery = await db.collection('farmacias')
      .where('nombre', '==', farmacia.nombre)
      .limit(1)
      .get();

    if (!existingQuery.empty) {
      await existingQuery.docs[0].ref.update({
        nombre: farmacia.nombre,
        telefono: farmacia.telefono,
        direccion: farmacia.direccion,
        horarios: farmacia.horarios
      });
      console.log(`  ✓ ${farmacia.nombre} actualizado`);
    } else {
      await db.collection('farmacias').add(farmacia);
      console.log(`  ✓ ${farmacia.nombre} creado`);
    }
  }

  if (result.turnos) {
    const docId = `${result.anio}-${result.mes.padStart(2, '0')}`;
    await db.collection('turnos').doc(docId).set({
      mes: result.mes,
      anio: result.anio,
      dias: result.turnos.dias,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log(`  ✓ Turnos ${docId} guardados`);
  }
}

export const weeklyScraper = functions
  .region('us-central1')
  .pubsub
  .schedule('0 8 * * 1')
  .timeZone('America/Argentina/Buenos_Aires')
  .onRun(async () => {
    console.log('=== Iniciando Weekly Scraper ===');
    const startTime = Date.now();

    try {
      const result = await scrapeFarmaciasData();

      if (result.success) {
        await saveToFirestore(result);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        await sendEmail(
          'Farmacias de Turno - Actualización Semanal',
          `
            <p><strong>Resumen:</strong></p>
            <ul>
              <li>Farmacias actualizadas: ${result.farmacias.length}</li>
              <li>Turnos del mes: ${result.mes}/${result.anio}</li>
              <li>Duración: ${duration}s</li>
            </ul>
            <p><strong>Farmacias:</strong></p>
            <ul>
              ${result.farmacias.map(f => `<li>${f.nombre} - ${f.telefono}</li>`).join('')}
            </ul>
          `,
          false
        );

        console.log('=== Scraper completado exitosamente ===');
      } else {
        await sendEmail(
          'Farmacias de Turno - Error en Scraper',
          `
            <p><strong>Error:</strong> ${result.error}</p>
            <p>Revisar los logs de Cloud Functions para más detalles.</p>
          `,
          true
        );

        console.error('=== Scraper falló ===');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error en scraper:', errorMessage);

      await sendEmail(
        'Farmacias de Turno - Error Fatal',
        `
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p>Stack trace:</p>
          <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error}</pre>
        `,
        true
      );

      throw error;
    }
  });

export const manualScraper = functions
  .region('us-central1')
  .https
  .onCall(async (data, context) => {
    console.log('=== Iniciando Manual Scraper (triggered via HTTPS) ===');

    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
    }

    const startTime = Date.now();

    try {
      const result = await scrapeFarmaciasData();

      if (result.success) {
        await saveToFirestore(result);

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        await sendEmail(
          'Farmacias de Turno - Actualización Manual',
          `
            <p><strong>Ejecutado por:</strong> ${context.auth.token.email || context.auth.uid}</p>
            <p><strong>Resumen:</strong></p>
            <ul>
              <li>Farmacias actualizadas: ${result.farmacias.length}</li>
              <li>Turnos del mes: ${result.mes}/${result.anio}</li>
              <li>Duración: ${duration}s</li>
            </ul>
          `,
          false
        );

        return {
          success: true,
          message: 'Scraper completado exitosamente',
          stats: {
            farmacias: result.farmacias.length,
            mes: result.mes,
            anio: result.anio,
            duration: `${duration}s`
          }
        };
      } else {
        await sendEmail(
          'Farmacias de Turno - Error en Scraper Manual',
          `
            <p><strong>Ejecutado por:</strong> ${context.auth.token.email || context.auth.uid}</p>
            <p><strong>Error:</strong> ${result.error}</p>
          `,
          true
        );

        throw new functions.https.HttpsError('internal', result.error || 'Error desconocido');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('Error en scraper:', errorMessage);
      throw new functions.https.HttpsError('internal', errorMessage);
    }
  });

export const testEmail = functions
  .region('us-central1')
  .https
  .onCall(async (data, context) => {
    console.log('=== Test Email Function ===');

    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
    }

    await sendEmail(
      'Test - Notificaciones de Farmacias',
      `
        <p>Este es un email de prueba.</p>
        <p><strong>Configuración de email:</strong></p>
        <ul>
          <li>GMAIL_USER: ${GMAIL_USER ? '✓ configurado' : '✗ faltante'}</li>
          <li>GMAIL_APP_PASSWORD: ${GMAIL_APP_PASSWORD ? '✓ configurado' : '✗ faltante'}</li>
        </ul>
      `,
      false
    );

    return { success: true, message: 'Email de prueba enviado' };
  });