declare module 'react-hot-toast' {
  export interface ToastOptions {
    icon?: string
    duration?: number
    style?: React.CSSProperties
  }

  export function toast(message: string, options?: ToastOptions): string
  export namespace toast {
    export function success(message: string, options?: ToastOptions): string
    export function error(message: string, options?: ToastOptions): string
    export function loading(message: string, options?: ToastOptions): string
    export function dismiss(toastId?: string): void
  }
  export default toast
}
