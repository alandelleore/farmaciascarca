"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.testEmail = exports.manualScraper = exports.weeklyScraper = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const scraper_1 = require("./scraper");
admin.initializeApp();
const db = admin.firestore();
const GMAIL_USER = ((_a = functions.config().gmail) === null || _a === void 0 ? void 0 : _a.user) || process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = ((_b = functions.config().gmail) === null || _b === void 0 ? void 0 : _b.app_password) || process.env.GMAIL_APP_PASSWORD;
const NOTIFICATION_EMAIL = ((_c = functions.config().gmail) === null || _c === void 0 ? void 0 : _c.notification_email) || process.env.NOTIFICATION_EMAIL || 'alandelleore@gmail.com';
async function sendEmail(subject, body, isError = false) {
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
        console.log('Email: credentials not configured, skipping notification');
        console.log(`Subject: ${subject}`);
        console.log(`Body: ${body}`);
        return;
    }
    const transporter = nodemailer_1.default.createTransport({
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
    }
    catch (error) {
        console.error('Error enviando email:', error);
    }
}
async function saveToFirestore(result) {
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
        }
        else {
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
exports.weeklyScraper = functions
    .region('us-central1')
    .pubsub
    .schedule('0 8 * * 1')
    .timeZone('America/Argentina/Buenos_Aires')
    .onRun(async () => {
    console.log('=== Iniciando Weekly Scraper ===');
    const startTime = Date.now();
    try {
        const result = await (0, scraper_1.scrapeFarmaciasData)();
        if (result.success) {
            await saveToFirestore(result);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            await sendEmail('Farmacias de Turno - Actualización Semanal', `
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
          `, false);
            console.log('=== Scraper completado exitosamente ===');
        }
        else {
            await sendEmail('Farmacias de Turno - Error en Scraper', `
            <p><strong>Error:</strong> ${result.error}</p>
            <p>Revisar los logs de Cloud Functions para más detalles.</p>
          `, true);
            console.error('=== Scraper falló ===');
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error en scraper:', errorMessage);
        await sendEmail('Farmacias de Turno - Error Fatal', `
          <p><strong>Error:</strong> ${errorMessage}</p>
          <p>Stack trace:</p>
          <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${error}</pre>
        `, true);
        throw error;
    }
});
exports.manualScraper = functions
    .region('us-central1')
    .https
    .onCall(async (data, context) => {
    console.log('=== Iniciando Manual Scraper (triggered via HTTPS) ===');
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
    }
    const startTime = Date.now();
    try {
        const result = await (0, scraper_1.scrapeFarmaciasData)();
        if (result.success) {
            await saveToFirestore(result);
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);
            await sendEmail('Farmacias de Turno - Actualización Manual', `
            <p><strong>Ejecutado por:</strong> ${context.auth.token.email || context.auth.uid}</p>
            <p><strong>Resumen:</strong></p>
            <ul>
              <li>Farmacias actualizadas: ${result.farmacias.length}</li>
              <li>Turnos del mes: ${result.mes}/${result.anio}</li>
              <li>Duración: ${duration}s</li>
            </ul>
          `, false);
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
        }
        else {
            await sendEmail('Farmacias de Turno - Error en Scraper Manual', `
            <p><strong>Ejecutado por:</strong> ${context.auth.token.email || context.auth.uid}</p>
            <p><strong>Error:</strong> ${result.error}</p>
          `, true);
            throw new functions.https.HttpsError('internal', result.error || 'Error desconocido');
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
        console.error('Error en scraper:', errorMessage);
        throw new functions.https.HttpsError('internal', errorMessage);
    }
});
exports.testEmail = functions
    .region('us-central1')
    .https
    .onCall(async (data, context) => {
    console.log('=== Test Email Function ===');
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Se requiere autenticación');
    }
    await sendEmail('Test - Notificaciones de Farmacias', `
        <p>Este es un email de prueba.</p>
        <p><strong>Configuración de email:</strong></p>
        <ul>
          <li>GMAIL_USER: ${GMAIL_USER ? '✓ configurado' : '✗ faltante'}</li>
          <li>GMAIL_APP_PASSWORD: ${GMAIL_APP_PASSWORD ? '✓ configurado' : '✗ faltante'}</li>
        </ul>
      `, false);
    return { success: true, message: 'Email de prueba enviado' };
});
//# sourceMappingURL=index.js.map