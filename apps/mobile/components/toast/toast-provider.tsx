import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "@/hooks/use-color-scheme";

import { ToastBanner } from "@/components/toast/toast-banner";
import type { ShowToastOptions, ToastPayload } from "@/components/toast/types";

const DEFAULT_DURATION_MS = 2000;

type ToastContextValue = {
  showToast: (options: ShowToastOptions) => void;
  dismissToast: () => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const dismissRef = useRef<(() => void) | null>(null);

  const showToast = useCallback((options: ShowToastOptions) => {
    const durationMs =
      typeof options.durationMs === "number" && options.durationMs > 0
        ? options.durationMs
        : DEFAULT_DURATION_MS;
    setToast({
      status: options.status,
      title: options.title,
      description: options.description,
      durationMs,
      id: Date.now(),
    });
  }, []);

  const dismissToast = useCallback(() => {
    dismissRef.current?.();
  }, []);

  const handleDismissed = useCallback(() => {
    setToast(null);
  }, []);

  const bindDismiss = useCallback((fn: (() => void) | null) => {
    dismissRef.current = fn;
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [showToast, dismissToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <ToastBanner
          key={toast.id}
          toast={toast}
          isDark={isDark}
          onDismissed={handleDismissed}
          onExposeDismiss={bindDismiss}
        />
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return ctx;
}
