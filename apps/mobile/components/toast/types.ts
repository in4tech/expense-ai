export type ToastStatus = "error" | "warning" | "success";

export type ShowToastOptions = {
  status: ToastStatus;
  title: string;
  description?: string;
  /** Auto-hide after this many ms. Default 2000. */
  durationMs?: number;
};

export type ToastPayload = ShowToastOptions & {
  id: number;
  durationMs: number;
};
