import { InjectionToken } from '@angular/core';

export interface SsrRenderState {
  serviceUnavailable: boolean;
  error?: unknown;
}

export const SSR_RENDER_STATE = new InjectionToken<SsrRenderState>('SSR_RENDER_STATE');

export function createSsrRenderState(): SsrRenderState {
  return {
    serviceUnavailable: false
  };
}
