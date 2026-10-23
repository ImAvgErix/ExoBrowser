export type EntitlementState = 'unknown' | 'owned' | 'unverified' | 'notOwned'
export type EntitlementPrimaryAction = 'play' | 'install' | 'update' | 'none'

export type EntitlementActionGame = {
  installed: boolean
  owned?: boolean
  entitlementState?: EntitlementState
  updateAvailable?: boolean
  canInstall?: boolean
  primaryAction?: EntitlementPrimaryAction | string
  selectedVariantId?: string | null
  variants?: Array<{ updateAvailable?: boolean }>
}

export function resolveEntitlementPrimaryAction(game: EntitlementActionGame): EntitlementPrimaryAction {
  if (game.entitlementState === 'notOwned') return 'none'
  if (game.entitlementState === 'unverified' && !game.installed) return 'none'
  if (game.installed && game.updateAvailable) return 'update'
  if (game.installed && !game.selectedVariantId && game.variants?.some((variant) => variant.updateAvailable)) return 'update'
  if (game.installed) return 'play'
  if (game.canInstall && (game.owned === true || game.primaryAction === 'install')) return 'install'
  if (game.primaryAction === 'play' || game.primaryAction === 'update' || game.primaryAction === 'none') {
    return game.primaryAction
  }
  return 'none'
}

export function canExposeBuyUrl(game: Pick<EntitlementActionGame, 'installed' | 'owned' | 'entitlementState'>): boolean {
  if (game.entitlementState === 'unverified') return false
  if (game.entitlementState === 'notOwned') return true
  return !game.installed && !game.owned
}

export function blockedEntitlementLabel(
  game: Pick<EntitlementActionGame, 'entitlementState'>,
  action: EntitlementPrimaryAction,
): string | null {
  if (action !== 'none') return null
  if (game.entitlementState === 'notOwned') return 'Buy again'
  if (game.entitlementState === 'unverified') return 'Unavailable'
  return null
}
