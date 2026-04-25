import axios from 'axios';
import * as cheerio from 'cheerio';
import { Farmacia, Turno, ScraperResult } from './types';

const FARMACIAS_URL = 'https://bonumlac.online/clientes/munic/farmacias.php';
const TURNOS_URL = 'https://xn--carcaraa-j3a.gob.ar/farmacias-turno';

export async function scrapeFarmaciasData(): Promise<ScraperResult> {
  const result: ScraperResult = {
    farmacias: [],
    turnos: null,
    mes: '',
    anio: 0,
    success: false,
    timestamp: new Date().toISOString()
  };

  try {
    console.log('Iniciando scraping...');

    const [farmaciasResult, turnosResult] = await Promise.all([
      scrapeFarmacias(),
      scrapeTurnos()
    ]);

    result.farmacias = farmaciasResult;
    result.turnos = turnosResult;

    if (turnosResult) {
      result.mes = turnosResult.mes;
      result.anio = turnosResult.anio;
    }

    result.success = true;
    console.log(`Scraping completado: ${farmaciasResult.length} farmacias, turnos: ${turnosResult ? 'sí' : 'no'}`);

  } catch (error) {
    result.success = false;
    result.error = error instanceof Error ? error.message : 'Error desconocido';
    console.error('Error en scraping:', result.error);
  }

  return result;
}

async function scrapeFarmacias(): Promise<Farmacia[]> {
  console.log('Scrapeando datos de farmacias...');
  
  const response = await axios.get(FARMACIAS_URL, {
    timeout: 30000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const $ = cheerio.load(response.data);
  const text = $.text();
  const farmacias: Farmacia[] = [];

  const lines = text.split(/\n|\t/);
  let currentFarmacia: Farmacia | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    
    if (!trimmed) continue;

    const nombreMatch = trimmed.match(/^Farmacia\s+(\w+[\s\w]*?)(?:\s*$)/i);
    if (nombreMatch) {
      if (currentFarmacia && currentFarmacia.nombre) {
        farmacias.push(currentFarmacia);
      }
      const nombre = nombreMatch[1].trim();
      currentFarmacia = { nombre, telefono: '', direccion: '', horarios: '' };
      console.log(`  Encontrada: ${nombre}`);
      continue;
    }

    if (!currentFarmacia) continue;

    const telefonoMatch = trimmed.match(/Tel[eé]fonos?:?\s*(.+)/i);
    if (telefonoMatch) {
      currentFarmacia.telefono = telefonoMatch[1].trim().replace(/\s+/g, ' ');
      continue;
    }

    const direccionMatch = trimmed.match(/Direcci[oó]n:?\s*(.+)/i);
    if (direccionMatch) {
      currentFarmacia.direccion = direccionMatch[1].trim().replace(/\s+/g, ' ');
      continue;
    }

    const horariosMatch = trimmed.match(/Horarios?(?:\s+de\s+Atención)?:?\s*(.+)/i);
    if (horariosMatch) {
      currentFarmacia.horarios = horariosMatch[1].trim().replace(/\s+/g, ' ');
      continue;
    }
  }

  if (currentFarmacia && currentFarmacia.nombre) {
    farmacias.push(currentFarmacia);
  }

  console.log(`Total farmacias encontradas: ${farmacias.length}`);
  return farmacias;
}

async function scrapeTurnos(): Promise<Turno | null> {
  console.log('Scrapeando turnos...');

  try {
    const response = await axios.get(TURNOS_URL, {
      timeout: 30000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const dias: Record<number, string> = {};

    let currentMes = '';
    let currentAnio = 0;

    $('h2').each((_, el) => {
      const text = $(el).text().trim();
      const match = text.match(/(\w+)\s+(\d{4})/i);
      if (match) {
        const monthNames: Record<string, string> = {
          'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04',
          'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08',
          'septiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12'
        };
        const monthNum = monthNames[match[1].toLowerCase()];
        if (monthNum) {
          currentMes = monthNum;
          currentAnio = parseInt(match[2]);
        }
      }
    });

    if (!currentMes || !currentAnio) {
      const date = new Date();
      currentMes = String(date.getMonth() + 1).padStart(2, '0');
      currentAnio = date.getFullYear();
    }

    const farmNames = ['Cusumano', 'Farré', 'Gassman', 'Gassmann', 'La Cumbre', 'Nardi', 'Pikhart', 'Pitteri', 'Rivolta'];

    $('div.dia').each((_, el) => {
      const divHtml = $(el).html() || '';
      const numeroMatch = divHtml.match(/<div class="numeroDia"[^>]*>\s*(\d+)/);
      
      if (numeroMatch) {
        const dia = parseInt(numeroMatch[1]);
        const textContent = $(el).text().trim();
        
        for (const nombre of farmNames) {
          if (textContent.includes(nombre)) {
            dias[dia] = nombre;
            console.log(`  Día ${dia}: ${nombre}`);
            break;
          }
        }
      }
    });

    return {
      dias,
      mes: currentMes,
      anio: currentAnio
    };

  } catch (error) {
    console.error('Error scrapeando turnos:', error);
    return null;
  }
}