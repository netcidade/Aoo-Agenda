import React from 'react';
import { Appointment, Service } from '../types';
import { Badge } from './Badge';
import { Calendar, Clock, Banknote } from 'lucide-react';

interface AppointmentCardProps {
  appointment: Appointment;
  service: Service;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appointment, service }) => {
  const dateObj = new Date(appointment.date);
  
  // Format date nicely
  const dateStr = dateObj.toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });
  
  const timeStr = dateObj.toLocaleTimeString('pt-BR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  const isGoogleEvent = !!appointment.googleEventId;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow duration-200 relative overflow-hidden">
      {isGoogleEvent && (
        <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden">
           <div className="bg-blue-500 text-white text-[10px] py-1 px-6 absolute top-2 -right-6 rotate-45 font-bold shadow-sm">
             GOOGLE
           </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-3 pr-4">
        <h3 className="font-semibold text-lg text-gray-900 line-clamp-1" title={service.name}>
          {service.name}
        </h3>
        <Badge status={appointment.status} />
      </div>
      
      <div className="space-y-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-brand-500" />
          <span className="capitalize">{dateStr}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-500" />
          <span>{timeStr} • {service.durationMinutes} min</span>
        </div>
        <div className="flex items-center gap-2">
          <Banknote className="w-4 h-4 text-brand-500" />
          <span>R$ {service.price.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
    </div>
  );
};