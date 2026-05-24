"use client";

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }));
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

interface ToastOptions {
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const useToast = () => {
  const addToast = useToastStore((state) => state.addToast);

  const trigger = (
    type: ToastType,
    title: string,
    messageOrOptions?: string | ToastOptions,
    options?: ToastOptions
  ) => {
    let message: string | undefined = undefined;
    let action: { label: string; onClick: () => void } | undefined = undefined;

    if (typeof messageOrOptions === 'string') {
      message = messageOrOptions;
      if (options && typeof options === 'object') {
        action = options.action;
      }
    } else if (messageOrOptions && typeof messageOrOptions === 'object') {
      message = messageOrOptions.message;
      action = messageOrOptions.action;
    }

    addToast({ type, title, message, action });
  };

  return {
    success: (title: string, messageOrOptions?: string | ToastOptions, options?: ToastOptions) =>
      trigger('success', title, messageOrOptions, options),
    error: (title: string, messageOrOptions?: string | ToastOptions, options?: ToastOptions) =>
      trigger('error', title, messageOrOptions, options),
    warning: (title: string, messageOrOptions?: string | ToastOptions, options?: ToastOptions) =>
      trigger('warning', title, messageOrOptions, options),
    info: (title: string, messageOrOptions?: string | ToastOptions, options?: ToastOptions) =>
      trigger('info', title, messageOrOptions, options),
    toast: (toast: Omit<Toast, 'id'>) => addToast(toast),
  };
};
