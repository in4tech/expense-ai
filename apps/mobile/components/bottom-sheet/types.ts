import type { ReactNode } from 'react';

export type BottomSheetActionVariant = 'default' | 'destructive' | 'cancel';

export type BottomSheetAction = {
  label: string;
  variant?: BottomSheetActionVariant;
  onPress?: () => void;
};

export type BottomSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  message?: string;
  /** Renders under title/message when you need custom layout instead of plain text. */
  children?: ReactNode;
  /** Stacked full-width actions, top to bottom. */
  actions?: BottomSheetAction[];
  /** Close after an action fires. Default true. */
  closeOnAction?: boolean;
  /** Close when backdrop is pressed. Default true. */
  closeOnBackdropPress?: boolean;
};
