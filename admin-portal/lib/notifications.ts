'use client';

import { toast, type ToastOptions } from 'react-hot-toast';

export type NotificationType = 'success' | 'error' | 'info';

const DEFAULT_OPTIONS: ToastOptions = {
  duration: 3500,
};

export function notify(
  message: string,
  type: NotificationType = 'info',
  options?: ToastOptions,
) {
  const merged = { ...DEFAULT_OPTIONS, ...options };
  switch (type) {
    case 'success':
      toast.success(message, merged);
      break;
    case 'error':
      toast.error(message, merged);
      break;
    default:
      toast(message, {
        icon: 'ℹ️',
        ...merged,
      });
      break;
  }
}

export const notifySuccess = (message: string, options?: ToastOptions) =>
  notify(message, 'success', options);

export const notifyError = (message: string, options?: ToastOptions) =>
  notify(message, 'error', options);

export const notifyInfo = (message: string, options?: ToastOptions) =>
  notify(message, 'info', options);
