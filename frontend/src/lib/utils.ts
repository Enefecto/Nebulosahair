// Formato precio CLP: $12.500
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
  }).format(amount);
}

// Formato fecha: "lunes 15 de enero de 2025"
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + 'T12:00:00');
  return date.toLocaleDateString('es-CL', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Formato hora: "09:30"
export function formatTime(timeStr: string): string {
  return timeStr.slice(0, 5);
}

// Obtener lunes de la semana de una fecha
export function getWeekMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // Lunes = 0 en nuestra lógica
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Fecha a string YYYY-MM-DD
export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Generar mensaje de WhatsApp para agendar cita
export function buildWhatsAppMessage(params: {
  clientName: string;
  date: string;
  time: string;
  serviceName: string;
  whatsappNumber: string;
}): string {
  const { clientName, date, time, serviceName, whatsappNumber } = params;
  const formattedDate = formatDate(date);
  const msg = encodeURIComponent(
    `¡Hola! Soy ${clientName}, me gustaría agendar una hora:\n` +
    `📅 Fecha: ${formattedDate}\n` +
    `🕐 Hora: ${time}\n` +
    `💇 Servicio: ${serviceName}\n` +
    `¡Gracias!`
  );
  const number = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${number}?text=${msg}`;
}

export const CATEGORY_LABELS: Record<string, string> = {
  corte: 'Corte',
  barberia: 'Barbería',
  coloracion: 'Coloración',
  permanente: 'Permanente',
  otro: 'Otro',
};

export const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

export const SOURCE_LABELS: Record<string, string> = {
  whatsapp: 'WhatsApp',
  instagram: 'Instagram',
  walk_in: 'Presencial',
  web: 'Web',
};
