export interface ToteItem {
  id: string;
  sku: string;
  name: string;
  quantity: number;
  imageUrl?: string | null;
}

export interface ToteContentsResponse {
  toteId: string;
  items: ToteItem[];
  updatedAt: string;
}

export interface ScanHistory {
  id: string;
  toteId: string;
  scannedAt: Date;
  itemCount: number;
  success: boolean;
  errorMessage?: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
  retryable?: boolean;
}

export enum ScanStatus {
  IDLE = 'IDLE',
  SCANNING = 'SCANNING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR'
}

export interface BarcodeValidationResult {
  valid: boolean;
  errors: string[];
}

export const BARCODE_PATTERNS = {
  ALPHANUMERIC: /^[a-zA-Z0-9-_]+$/,
  NUMERIC_ONLY: /^\d+$/,
  TOTE_ID: /^[a-zA-Z0-9]+-[a-zA-Z0-9]+-\d+$/
} as const;

export const VALIDATION_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 50,
  DEBOUNCE_TIME: 300,
  SCAN_COOLDOWN: 500
} as const;
