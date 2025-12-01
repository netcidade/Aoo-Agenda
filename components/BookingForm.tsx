import React, { useState } from 'react';
import { Service } from '../types'; // Adjust path if needed. 
// Note: In a real app we would pass these as props, but importing for simplicity here as requested by single block structure logic.
import { AVAILABLE_SERVICES as servicesList } from '../constants'; 
import { Button } from './Button';
import { ChevronLeft, CheckCircle2 } from 'lucide-react';

interface BookingFormProps {
  onCancel: () => void;
  onConfirm: (serviceId: string, date: Date) => void;
}

export const BookingForm: React.FC<BookingFormProps> = ({ onCancel, onConfirm }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [date, setDate] = useState<string>('');
  const [time, setTime] = useState<string>('');

  const handleServiceSelect = (id: string) => {
    setSelectedServiceId(id);
    setStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedServiceId && date && time) {
      const dateTime = new Date(`${date}T${time}`);
      onConfirm(selectedServiceId, dateTime);
    }
  };

  if (step === 1) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" onClick={onCancel} className="!p-1">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h2 className="text-xl font-bold text-gray-900">Selecione o Serviço</h2>
        </div>

        <div className="grid gap-4">
          {servicesList.map((service) => (
            <button
              key={service.id}
              onClick={() => handleServiceSelect(service.id)}
              className="flex flex-col text-left p-4 rounded-xl border border-gray-200 hover:border-brand-500 hover:bg-brand-50 transition-all bg-white shadow-sm"
            >
              <div className="flex justify-between w-full mb-1">
                <span className="font-semibold text-gray-900">{service.name}</span>
                <span className="font-bold text-brand-600">R$ {service.price.toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">{service.description}</p>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded w-fit">
                {service.durationMinutes} minutos
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const selectedService = servicesList.find(s => s.id === selectedServiceId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" onClick={() => setStep(1)} className="!p-1">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h2 className="text-xl font-bold text-gray-900">Escolha o Horário</h2>
      </div>

      <div className="bg-brand-50 p-4 rounded-lg mb-6 border border-brand-100">
        <p className="text-sm text-brand-800 font-medium">Serviço selecionado:</p>
        <p className="text-brand-900 font-bold">{selectedService?.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input
            type="date"
            required
            min={new Date().toISOString().split('T')[0]}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Horário</label>
          <input
            type="time"
            required
            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-shadow"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
        </div>

        <div className="pt-4">
          <Button type="submit" fullWidth variant="primary" disabled={!date || !time}>
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Confirmar Agendamento
          </Button>
        </div>
      </form>
    </div>
  );
};