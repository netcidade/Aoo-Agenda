export enum AppointmentStatus {
  CONFIRMED = 'Confirmado',
  PENDING = 'Pendente',
  CANCELLED = 'Cancelado',
  COMPLETED = 'Concluído'
}

export interface Service {
  id: string;
  name: string;
  durationMinutes: number;
  price: number;
  description: string;
}

export interface Appointment {
  id: string;
  serviceId: string;
  date: string; // ISO String
  status: AppointmentStatus;
  title?: string; // Título do evento (Google Summary)
  notes?: string; // Descrição do evento
  googleEventId?: string; // Link to Google Calendar
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  calendarId?: string; // ID da agenda no Google
  password?: string;   // Senha gerada/definida para acesso futuro
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

// Google Calendar Specific Types
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  status: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
}

export interface GoogleCalendarListEntry {
  id: string;
  summary: string;
  description?: string;
  primary?: boolean;
  backgroundColor?: string;
}