import * as React from "react";

export type ToastProps = {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

type ToastActionElement = React.ReactElement<{
  onClick: () => void;
}>;

export type ToastActionProps = {
  altText: string;
  children: ToastActionElement;
};

type ToasterToast = ToastProps & {
  action?: ToastActionElement;
};

interface ToastContextValue {
  toasts: ToasterToast[];
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function useToast() {
  const context = React.useContext(ToastContext);

  if (!context) {
    const toasts: ToasterToast[] = [];
    
    const toast = (props: ToastProps) => {
      console.log('Toast:', props);
    };
    
    const dismiss = (id: string) => {
      console.log('Dismiss toast:', id);
    };
    
    return { toasts, toast, dismiss };
  }

  return context;
} 