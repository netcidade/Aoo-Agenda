import { Service, Appointment, AppointmentStatus, User } from './types';

export const AVAILABLE_SERVICES: Service[] = [
  {
    id: 's1',
    name: 'Consultoria Estratégica',
    durationMinutes: 60,
    price: 350.00,
    description: 'Reunião de alinhamento e planejamento estratégico de negócios.'
  },
  {
    id: 's2',
    name: 'Mentoria Individual',
    durationMinutes: 45,
    price: 200.00,
    description: 'Sessão um a um para desbloqueio de carreira.'
  },
  {
    id: 's3',
    name: 'Análise de Perfil',
    durationMinutes: 30,
    price: 150.00,
    description: 'Revisão rápida de perfil profissional e feedback.'
  },
  {
    id: 's4',
    name: 'Workshop de Equipe',
    durationMinutes: 120,
    price: 800.00,
    description: 'Treinamento prático para pequenos grupos.'
  }
];

// ==================================================================================
// 🏥 CONFIGURAÇÃO DAS AGENDAS DA CLÍNICA
// ==================================================================================
// Coloque aqui os IDs das Agendas do Google que você quer que apareçam no portal.
// IMPORTANTE: Essas agendas devem estar configuradas como "Públicas" no Google Calendar.
// ==================================================================================

export const CLINIC_CALENDARS: User[] = [
  {
    id: 'cal_001',
    calendarId: 'c_1887...group.calendar.google.com', // Substitua pelo ID real da agenda pública
    name: 'Dr. Fernando Cinagava',
    email: 'fernando@clinica.com',
    phone: '(11) 99999-9999',
    password: '' // Não necessário para acesso público
  },
  {
    id: 'cal_002',
    calendarId: 'primary', // 'primary' geralmente não funciona bem com API Key pública, prefira o ID completo
    name: 'Agenda Geral / Recepção',
    email: 'contato@clinica.com',
    phone: '(11) 3333-3333',
    password: ''
  },
  {
    id: 'cal_003',
    calendarId: 'en.brazilian#holiday@group.v.calendar.google.com', // Exemplo de calendário público real (Feriados) para teste
    name: 'Feriados (Teste de Conexão)',
    email: 'google@google.com',
    phone: '',
    password: ''
  }
];

// Mantenha INITIAL_APPOINTMENTS vazio ou com dados mínimos, pois agora carregaremos da API
const today = new Date();
export const INITIAL_APPOINTMENTS: Appointment[] = [];
