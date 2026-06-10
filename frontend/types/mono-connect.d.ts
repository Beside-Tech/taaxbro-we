declare module '@mono.co/connect.js' {
  export interface MonoConnectOptions {
    key: string;
    scope?: string;
    onSuccess?: (payload: { code: string }) => void;
    onClose?: () => void;
    [key: string]: unknown;
  }

  export class MonoConnect {
    constructor(options: MonoConnectOptions);
    open(): void;
  }
}
