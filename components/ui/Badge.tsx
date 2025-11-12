
import React from 'react';
import { MaintenanceStatus, MaintenancePriority } from '../../types';

interface StatusBadgeProps {
  status: MaintenanceStatus;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const statusStyles: { [key in MaintenanceStatus]: string } = {
    [MaintenanceStatus.ABERTO]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [MaintenanceStatus.EM_ANDAMENTO]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [MaintenanceStatus.AGUARDANDO_APROVACAO]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [MaintenanceStatus.RESOLVIDO]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    [MaintenanceStatus.ENCERRADO]: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300',
    [MaintenanceStatus.CANCELADO]: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusStyles[status]}`}>
      {status}
    </span>
  );
};


interface PriorityBadgeProps {
  priority: MaintenancePriority;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority }) => {
  const priorityStyles: { [key in MaintenancePriority]: string } = {
    [MaintenancePriority.CRITICO]: 'bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 border border-red-500',
    [MaintenancePriority.ALTO]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [MaintenancePriority.MEDIO]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [MaintenancePriority.BAIXO]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${priorityStyles[priority]}`}>
        {priority === MaintenancePriority.CRITICO && <i className="fas fa-exclamation-triangle mr-1"></i>}
        {priority}
    </span>
  );
};
