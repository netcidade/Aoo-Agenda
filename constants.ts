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

// Dados para simular a resposta da API do Google Calendar
export const MOCK_CALENDARS: User[] = [
  {
    id: 'cal_001',
    calendarId: 'primary',
    name: 'Agenda Pessoal',
    email: 'admin@exemplo.com',
    phone: '',
    password: 'pass_pessoal'
  },
  {
    id: 'cal_002',
    calendarId: 'dr_fernando_cal_id',
    name: 'Dr. Fernando Cinagava',
    email: 'fernando@clinica.com',
    phone: '',
    password: 'pass_fernando'
  },
  {
    id: 'cal_003',
    calendarId: 'sala_procedimentos_id',
    name: 'Sala de Procedimentos',
    email: 'sala1@clinica.com',
    phone: '',
    password: 'pass_sala01'
  }
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(nextWeek.getDate() + 7);

export const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'a1',
    serviceId: 's1',
    date: new Date(today.setHours(14, 0, 0, 0)).toISOString(),
    status: AppointmentStatus.CONFIRMED,
  },
  {
    id: 'a2',
    serviceId: 's3',
    date: new Date(tomorrow.setHours(10, 30, 0, 0)).toISOString(),
    status: AppointmentStatus.PENDING,
  },
  {
    id: 'a3',
    serviceId: 's2',
    date: new Date(nextWeek.setHours(16, 0, 0, 0)).toISOString(),
    status: AppointmentStatus.CONFIRMED,
  }
];