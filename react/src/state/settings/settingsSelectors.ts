import type { Entitlement, PurchaseState } from '../../types/app';

export function resolveEntitlement(input?: { entitlement?: Entitlement; isPremium?: boolean } | null): Entitlement {
  if (input?.entitlement === 'premium' || input?.entitlement === 'free') {
    return input.entitlement;
  }
  if (typeof input?.isPremium === 'boolean') {
    return input.isPremium ? 'premium' : 'free';
  }
  return 'free';
}

export function resolvePurchaseState(input?: { purchaseState?: PurchaseState } | null): PurchaseState {
  if (input?.purchaseState === 'active' || input?.purchaseState === 'inactive' || input?.purchaseState === 'unknown') {
    return input.purchaseState;
  }
  return 'unknown';
}

export function isPremium(state: { entitlement: Entitlement }): boolean {
  return state.entitlement === 'premium';
}
