import React from 'react';
import { AppointmentStatus } from '../types';

interface BadgeProps {
  status: AppointmentStatus;
}

export const Badge: React.FC<BadgeProps> = ({ status }) => {
  let colorClass = "";
  
  switch (status) {
    case AppointmentStatus.CONFIRMED:
      colorClass = "bg-green-100 text-green-800 border-green-200";
      break;
    case AppointmentStatus.PENDING:
      colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
      break;
    case AppointmentStatus.CANCELLED:
      colorClass = "bg-red-100 text-red-800 border-red-200";
      break;
    case AppointmentStatus.COMPLETED:
      colorClass = "bg-gray-100 text-gray-800 border-gray-200";
      break;
  }

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClass}`}>
      {status}
    </span>
  );
};