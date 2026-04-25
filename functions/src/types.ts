export interface Farmacia {
  nombre: string;
  telefono: string;
  direccion: string;
  horarios: string;
}

export interface Turno {
  dias: Record<number, string>;
  mes: string;
  anio: number;
}

export interface ScraperResult {
  farmacias: Farmacia[];
  turnos: Turno | null;
  mes: string;
  anio: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  success: boolean;
  details?: string;
}