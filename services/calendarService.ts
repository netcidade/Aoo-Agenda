import { Appointment, AppointmentStatus, Service, GoogleCalendarEvent, User, GoogleCalendarListEntry } from '../types';

// ==============================================================================
// ⚙️ CONFIGURAÇÃO DO GOOGLE AGENDA
// ==============================================================================
// 1. Crie um projeto no Google Cloud Console (console.cloud.google.com)
// 2. Habilite a "Google Calendar API"
// 3. Crie credenciais "OAuth 2.0 Client ID"
// 4. Cole o Client ID abaixo (substitua o texto entre aspas):

// ATENÇÃO: Cole seu ID aqui novamente, pois a atualização do arquivo pode tê-lo apagado.
const CLIENT_ID: string = '479538977890-ak3thanls2coa7loijq7en12s4d152mp.apps.googleusercontent.com';

// ==============================================================================

// Alterado para scope 'calendar' completo para permitir listar agendas (calendarList)
const SCOPES = 'https://www.googleapis.com/auth/calendar';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGoogleServices = (callback: () => void) => {
  if (window.gapi) {
    window.gapi.load('client', async () => {
      await window.gapi.client.init({
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
      });
      gapiInited = true;
      if (gisInited) callback();
    });
  }

  if (window.google) {
    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: '', 
    });
    gisInited = true;
    if (gapiInited) callback();
  }
};

export const handleAuthClick = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Verificação de Segurança: Garante que o usuário substituiu o placeholder
    if (CLIENT_ID.includes('COLE_SEU_CLIENT_ID_AQUI')) {
        alert('ERRO DE CONFIGURAÇÃO:\n\nO "Client ID" não foi configurado no código.\n\nAbra o arquivo services/calendarService.ts e cole seu ID do Google Cloud na variável CLIENT_ID.');
        reject('Client ID não configurado');
        return;
    }

    if (!tokenClient) {
      reject('Google Client not initialized');
      return;
    }

    tokenClient.callback = async (resp: any) => {
      if (resp.error) {
        reject(resp);
      }
      resolve();
    };

    if (window.gapi.client.getToken() === null) {
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } else {
      tokenClient.requestAccessToken({ prompt: '' });
    }
  });
};

export const handleSignOut = () => {
  const token = window.gapi.client.getToken();
  if (token !== null) {
    window.google.accounts.oauth2.revoke(token.access_token);
    window.gapi.client.setToken('');
  }
};

// --- NOVAS FUNÇÕES PARA SUPORTAR MÚLTIPLAS AGENDAS ---

// Busca todas as agendas da conta conectada
export const listAllCalendars = async (): Promise<User[]> => {
  try {
    const response = await window.gapi.client.calendar.calendarList.list();
    const items = response.result.items as GoogleCalendarListEntry[];
    
    // Transforma cada agenda em um "Usuário" do sistema
    return items.map(cal => ({
      id: cal.id, // ID interno do sistema (usamos o ID da agenda)
      calendarId: cal.id, // ID específico para API do Google
      name: cal.summary, // Nome da agenda (Ex: "Dr. Fernando", "Pessoal")
      email: cal.id.includes('@') ? cal.id : 'agenda@google.com',
      phone: '',
      // Gera uma senha temporária baseada no ID da agenda
      password: `pass_${cal.id.substring(0, 8)}`
    }));
  } catch (err) {
    console.error('Erro ao listar agendas:', err);
    throw err;
  }
};

// Conversão de evento
const convertGoogleEventToAppointment = (event: GoogleCalendarEvent, services: Service[]): Appointment => {
  const matchedService = services.find(s => event.summary && event.summary.includes(s.name));
  
  let status = AppointmentStatus.CONFIRMED;
  if (event.status === 'tentative') status = AppointmentStatus.PENDING;
  if (event.status === 'cancelled') status = AppointmentStatus.CANCELLED;
  
  const eventDate = new Date(event.start.dateTime || new Date().toISOString());
  if (eventDate < new Date() && status !== AppointmentStatus.CANCELLED) {
    status = AppointmentStatus.COMPLETED;
  }

  return {
    id: event.id,
    googleEventId: event.id,
    serviceId: matchedService ? matchedService.id : 'external', 
    date: event.start.dateTime || new Date().toISOString(),
    status: status,
    notes: event.description || 'Sincronizado do Google Agenda'
  };
};

// Agora aceita calendarId opcional (default 'primary')
export const listUpcomingEvents = async (services: Service[], calendarId: string = 'primary'): Promise<Appointment[]> => {
  try {
    const response = await window.gapi.client.calendar.events.list({
      'calendarId': calendarId,
      'timeMin': (new Date()).toISOString(),
      'showDeleted': false,
      'singleEvents': true,
      'maxResults': 50,
      'orderBy': 'startTime'
    });

    const events = response.result.items as GoogleCalendarEvent[];
    if (!events || events.length === 0) return [];

    return events.map(e => convertGoogleEventToAppointment(e, services));
  } catch (err) {
    console.error('Error fetching events', err);
    throw err;
  }
};

// Agora aceita calendarId
export const createCalendarEvent = async (appointment: Appointment, service: Service, calendarId: string = 'primary'): Promise<Appointment> => {
  const startDate = new Date(appointment.date);
  const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

  const event = {
    'summary': `Agendamento: ${service.name}`,
    'description': `Serviço agendado via MinhaAgenda App.\nPreço: R$ ${service.price.toFixed(2)}`,
    'start': {
      'dateTime': startDate.toISOString(),
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    'end': {
      'dateTime': endDate.toISOString(),
      'timeZone': Intl.DateTimeFormat().resolvedOptions().timeZone
    }
  };

  try {
    const request = await window.gapi.client.calendar.events.insert({
      'calendarId': calendarId,
      'resource': event
    });

    const googleEvent = request.result;
    
    return {
      ...appointment,
      id: googleEvent.id,
      googleEventId: googleEvent.id,
      status: AppointmentStatus.CONFIRMED
    };
  } catch (err) {
    console.error("Error creating event", err);
    throw err;
  }
};