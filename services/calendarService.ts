import { Appointment, AppointmentStatus, Service, GoogleCalendarEvent, User } from '../types';

// ==============================================================================
// ⚙️ CONFIGURAÇÃO DO GOOGLE AGENDA (MODO PORTAL PÚBLICO)
// ==============================================================================
// 1. Crie um projeto no Google Cloud Console
// 2. Habilite a "Google Calendar API"
// 3. Crie credenciais do tipo "API KEY" (Chave de API)
// 4. Cole a API Key abaixo:
// ATENÇÃO: Uma API Key começa geralmente com "AIza...". 
// Se o seu código termina em "apps.googleusercontent.com", é um CLIENT ID (errado).

const API_KEY: string = '479538977890-ak3thanls2coa7loijq7en12s4d152mp.apps.googleusercontent.com';

// ==============================================================================

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

let gapiInited = false;

export const initGoogleServices = (callback: () => void) => {
  // Verificação de segurança para evitar erro 400 se o usuário colou Client ID
  if (API_KEY.includes('apps.googleusercontent.com')) {
    console.warn("⚠️ ALERTA DE CONFIGURAÇÃO: Você colou um Client ID na variável API_KEY.");
    console.warn("Para o modo público funcionar, gere uma 'Chave de API' no Google Cloud Console (começa com AIza).");
    console.warn("O App continuará em modo de simulação.");
    callback();
    return;
  }

  if (window.gapi) {
    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: API_KEY,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        });
        gapiInited = true;
        console.log("GAPI inicializado com sucesso.");
        callback();
      } catch (error) {
        // Correção do erro [object Object]: Convertendo para string legível
        console.error("Erro ao inicializar GAPI:", JSON.stringify(error, null, 2));
        // Tenta continuar mesmo com erro para permitir modo offline/demo
        callback();
      }
    });
  } else {
    // Fallback se o script não carregou
    console.warn("Script gapi não encontrado no index.html");
    callback();
  }
};

// --- FUNÇÕES DE LEITURA (PÚBLICA) ---

// Conversão de evento
const convertGoogleEventToAppointment = (event: GoogleCalendarEvent, services: Service[]): Appointment => {
  const matchedService = services.find(s => event.summary && event.summary.includes(s.name));
  
  let status = AppointmentStatus.CONFIRMED;
  // Mapeia status do Google para o app
  if (event.status === 'tentative') status = AppointmentStatus.PENDING;
  if (event.status === 'cancelled') status = AppointmentStatus.CANCELLED;
  
  return {
    id: event.id,
    googleEventId: event.id,
    serviceId: matchedService ? matchedService.id : 'external',
    title: event.summary || 'Ocupado',
    date: event.start.dateTime || event.start.date || new Date().toISOString(), // Suporte a eventos de dia inteiro
    status: status,
    notes: event.description || ''
  };
};

export const listUpcomingEvents = async (services: Service[], calendarId: string): Promise<Appointment[]> => {
  // Se GAPI não iniciou ou a chave parece inválida/padrão, retorna vazio para não quebrar
  if (!gapiInited || API_KEY.includes('apps.googleusercontent.com')) {
    console.warn("API Google não inicializada corretamente. Retornando lista vazia (Modo Offline).");
    return [];
  }

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
  } catch (err: any) {
    console.error('Erro ao buscar eventos:', JSON.stringify(err, null, 2));
    if (err.status === 404) {
        console.error("Agenda não encontrada. Verifique se o ID está correto e se a agenda é PÚBLICA.");
    }
    throw err;
  }
};

// --- SIMULAÇÃO DE ESCRITA ---
// Como estamos usando API Key Pública, não temos permissão de escrita (apenas leitura).
// O agendamento será simulado localmente.

export const createCalendarEvent = async (appointment: Appointment, service: Service, calendarId: string): Promise<Appointment> => {
  console.log("Modo Portal Público: Agendamento simulado (Sem permissão de escrita na API Key)");
  
  // Simula um delay de rede
  await new Promise(resolve => setTimeout(resolve, 800));

  return {
      ...appointment,
      status: AppointmentStatus.PENDING,
      notes: `${appointment.notes || ''}\n(Solicitação enviada via Portal)`
  };
};