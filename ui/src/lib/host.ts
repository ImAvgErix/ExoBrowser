import type { Cutout } from './hostedCutouts'
import type { AppUpdateResponse } from './hostWire'
import { report } from './report'
import type { MusicPlayback, MusicService, MusicAction } from './music'
import type { PlayerAction, PlayerActOptions, PlayerRoomState, PlayerView, PlayerViewData, PlayerViewOptions } from './player'
import type { DiscordChannels, DiscordPlace, DiscordEvent, DiscordGuide, DiscordInvite, DiscordMemberSearch, DiscordResource, DiscordRole, DiscordUser, DiscordEmojis, DiscordFriend, DiscordGif, DiscordFavoriteGif, DiscordMemberList, DiscordProfile, DiscordProfileExtras, DiscordStickerGroup, DiscordThread, DiscordPresence, DiscordHome, DiscordReactionEvent, DiscordVoice, DiscordMessage, DiscordMessageEvent, DiscordSignInStep, DiscordState, DiscordStatus, DiscordUnread, DiscordNotice, DiscordForumTag, DiscordForYouItem, DiscordUnreadChannel, DiscordSearchFilters, DiscordShopCatalog, DiscordShopProduct, DiscordPaymentChoice, DiscordShopPrice, DiscordRailItem } from './discord'
import type { CaptureExport, CaptureItem, CaptureSettings, CaptureState } from './capture'
import type { AccountSettings, DiscordAccount, DiscordAccountAction, DiscordClientSettings } from './discordPrefs'
import type { AppCommand, AppInfo, InteractionEvent } from './discordApps'
import { HOST_PROTOCOL_VERSION, validHostEvent, validateHostResult } from './hostContract'
import { cancelTimedOutRequest, requestTimeoutMs } from './bridgeCancellation'
/** Typed bridge to the .NET WebView2 host. Falls back to mock data in browser dev. */

import {
  blockedEntitlementLabel,
  canExposeBuyUrl,
  resolveEntitlementPrimaryAction,
  type EntitlementPrimaryAction,
  type EntitlementState as GameEntitlementState,
} from './entitlementActions'

export type StoreId =
  | 'steam'
  | 'epic'
  | 'gog'
  | 'riot'
  | 'xbox'
  | 'ea'
  | 'ubisoft'
  | 'battlenet'
  | 'amazon'
  | 'rockstar'
  | 'itch'
  | 'minecraft'
  | 'roblox'
  | 'paradox'
  | 'wargaming'
  | 'local'

export type PrimaryAction = EntitlementPrimaryAction
export type EntitlementState = GameEntitlementState
export type SortMode = 'name' | 'installed' | 'recent' | 'played' | 'size' | 'store'


/** A Steam collection, shown as a Library shelf. */

/** One upscaler file in one folder of the game. */
export type DlssStatusItem = {
  /** Path inside the install folder; sent back to act on this file. */
  key: string
  fileName: string
  /** Folder inside the install, or null at its top. */
  folder?: string | null
  displayName?: string
  api?: string | null
  currentVersion?: string | null
  fileVersion?: string | null
  currentRelease?: string | null
  latestVersion?: string | null
  latestRelease?: string | null
  state?: 'current' | 'outdated' | 'newer' | 'unknown'
  /** shipped: the game's own file. exo: Exo's write. reverted: the store put the original back over Exo's write. changed: a game update replaced Exo's write. other: another tool swapped it. */
  origin?: 'shipped' | 'exo' | 'reverted' | 'changed' | 'other'
  originalVersion?: string | null
  originalState?: 'saved' | 'damaged' | null
  canUpdate?: boolean
  canRestore?: boolean
  skipReason?: string | null
}

export type DlssStatus = {
  ok?: boolean
  message?: string | null
  /** The anti-cheat Exo found. Nothing changes unless consent is given. */
  antiCheat?: string | null
  /** With anti-cheat: never (Riot, Vanguard), available (the user may allow it for this game) or given. */
  consent?: 'never' | 'available' | 'given' | null
  items?: DlssStatusItem[]
}

/** What one press did at a single file. */
export type DlssFileOutcome = {
  fileName?: string
  folder?: string | null
  state?: 'updated' | 'skipped' | 'failed' | 'restored'
  before?: string | null
  after?: string | null
  message?: string
}

export type DlssRunResult = {
  ok: boolean
  updated?: number
  skipped?: number
  failed?: number
  message?: string
  files?: DlssFileOutcome[]
}

/**
 * A game's line from the Exo Shaders engine (Library > Shaders).
 * noApp: Exo Shaders is not installed. warmed: compiled for this driver. stale:
 * the driver or the game changed since. ready and record: the engine can compile
 * it (record: after a recording). unsupported: also a game the engine does not list.
 */
/** Steam's current art for a game (newer games keep it under hashed folders). */
export type StoreArt = { poster?: string | null; hero?: string | null; capsule?: string | null; header?: string | null }
/** Lucid's own settings as Exo shows them (Lucid Voice is never among them). Times are "HH:mm" on half-hour steps. */
export type LucidSettings = {
  headphone: { id: string; name: string; chosen: boolean }
  favorites: string[]
  gameMode: boolean
  keepOnAltTab: boolean
  onlyWhileGaming: boolean
  nightShift: boolean
  nightStart: string
  nightEnd: string
  nightSync: boolean
  notifications: boolean
  discord: boolean
  /** Lucid's cue sounds, 0 (off) to 100: switching on or off, and a game detected. */
  toggleSound: number
  detectSound: number
}
/** Lucid on this PC: found or not, its version, running, Start with Exo, Equalizer APO's device picker, and its settings (null until Lucid has saved some). */
export type LucidState = {
  ok: boolean; message?: string | null; found: boolean; version: string | null; running: boolean; voiceOn: boolean; startWithExo: boolean; devices: boolean
  settings: LucidSettings | null
}
/** One change to Lucid's settings; favorites by headphone id. */
export type LucidChange = Partial<Omit<LucidSettings, 'headphone' | 'favorites'>> & {
  headphone?: string
  favorites?: Record<string, boolean>
}
/** A headphone Lucid has a tuning for, as its picker lists it. */
export type LucidHeadphone = { id: string; model: string; brand: string; category: string; grade: string; keywords: string }
export type VoiceTuneWindows = { level: number | null; hardware: boolean; muted: boolean; ducking: number; processing: string | null }
export type VoiceTuneResult = {
  ok: boolean; message?: string | null; cancelled?: boolean; kept: boolean; windows: VoiceTuneWindows; before?: string; after?: string
  mic?: { title: string; kind: string; app: string | null; tips: string[]; steps: { name: string; versus: 'better' | 'equal' | 'worse'; steps: string }[]; exoStepsAside: boolean } | null
  report: {
    heard: boolean; roomDb: number; humHz: number | null; bandLimited: boolean; peakDb: number; clipped: number
    speechDb: number; softDb: number; loudDb: number; pitchHz: number; pops: number; typingDb: number
    tuning: { suppressionLimitDb: number; gainDb: number; spectrum: number[] }
  }
}

/** What the microphone's chain ran on the sound just now (see VoiceStages in the host). */
export type VoiceStages = {
  profile: 'exo' | 'custom'
  suppression: 'standard' | 'on' | 'light' | 'mic' | 'loading' | 'missing' | 'off'; suppressionLimitDb: number
  focus: boolean; gain: 'windows' | 'off'
  /** Echo cancellation as a call on the chosen speakers runs it: on, not run on headphones or a headset, or off. */
  echo: 'on' | 'head' | 'off'
  tuned: boolean
}
/** NVIDIA's noise removal on this PC: none (no RTX card, or its driver is too old), fetching it, or ready. */
/** The live microphone: its level, the level the gate judged (after noise suppression), what was sent, and whether the gate is open. */
export type MicLevel = { level: number; gateLevel: number; after: number; voiced: boolean; stages: VoiceStages }

export type VoiceCheckResult = {
  ok: boolean; message?: string | null
  before?: string; after?: string
  peakDb?: number; clipped?: number; noiseDb?: number; noiseAfterDb?: number; voiceDb?: number; voicedShare?: number
}

/** Something Go Live can share: a screen or an app's window, its picture and icon (data URLs), and the game it is, if one. */
export type GoLiveSource = { id: string; kind: 'screen' | 'window'; title: string; app: string; icon?: string | null; thumb?: string | null; game?: string | null; height?: number }

/** What a Store card shows besides art: Steam's own regional price text ("19,99€"), its review summary, free to play, and when an unreleased game comes out. */
export type StoreFacts = { priceText?: string | null; wasText?: string | null; review?: string | null; reviewPercent?: number | null; free?: boolean; soon?: boolean; when?: string | null }

/** A Steam game on a Store shelf; prices in cents of currency (Steam's for the Windows region) when the list carries them. */
export type StoreTile = StoreFacts & { appId: string; name: string; final?: number | null; initial?: number | null; discount: number; currency?: string | null; art?: StoreArt | null }

/** Epic's free game: free now, or the dates it will be. */
export type StoreFreeGame = { title: string; url: string; images: string[]; from?: string | null; until?: string | null; now: boolean }

export type StoreHome = {
  ok: boolean
  message?: string
  at?: string
  hero?: StoreTile[]
  shelves?: { id: string; title: string; items: StoreTile[] }[]
  free?: StoreFreeGame[]
}

/** An official launcher that sells the game (Steam, Epic Games Store, GOG, Ubisoft Store), price in cents of currency; outside the US CheapShark's rows carry none. Steam's row has Steam's text. */
export type StoreOffer = { store: string; name: string; final?: number | null; initial?: number | null; discount: number; currency?: string | null; priceText?: string | null; wasText?: string | null; url: string }

export type StoreFit = 'recommended' | 'minimum' | 'below'

export type StoreGame = {
  ok: boolean
  message?: string
  appId: string
  name: string
  description?: string | null
  header?: string | null
  comingSoon: boolean
  released?: string | null
  developers: string[]
  publishers: string[]
  genres: string[]
  metacritic?: number | null
  reviewWord?: string | null
  reviewPercent?: number | null
  reviewCount: number
  /** Steam's most voted tags. */
  tags: string[]
  free: boolean
  /** Steam's own offer; the other launchers come from storeGameOffers. */
  offers: StoreOffer[]
  /** Trailers: a thumbnail, Steam's H.264 HLS stream and its sharper AV1 DASH stream. */
  media: { thumb: string; hls?: string | null; av1?: string | null }[]
  screenshots: string[]
  /** PC requirements in short, one row per part (OS, Processor, Graphics, Memory, ...), with this PC's part and the level it meets (null: not judged). */
  specs?: { label: string; minimum?: string | null; recommended?: string | null; mine?: string | null; meets?: StoreFit | null }[]
  /** The level this PC meets as a whole; null when its processor and graphics card could not be judged. */
  fit?: StoreFit | null
  art?: StoreArt | null
}

export type WishItem = StoreFacts & { appId: string; name: string; addedAt: string; final?: number | null; initial?: number | null; discount: number; currency?: string | null; art?: StoreArt | null }

export type ShaderStatus = {
  ok: boolean
  state: 'noApp' | 'warmed' | 'stale' | 'ready' | 'record' | 'unsupported' | 'error'
  reason?: string | null
  /** The engine's own id for this game (for its game.compile), when it lists the game. */
  engineId?: string | null
  /** Local time of the app's last compile, with the driver it compiled for. */
  warmed?: { at: string; driver?: string | null } | null
}

/** The main screen's HDR: can it, how bright it really gets (EDID), calibrated, and a plain verdict. */
export type HdrState = {
  supported: boolean
  on?: boolean
  name?: string | null
  peakNits?: number | null
  calibrated?: boolean
  verdict?: 'great' | 'good' | 'weak' | 'unknown'
}

/** What PCGamingWiki says about a game's HDR, and its Auto/Always/Never choice. */
/** What a screen's cable carries: format (rgb, or YCbCr 444/422/420), bits per color, Full or Limited range (YCbCr is always Limited). */
export type OutputColor = { format: 'rgb' | '444' | '422' | '420'; bpc: number; full: boolean }

/** One screen in System > Display: refresh rates (Windows) and output color (its GPU's driver; vendor null when Exo can't reach it). */
export type DisplayScreen = {
  id: string
  name: string
  main: boolean
  hdr: boolean
  vendor: 'nvidia' | 'amd' | 'intel' | null
  refresh: number
  refreshes: number[]
  color: OutputColor | null
  /** The driver picks the color itself (NVIDIA's default color settings). */
  auto: boolean
  /** Every format, depth and range the link takes at the current refresh rate, no deeper than the panel. */
  supported: OutputColor[]
  /** scaling: best includes No scaling on the GPU; over: and "Override the scaling set by games" on (both NVIDIA, where the driver says). */
  best: { refresh: number; color: OutputColor | null; why: string | null; scaling: boolean; over: boolean }
  /** Every part of best is what the screen runs now. */
  isBest: boolean
  /** Color sliders; nvidia is "Use NVIDIA color settings" (null on AMD, which has no such choice). Null when the driver has none. */
  adjust: { nvidia: boolean | null; controls: ColorControl[] } | null
  /** NVIDIA scaling: the mode and whether the GPU (else the screen) scales; null off NVIDIA. */
  /** over: "Override the scaling mode set by games and programs" (null when the driver doesn't say). */
  scaling: { mode: ScalingMode | 'default'; gpu: boolean; over: boolean | null } | null
}

export type ScalingMode = 'aspect' | 'full' | 'none' | 'integer'

/** One color slider: gamma is x100 (100 = 1.00); normal is the driver's default. */
export type ColorControl = { key: string; label: string; value: number; min: number; max: number; step: number; normal: number; unit: string }

/** System > Display: a change applies and keeps itself. */
/** A graphics driver update's progress. */
export type DriverProgress = { stage: 'idle' | 'downloading' | 'unpacking' | 'waiting' | 'installing' | 'done' | 'failed'; percent: number; message: string | null }

/**
 * System > Graphics > Driver and profile's driver row: the installed driver and the newest one for this card, from the
 * vendor whose GPU Exo talks to (null: none it can update). NVIDIA's is Game Ready or Studio; AMD's is AMD Software:
 * Adrenalin Edition, recommended or optional; Intel's is its graphics driver.
 */
export type DriverState = {
  ok: boolean
  message?: string | null
  vendor: 'nvidia' | 'amd' | 'intel' | null
  card?: string | null
  installed?: string | null
  /** An NVIDIA RTX / Quadro card: NVIDIA's RTX Enterprise driver, no Game Ready or Studio choice. */
  workstation?: boolean
  latest?: { version: string; size: number; released: string | null; kind: 'game' | 'studio' | 'hotfix' | 'security' | 'workstation' | 'recommended' | 'optional' | 'intel'; page?: string | null } | null
  update?: boolean
  /** Why an update can't start now (a game runs, a Discord call is on, Exo Shaders compiles), or null. */
  blocked?: string | null
  progress?: DriverProgress
}

export type DisplayState = {
  ok: boolean
  message?: string | null
  displays: DisplayScreen[]
  /** RTX Video on the NVIDIA card (null without one; a null field: the card or driver has none). Super resolution 0 off, 1-4 quality, 5 Auto; HDR 0 off, 5 on. */
  video: { superResolution: number | null; hdr: number | null } | null
}

export type DisplayChange = {
  display: string; best?: boolean; refresh?: number; format?: string; bpc?: number; full?: boolean
  /** The driver's own color settings (NVIDIA "Use default color settings"). */
  auto?: boolean
  /** action 'video': RTX Video Super resolution (0-5) or HDR. */
  superResolution?: number; hdr?: boolean
  /** action 'override': the screen's scaling overrides what games ask for. */
  override?: boolean
  scaling?: ScalingMode; scalingGpu?: boolean
  /** action 'adjust': nvidia switches "Use NVIDIA color settings", key + value set one slider, reset puts all to normal. */
  nvidia?: boolean; key?: string; value?: number; reset?: boolean
}

export type HdrGame = {
  ok: boolean
  message?: string | null
  hdr?: 'true' | 'false' | 'hackable' | 'unknown'
  mode?: 'auto' | 'on' | 'off'
}

/** One choice row for GraphicsControl: the choice held now and the choices offered. */
export type GraphicsRow = {
  key: string
  label: string
  detail: string
  /** A choice id; "custom" when another tool set a value Exo has no name for. */
  choice: string
  choices: { id: string; label: string }[]
}

/** One AMD or Intel setting to set by hand, in plain words, next to what their driver holds (only when Exo can't reach their driver). */
export type GpuProfileItem = { key: string; label: string; value: string; why: string; current?: string | null }

/**
 * System > Graphics > Driver and profile: Exo's global profile for this PC's GeForce series, G-SYNC or No G-SYNC,
 * for its Radeon, with an Anti-Lag choice, or for its Intel GPU, with a Low latency choice.
 * status: applied (the driver holds it all), changed (applied before, something
 * moved since), ready (not applied), manual (AMD or Intel when Exo can't reach their driver: set by hand), none (no GPU Exo can tune).
 */
export type GpuProfile = {
  ok: boolean
  message?: string | null
  vendor?: 'nvidia' | 'amd' | 'intel' | null
  gpu?: string | null
  /** GeForce series: 10, 16, 20, 30, 40, 50; 0 when not NVIDIA. */
  series: number
  /** The main screen; vrr as NVIDIA's driver reports G-SYNC, AMD's FreeSync, or Intel's driver reports Adaptive Sync. */
  screen: { name?: string | null; hz: number; vrr: boolean }
  status: 'applied' | 'changed' | 'ready' | 'manual' | 'none'
  /** The variant status compares with: the applied one, else what the screen reports. */
  gsync: boolean
  canUndo: boolean
  /** Changed since a driver update (the driver's version moved since Exo applied it). */
  driverUpdated: boolean
  /** Set by hand (manual) only. */
  items: GpuProfileItem[]
  /** Radeon: Anti-Lag while a game Exo launched runs (games), always, or off. */
  antiLag?: RadeonAntiLag | null
  /** Intel: Low latency mode on, on with boost, or off. */
  lowLatency?: IntelLowLatency | null
  /** Radeon and Intel: what the profile does, in one line. */
  summary?: string | null
}

export type RadeonAntiLag = 'games' | 'always' | 'off'
export type IntelLowLatency = 'on' | 'boost' | 'off'
/** XeSS frame generation for one game: the game's own choice, or the driver's 2x, 3x or 4x override. */
export type IntelFrameGen = 'game' | '2x' | '3x' | '4x'

/** System > Graphics: what the GPU reports right now (a Radeon's, through AMD's driver); ok false when nothing to show. */
export type GpuSensors = {
  ok: boolean
  temperature?: number | null
  hotspot?: number | null
  watts?: number | null
  clock?: number | null
  vramUsed?: number | null
  vramTotal?: number | null
  fan?: number | null
  usage?: number | null
}

/**
 * Game sheet > driver frame generation: whether this PC has it; on a Radeon, Fluid Motion Frames on for the game and whether
 * AMD Software runs; on Intel, the game's XeSS frame generation.
 */
export type GpuGame = {
  ok: boolean
  message?: string | null
  vendor?: 'amd' | 'intel'
  supported?: boolean
  afmf?: boolean
  amdSoftware?: boolean
  frameGen?: IntelFrameGen
}

/** A Profile Inspector import. pick: the file's settings in plain words (nothing written yet). undo: the last import Undo puts back. */
export type GpuImportAnswer = {
  ok: boolean
  message?: string | null
  cancelled?: boolean
  preview?: { profile: string; items: { label: string; value: string }[]; unknown: number; leftOut: number } | null
  undo?: { profile: string; count: number } | null
}

/** System > This PC: one row per setup problem (none when all is well); power switches to Exo's plan for cpu, with Undo; chipset Exo updates (busy while it installs, applied while it waits for a restart, url only after a failed install). */
export type PcHealthItem = {
  key: 'ram' | 'rebar' | 'power' | 'chipset' | 'gamemode'
  label: string
  detail: string
  url?: string | null
  applied?: boolean
  canUndo?: boolean
  busy?: boolean
  /** The processor Exo's plan is tuned for ("Ryzen 5 5600X"), on the power row. */
  cpu?: string | null
  /** Nothing to do, said so: the chipset driver on its maker's newest. */
  current?: boolean
}
export type PcHealth = { ok: boolean; message?: string | null; items: PcHealthItem[] }

/** System > This PC > Interrupts: one PCI device, its interrupt now (msi, line, or none when it isn't running) and what Optimize does to it. */
export type InterruptDevice = {
  id: string
  name: string
  kind: string
  mode: 'msi' | 'line' | 'none'
  /** change: Optimize switches it; done: already MSI; keep: it can't or its driver won't; skip: Exo leaves it alone; restart: waits on a restart. */
  plan: 'change' | 'done' | 'keep' | 'skip' | 'restart'
  reason: string
  /** Exo switched it and can put it back. */
  changed: boolean
}
/** restart: Exo changed something since Windows started. result: after the restart, what took. */
export type Interrupts = { ok: boolean; message?: string | null; restart: boolean; result?: string | null; canUndo: boolean; devices: InterruptDevice[] }

/** One exact store entry represented by a grouped library card. */
export interface GameVariant {
  id: string
  store: StoreId | string
  installed: boolean
  owned?: boolean
  entitlementState?: EntitlementState
  updateAvailable?: boolean
  canInstall?: boolean
  primaryAction?: PrimaryAction | string
  path?: string | null
  launchTarget?: string | null
  playtimeMinutes?: number | null
  lastPlayedUtc?: string | null
  status: string
  /** Only true when Exo has revalidated this source's game process. */
  isRunning?: boolean
  /** Never offered for launcher, overlay, anti-cheat, or service processes. */
  canStop?: boolean
}

/** A folder of games on the Library's grid, made by the player; a game is in one folder at most. */
/** How a folder orders its games: its own order ('folder', the default) or one of the Library's sorts. */
export type FolderSort = 'folder' | SortMode
/** art: its own picture's address (on Exo's covers host), shown in place of its games' covers. */
export type LibraryFolder = { id: string; name: string; color?: string; sort?: FolderSort; art?: string | null; games: string[] }

export interface Game {
  id: string
  title: string
  store: StoreId | string
  /** Every store variant represented by this library entry. */
  stores?: Array<StoreId | string>
  /** Opaque display grouping key; never send it back as an action id. */
  canonicalTitleKey?: string | null
  /** Exact source projected into this card before the user chooses another source. */
  selectedVariantId?: string | null
  /** Exact sources available for the grouped card. */
  variants?: GameVariant[]
  installed: boolean
  owned?: boolean
  entitlementState?: EntitlementState
  updateAvailable?: boolean
  canInstall?: boolean
  primaryAction?: PrimaryAction | string
  path?: string | null
  coverUrl?: string | null
  coverSource?: string | null
  /** Process-local cache generation. Changes force WebView image revalidation. */
  artRevision?: number
  playtimeMinutes?: number | null
  sizeBytes?: number | null
  sizeApproximate?: boolean
  status: string
  deps: string[]
  launchNote: string
  launchTarget?: string | null
  /** Official storefront from the host. Absent when Buy must not appear. */
  buyUrl?: string | null
  lastPlayedUtc?: string | null
  isAddPortable?: boolean
  /** Only true when Exo has revalidated an in-root game process. */
  isRunning?: boolean
  /** Stop is never offered for a store client, overlay, or anti-cheat process. */
  canStop?: boolean
}

export interface InstallProgress {
  gameId: string
  phase: string
  percent?: number | null
  bytesDownloaded?: number | null
  bytesToDownload?: number | null
  bytesPerSecond?: number | null
  status: string
  canCancel: boolean
  isActive: boolean
}

/** An app Exo does the job of, as this PC has it. */
export interface ReplacedApp {
  id: string
  name: string
  detail: string
  installed: boolean
  leftovers: number
  bytes: number
  needsAdmin: boolean
}

export interface DependencyItem {
  id: string
  name: string
  status: string
  detail: string
  canOfferInstall: boolean
  officialUrl?: string | null
}

/**
 * Who each store Exo signs into is signed in as. Display names only; `key` is a
 * one-way tag the host maps back to an account. Null when the store is not on this PC.
 */
/** A gift waiting on Steam or Epic for this account (gifts.list); image is the store's wide art. */
export interface StoreGift {
  store: 'steam' | 'epic'
  id: string
  title: string
  image?: string | null
  sender?: string | null
  message?: string | null
}

export interface StoreGifts {
  ok: boolean
  /** Exo is signed in to Steam (Settings > Game stores > Steam's Sign in), so Steam's gifts can be read. */
  steamSignedIn: boolean
  gifts: StoreGift[]
}

export interface StoreAccounts {
  ok: boolean
  /** `remembered`: Steam keeps the sign-in; otherwise switching opens Steam's sign-in once. */
  steam: { current: string | null; accounts: Array<{ key: string; name: string; current: boolean; remembered: boolean }> } | null
  /**
   * Riot accounts Exo saved, plus the Riot Client's signed-in one (`saved` false until Exo
   * first switches away from it). `lastIn`: the Riot games that last played as this account.
   */
  riot: { current: string | null; accounts: Array<{ key: string; name: string; current: boolean; saved: boolean; lastIn: string[] }> } | null
  epic: {
    signedIn: boolean
    name: string | null
    /** The Epic Games Launcher is signed in as a different account. */
    launcherDiffers: boolean
    /** Legendary can import the Epic Games Launcher's sign-in. */
    canImport: boolean
    /** Accounts added for their hours only. */
    added: Array<{ key: string; name: string }>
  }
  gog: { signedIn: boolean; canSignOut: boolean }
  amazon: { signedIn: boolean; name: string | null }
}

export type AccountStore = 'steam' | 'epic' | 'gog' | 'amazon'
/** Stores whose client keeps several accounts Exo switches between. */
export type SwitchStore = 'steam' | 'riot'

export interface LauncherSettings {
  appVersion: string
  /** The last version whose What's New was shown (lib/whatsNew.ts); a new install starts at its own version. */
  whatsNewSeen?: string | null
  /** Motion is off when this or Windows' reduce-animations setting is on. */
  reduceMotion?: boolean
  textColour?: 'white' | 'grey' | string
  textSize?: 'small' | 'normal' | 'large' | string
  /** Liquid Glass (Settings › General › Glass): how much shows through it. */
  glass?: 'clear' | 'solid' | string
  /** Settings › General › Appearance (lib/appearance.ts). */
  appearance?: 'system' | 'light' | 'dark' | 'void' | string
  sortMode?: SortMode | string
  defaultInstallRoot?: string | null
  /** Canonical game key -> preferred exact store source. settings.set merges supplied entries; empty removes one. */
  preferredGameSources?: Record<string, string>
  recent?: string[]
  onboardingComplete?: boolean
  /** True when a Steam Web API key is saved on this PC. The key itself never arrives. */
  steamWebApiKeySet?: boolean
  itchApiKeySet?: boolean
  /** Public Riot ID (Name#TAG). Used to fetch tracker.gg hours. */
  riotId?: string | null
  riotHoursImported?: boolean
  framelessPinTop?: boolean
  framelessPinSide?: boolean
  showLibraryTools?: boolean
  /** Hours sum every Steam account and every Epic account on this PC. Off keeps a shared PC separate. */
  countHoursAcrossAccounts?: boolean
  /** HDR on for the main screen while a game that supports it runs, back off after. */
  hdrForGames?: boolean
  /** SDR content drawn with gamma 2.2 while a screen is in HDR (default on). */
  hdrSdrGamma?: boolean
  /** DeepFilterNet 3 on the microphone in Exo's own Discord calls (default on). */
  discordNoiseSuppression?: boolean
  /** Game focus: no Discord notifications while a game runs (default on). */
  discordQuietWhilePlaying?: boolean
  /** Epic, GOG and Amazon downloads pause while a game runs. */
  pauseDownloadsWhilePlaying?: boolean
  /** Download hours (0-23); null for any time. */
  downloadHoursStart?: number | null
  downloadHoursEnd?: number | null
  /** Epic, GOG and Amazon games update by themselves while the PC is idle. */
  autoUpdateGames?: boolean
  /** This PC's chipset driver (AMD's or Intel's) updates by itself while the PC is idle (default on). */
  autoUpdateChipset?: boolean
  /** Whose chipset driver this PC has and Exo updates: AMD's on a Ryzen, Intel's on an Intel processor (read-only: shows Keep the AMD or Intel chipset driver up to date). */
  chipset?: 'amd' | 'intel' | null
  /** Steam overlay for a Steam game Exo has not set yet (default off); Properties sets one game. */
  steamOverlayDefaultOn?: boolean
  /** Steam's and Epic's own pop-ups and sounds kept off (Settings > Game stores > Notifications and sounds). */
  quietStoreApps?: boolean
  /** The Library's folders, in their order on the grid. */
  libraryFolders?: LibraryFolder[]
  /** Games hidden from the Library (card ids); its Hidden view lists them. */
  hiddenGames?: string[]

  /** Debug builds or EXO_SHOW_DEV_KEYS=1: show Exo's own developer-app paste fields. */
  developerKeysVisible?: boolean
  igdbTwitchClientIdSet?: boolean
  igdbTwitchClientSecretSet?: boolean
  igdbTwitchConnected?: boolean
  steamGridDbKeySet?: boolean
  /** True when an OpenXBL key (Xbox time played) is saved. The key itself never arrives. */
  openXblKeySet?: boolean
}

export type HoursRefresh = { ok: boolean; profilePrivate?: boolean; message?: string }

/** CSS px within the title band. */
export type ChromeRect = { x: number; y: number; width: number; height: number }

/** The title band's clickable controls; the host makes the rest of the band a drag caption. */
export type ChromeLayout = {
  interactiveRegions?: ChromeRect[]
  /** Becomes Windows' maximize region (snap layouts flyout). */
  maximizeButton?: ChromeRect
}

export type RiotHoursRefresh = {
  ok: boolean
  profilePrivate?: boolean
  skipped?: boolean
  message?: string
  valorantMinutes?: number | null
  leagueMinutes?: number | null
  profileUrl?: string
}

export interface StoreStatus {
  store: string
  displayName: string
  agentPresent: boolean
  /** Whether the vendor's visible desktop client is actually installed. */
  clientPresent?: boolean
  /** Whether Exo's local command backend (Legendary, gogdl, Nile, or IPC) exists. */
  backendPresent?: boolean
  signedIn?: boolean
  cachePresent?: boolean
  detail?: string
  checkCode?: string
  checkedAtUtc?: string
}

export type StoreCheckState = 'complete' | 'partial' | 'failed'
export type StoreProbeState = 'present' | 'missing' | 'unavailable'
export type StoreReadiness = 'ready' | 'limited' | 'not_detected' | 'unknown'

export interface StoreLocalCheckItem {
  store: string
  client: StoreProbeState
  backend: StoreProbeState
  session: StoreProbeState
  cache: StoreProbeState
  readiness: StoreReadiness
  code: string
}

export interface StoreLocalCheck {
  state: StoreCheckState
  checkedAtUtc: string
  code: string
  stores: StoreLocalCheckItem[]
}

/** One UI-side failure handed to the host log. Never carries credentials or paths. */
export type AppLogEntry = {
  level: 'info' | 'warn' | 'error'
  message: string
  context?: string
  stack?: string
}

export interface LibraryResponse {
  games: Game[]
  count: number
  stores: StoreStatus[]
  progress?: InstallProgress
  queuedGameIds?: string[]
  pausedDownloads?: PausedDownload[]
  sortMode?: string
  recent?: string[]
}

export interface MissingDependency {
  id: string
  name: string
  status?: string
  canOfferInstall?: boolean
  officialUrl?: string | null
}

export interface LaunchResponse {
  ok: boolean
  message: string
  processId?: number | null
  backendStarted?: string | null
  handoffOnly?: boolean
  needsDependencies?: boolean
  missingDependencies?: MissingDependency[]
}

export interface InstallResponse {
  ok: boolean
  message: string
  path?: string | null
  progress?: InstallProgress
  queued?: boolean
  queuedGameIds?: string[]
  pausedDownloads?: PausedDownload[]
  handoffOnly?: boolean
  needsDependencies?: boolean
  missingDependencies?: MissingDependency[]
}

export interface PausedDownload {
  gameId: string
  title: string
  store: string
  action: 'install' | 'update'
  canResume: boolean
  reason: string
}

export interface ArtworkMutationResponse {
  ok: boolean
  cancelled?: boolean
  message?: string | null
  game?: Game | null
  artRevision?: number
}

/** One choice of a Properties dropdown; `sizeBytes` is what choosing it downloads. */
export interface PropertyChoice {
  value: string
  label: string
  detail?: string | null
  sizeBytes?: number | null
}

/**
 * A DLC or optional part of an installed game, and the bytes it takes on disk. `toggle` when
 * the store lets it be switched; otherwise `state` says where it stands ("Owned", "Not owned").
 */
export interface GameContent {
  id: string
  name: string
  enabled: boolean
  sizeBytes: number | null
  toggle: boolean
  state: string | null
}

/**
 * An installed game's Properties, as its store offers them. A null field (or an
 * empty choice list) is a row this game's store does not have.
 */
export interface GameProperties {
  ok: boolean
  message?: string
  store: string
  /** Exo's own launch options for this game; null when its launches take none. */
  launchOptions: string | null
  sizeBytes: number | null
  verifyLabel: string | null
  canBrowse: boolean
  /** The game is running: nothing that changes its files can start. */
  running: boolean
  autoUpdate: string | null
  autoUpdateChoices: PropertyChoice[]
  background: string | null
  backgroundChoices: PropertyChoice[]
  cloud: boolean | null
  /** Epic: saves sync on request. */
  cloudSync: boolean
  language: string | null
  languageChoices: PropertyChoice[]
  beta: string | null
  betaChoices: PropertyChoice[]
  betaCode: boolean
  contentLabel: string
  content: GameContent[] | null
  /** Steam library folder (Move); only with more than one. */
  folder: string | null
  folderChoices: PropertyChoice[]
  moving: { done: number; total: number } | null
  /** The store whose own Properties page opens for what Exo leaves to it. */
  storeProperties: string | null
  /** Steam overlay for this game; null for other stores. */
  overlay: boolean | null
}

/** The host leaves empty values out: each one a store does not have reads as null here, so its row stays hidden. */
const PROPERTY_NULLS = {
  launchOptions: null, sizeBytes: null, verifyLabel: null, autoUpdate: null, background: null, cloud: null, language: null,
  beta: null, content: null, folder: null, moving: null, storeProperties: null, overlay: null,
} as const
function withNulls(properties: GameProperties): GameProperties {
  return { ...PROPERTY_NULLS, ...properties }
}

export type GamePropertyKey =
  | 'launchOptions' | 'autoUpdate' | 'background' | 'cloud' | 'cloudSync' | 'language'
  | 'beta' | 'betaCode' | 'content' | 'folder' | 'storeProperties' | 'overlay'

/** Desktop app install (Spotify). */
export interface DesktopInstallResponse {
  ok: boolean
  message?: string | null
}

type HostRequest = { version: number; id: string; method: string; params?: Record<string, unknown> }
type HostResponse = { version?: number; id: string; ok: boolean; result?: unknown; error?: string }
type HostEvent = { version?: number; event: string; data?: unknown }

const pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void; cancel: () => void }>()
const eventHandlers = new Map<string, Set<(data: unknown) => void>>()

type BuyUrlCarrier = { id?: string; buyUrl?: string | null }

/** Library rows drop extra payload fields; keep the host URL by id. */
const buyUrlById = new Map<string, string>()

function rememberBuyUrls(rows: Array<BuyUrlCarrier | null | undefined> | undefined) {
  if (!rows) return
  for (const row of rows) {
    if (!row?.id) continue
    const url = row.buyUrl?.trim()
    if (url) buyUrlById.set(row.id, url)
    else buyUrlById.delete(row.id)
  }
}

function rememberEventBuyUrls(event: string, data?: unknown) {
  if (!data || typeof data !== 'object') return
  const payload = data as { games?: BuyUrlCarrier[] }
  if (event === 'library.updated') rememberBuyUrls(payload.games)
}

export function emitHostEvent(event: string, data?: unknown) {
  if (!validHostEvent(event, data)) return
  rememberEventBuyUrls(event, data)
  const set = eventHandlers.get(event)
  if (set) for (const handler of set) {
    try { handler(data) } catch (error) { report(error, `host.event.${event}`) }
  }
}

export function isHost(): boolean {
  return typeof window !== 'undefined' && !!(window as unknown as { chrome?: { webview?: unknown } }).chrome?.webview
}

function post(msg: unknown) {
  const wv = (window as unknown as { chrome?: { webview?: { postMessage: (m: unknown) => void } } }).chrome?.webview
  if (!wv) return
  wv.postMessage(typeof msg === 'string' ? msg : JSON.stringify(msg))
}

let hostBridgeReady = false

export function initHostBridge() {
  if (!isHost() || hostBridgeReady) return
  hostBridgeReady = true
  window.addEventListener('pagehide', () => {
    for (const request of pending.values()) {
      request.cancel()
      request.reject(new Error('The requesting page closed.'))
    }
    pending.clear()
  })
  const wv = (window as unknown as {
    chrome: { webview: { addEventListener: (t: string, fn: (e: MessageEvent) => void) => void; releaseBuffer: (buffer: ArrayBuffer) => void } }
  }).chrome.webview
  // Bulk data (Discord video frames) comes as shared memory with a JSON note naming its event: handed on as bytes, and
  // released at once, as handlers copy what they keep.
  wv.addEventListener('sharedbufferreceived', (e: MessageEvent) => {
    const shared = e as unknown as { additionalData?: { event?: string }; getBuffer: () => ArrayBuffer }
    const buffer = shared.getBuffer()
    try {
      const note = shared.additionalData
      if (note?.event) emitHostEvent(note.event as keyof HostEventMap, { ...note, bytes: new Uint8Array(buffer) } as never)
    } finally {
      wv.releaseBuffer(buffer)
    }
  })
  wv.addEventListener('message', (e: MessageEvent) => {
    let data: HostResponse | HostEvent | null
    try {
      data =
        typeof e.data === 'string'
          ? (JSON.parse(e.data) as HostResponse | HostEvent)
          : (e.data as HostResponse | HostEvent)
    } catch {
      return
    }
    if (data && typeof data === 'object' && 'event' in data && (data as HostEvent).event) {
      const ev = data as HostEvent
      if (ev.version !== undefined && ev.version !== HOST_PROTOCOL_VERSION) return
      emitHostEvent(ev.event, ev.data)
      return
    }
    const res = data as HostResponse
    if (!res?.id) return
    const p = pending.get(res.id)
    if (!p) return
    pending.delete(res.id)
    if (res.version !== undefined && res.version !== HOST_PROTOCOL_VERSION) p.reject(new Error('The launcher and UI versions do not match. Restart Exo.'))
    else if (res.ok === true) p.resolve(res.result)
    else p.reject(new Error(res.error || 'Something went wrong. Try again.'))
  })
}

export type MusicVolumeSource = 'app' | 'session'

export interface HostEventMap {
  'music.playback': MusicPlayback
  /** The music app's own volume moved (its own slider, keyboard, another device). */
  'music.volume': { level: number; source: 'app' }
  /** An exact id gained or lost its verified game process; same flags as game.get. */
  'game.runState': { id: string; isRunning: boolean; canStop: boolean }
  /** Stored achievement counts for an exact id changed (after play or a sheet-open read). */
  'game.achievements': { id: string; unlocked: number; total: number }
  /** The shader precompile moved on (at most four a second) or ended (ok set). */
  /** The Exo Shaders engine changed its list or a game's record: read shaders.status again. */
  'shaders.changed': Record<string, never>
  /** The store's home page or the wishlist changed. */
  'store.changed': { what: 'home' | 'wishlist' }
  /** A step of a Steam or Riot account change ("Closing Steam…"), for the row that started it. */
  'accounts.progress': { store: SwitchStore; line: string }
  /** Steam and Epic were read for gifts again, or one was accepted or declined. */
  'gifts.changed': StoreGifts
  /** A wishlisted game went on sale on Steam (or got cheaper); price is Steam's text for final in the region's currency ("19,99€"). */
  'store.sale': { appId: string; name: string; final?: number | null; discount: number; currency?: string | null; price?: string | null }
  /** An input report from an open HID device; data is base64 without the ID byte. */
  'hid.input': { device: string; reportId: number; data: string }
  /** A HID device arrived or left. */
  'hid.changed': Record<string, never>
  /** Exo Capture's state changed: buffering, recording, hotkeys, or it stopped. */
  'capture.state': CaptureState
  /** A clip, recording, snip, trim or export was saved; a snip ("snip") opens in the editor, Exo in front. */
  'capture.saved': { item: CaptureItem; kind?: string }
  /** An event from the shader add-on's engine (or "addon" for its engine's own state), for its page. */
  'shaders.event': { name: string; data?: unknown }
  /** System > Display: a change nobody kept was put back when its countdown ran out. */
  'gpu.driver': DriverProgress
  /** Exo's own Discord client: connection state, QR sign-in steps, list changes, unread marks, messages and typing. */
  'discord.state': { state: DiscordState; message?: string | null }
  'discord.signin': DiscordSignInStep
  'discord.changed': { guildId: string | null; voice?: boolean; inVoice?: number }
  'discord.unread': DiscordUnread
  /** A message that notifies while Exo is in front: Exo's own banner (in the background it is Windows' notification). */
  'discord.notify': DiscordNotice
  /** A conversation was read or opened (here or in another Discord app): its notifications go; messageId: only that deleted message's. */
  'discord.notifyClear': { channelId: string; messageId?: string }
  'discord.message': DiscordMessageEvent
  'discord.typing': { channelId: string; userId: string; name: string }
  'discord.reaction': DiscordReactionEvent
  /** A vote on a poll was added or taken back. */
  'discord.pollVote': { channelId: string; messageId: string; answerId: number; add: boolean; me: boolean }
  /** Someone played a soundboard sound in a voice channel; each client plays it. */
  'discord.soundboard': { channelId: string; userId: string | null; soundId: string; volume: number }
  'discord.voice': DiscordVoice
  'discord.speaking': { userId: string; speaking: boolean }
  /** Someone's camera (source call) or the watched Go Live (source stream) started or stopped. */
  'discord.video': { source: 'call' | 'stream'; userId: string; active: boolean; state?: string }
  /** This client's own Go Live: connecting, live or off (with why, when it ended on its own). */
  'discord.golive': { state: 'connecting' | 'live' | 'off'; title?: string | null; message?: string | null }
  /** Each second while live: the stream's picture size and what it really sends. */
  'discord.golive.stats': { width: number; height: number; fps: number; bitrate: number; max?: number; codec?: string }
  /** This client's camera: live (send frames) or off. */
  'discord.camera': { state: 'connecting' | 'live' | 'off' }
  /** Discord wants a keyframe of this client's camera (Go Live's come from Exo Capture). */
  'discord.video.keyframe': { source: 'camera' }
  /** One whole, decrypted H.264 frame (Annex B, base64) to decode. */
  /** The frame comes as shared memory (bytes); data (base64) only from the dev mock. */
  'discord.video.frame': { source: 'call' | 'stream'; userId: string; timestamp: number; keyframe: boolean; bytes?: Uint8Array; data?: string; rotation?: number; flip?: boolean; codec?: 'h264' | 'h265' }
  'discord.call': { channelId: string; ringing: boolean }
  'discord.presence': DiscordPresence
  /** The open server's member list changed, or member colors arrived. */
  'discord.members': { guildId: string }
  'discord.colors': { guildId: string }
  /** A Discord notification was clicked: show that conversation. */
  'discord.open': { guildId: string | null; channelId: string; parentId?: string | null; name?: string | null }
  /** The account's Discord settings, after a change here or in another Discord app. */
  'discord.userSettings': Partial<AccountSettings>
  /** The live microphone through the call's own chain: the loudest level in and out (dBFS), whether the gate is open, and what ran. */
  'discord.micLevel': MicLevel
  /** Voice Tune's microphone gave its first sound: the guide's clock starts. */
  'discord.voiceTune': { state: 'recording' }
  /** A keybind the room carries out (Toggle Streamer Mode). */
  'discord.keybind': { action: string }
  /** A /tts message in the conversation on screen, to read out. */
  'discord.tts': { name: string; text: string }
  /** An app's answer to an interaction the user started, by its nonce: created, done, failed, a form to fill, autocomplete choices. */
  'discord.interaction': InteractionEvent
}

/** The reply to every HID call the Devices room relays for its mouse module. */
export type HidReply = { ok: boolean; message?: string; data?: string; devices?: unknown[] }

export function onHostEvent<K extends keyof HostEventMap>(
  event: K,
  handler: (data: HostEventMap[K]) => void,
): () => void
export function onHostEvent(event: string, handler: (data: unknown) => void): () => void
export function onHostEvent(event: string, handler: (data: unknown) => void) {
  let set = eventHandlers.get(event)
  if (!set) {
    set = new Set()
    eventHandlers.set(event, set)
  }
  set.add(handler)
  return () => {
    set!.delete(handler)
  }
}

const inflightReads = new Map<string, Promise<unknown>>()

/** Reads that are safe to share while an identical call is already on the wire. */
const COALESCE_READS = new Set([
  'library.get',
  'settings.get',
  'stores.matrix',
  'deps.list',
  'game.get',
  'game.extras',
  'game.progress',
  'app.version',
  'shell.windowState',
])

async function rawCall<T>(method: string, params?: Record<string, unknown>, timeoutMs?: number): Promise<T> {
  if (!isHost()) {
    if (!import.meta.env.DEV && import.meta.env.MODE !== 'test') throw new Error('Exo is not responding. Restart Exo.');
    const { mockCall } = await import('./hostMock');
    return mockCall<T>(method, params)
  }
  const coalesce = COALESCE_READS.has(method)
  const key = coalesce ? `${method}:${JSON.stringify(params ?? {})}` : ''
  if (coalesce) {
    const existing = inflightReads.get(key)
    if (existing) return existing as Promise<T>
  }
  const id = crypto.randomUUID()
  const req: HostRequest = { version: HOST_PROTOCOL_VERSION, id, method, params }
  const work = new Promise<T>((resolve, reject) => {
    const limit = requestTimeoutMs(method, timeoutMs)
    const timer = limit === null ? undefined : window.setTimeout(() => {
      pending.delete(id)
      cancelTimedOutRequest(method, id, message => post({ version: HOST_PROTOCOL_VERSION, id: crypto.randomUUID(), ...message }))
      reject(new Error('Exo did not answer in time. Try again.'))
    }, limit)
    const clear = () => {
      window.clearTimeout(timer)
    }
    pending.set(id, {
      cancel: () => { cancelTimedOutRequest(method, id, message => post({ version: HOST_PROTOCOL_VERSION, id: crypto.randomUUID(), ...message })) },
      resolve: (v) => {
        clear()
        try { validateHostResult(method, v); resolve(v as T) }
        catch (error) { reject(error) }
      },
      reject: (e) => {
        clear()
        reject(e)
      },
    })
    try { post(req) }
    catch (error) { clear(); pending.delete(id); reject(error) }
  })
  if (coalesce) {
    inflightReads.set(key, work)
    const clearInflight = () => {
      if (inflightReads.get(key) === work) inflightReads.delete(key)
    }
    void work.then(clearInflight, clearInflight)
  }
  return work
}

export function resolvePrimaryAction(game: Game): PrimaryAction {
  return resolveEntitlementPrimaryAction(game)
}

/**
 * Play | Install | Update | Stop. One verb for getting a game: "Install", for
 * store games too; progress then says Downloading… or Installing… truthfully.
 * No action is not a purchase.
 */
export function primaryCtaLabel(game: Game, action = resolvePrimaryAction(game)): string {
  if (game.canStop) return 'Stop'
  const blockedLabel = blockedEntitlementLabel(game, action)
  if (blockedLabel) return blockedLabel
  if (game.store === 'ea' && (action === 'install' || action === 'update')) return 'Open EA app'
  if (action === 'update') return 'Update'
  if (action === 'play') return 'Play'
  if (action === 'install') return 'Install'
  if (game.installed) return 'Unavailable'
  return 'Not installed'
}

/**
 * Play or Install as a shortcut beside a card (Continue, Friends are playing,
 * a card's menu), or null when the game runs or Exo has no action for it, so
 * the shortcut never offers what the press would only refuse.
 */
export function shelfAction(game: Game): { action: 'play' | 'install'; label: string } | null {
  if (game.isRunning || game.canStop) return null
  const action = resolvePrimaryAction(game)
  if (game.installed) return action === 'none' ? null : { action: 'play', label: 'Play' }
  return action === 'install' ? { action: 'install', label: primaryCtaLabel(game, action) } : null
}

/**
 * Storefront URL the host already computed. Normal owned/installed titles use
 * Play or Install; an explicitly revoked title is the sole installed exception
 * and may offer Buy again. Unverified ownership never becomes a purchase claim.
 */
export function hostedBuyUrl(game: Game): string | null {
  if (!canExposeBuyUrl(game)) return null
  const fromGame = game.buyUrl?.trim()
  if (fromGame) return fromGame
  return buyUrlById.get(game.id) ?? null
}

export type WebClientOptions = {
  musicService?: MusicService | null
  microphone: 'ask' | 'allow' | 'block'
  camera: 'ask' | 'allow' | 'block'
  clipboard: 'ask' | 'allow' | 'block'
  notifications: 'ask' | 'allow' | 'block'
}


export const host = {
  webClientPreferences: () => rawCall<WebClientOptions>('web.preferences.get'),
  setWebClientPreferences: (patch: Partial<WebClientOptions>) => rawCall<WebClientOptions>('web.preferences.set', patch),
  prepareRooms: (musicService: MusicService) => rawCall<{ ok: boolean }>('shell.prepare', { musicService }),
  /** The page's first frame is drawn: the host shows it (until then the window is plain black). */
  shellPainted: () => rawCall<{ ok: boolean }>('shell.painted'),
  getLibrary: (force = false, full = false) =>
    rawCall<LibraryResponse>(force ? 'library.refresh' : 'library.get',
      { force, ...(full ? { full: true } : {}) }).then((res) => {
        rememberBuyUrls(res.games)
        return res
      }),
  getGame: (id: string) =>
    rawCall<{ ok: boolean; game?: Game; message?: string }>('game.get', { id }).then((res) => {
      if (res.game) rememberBuyUrls([res.game])
      return res
    }),
  launch: (id: string, opts?: { skipDeps?: boolean }) =>
    rawCall<LaunchResponse>('game.launch', { id, ...(opts?.skipDeps ? { skipDeps: true } : {}) }),
  stop: (id: string) => rawCall<{ ok: boolean; message?: string }>('game.stop', { id }),
  install: (id: string, path?: string, title?: string, opts?: { skipDeps?: boolean }) =>
    rawCall<InstallResponse>('game.install', {
      id,
      ...(path ? { path } : {}),
      ...(title ? { title } : {}),
      ...(opts?.skipDeps ? { skipDeps: true } : {}),
    }),
  update: (id: string, opts?: { skipDeps?: boolean }) =>
    rawCall<InstallResponse>('game.update', {
      id,
      ...(opts?.skipDeps ? { skipDeps: true } : {}),
    }),
  uninstall: (id: string) => rawCall<{ ok: boolean; message?: string; queued?: boolean; handoffOnly?: boolean }>('game.uninstall', { id }),
  repair: (id: string) =>
    rawCall<InstallResponse>('game.repair', { id }),
  gameExtras: (id: string) =>
    rawCall<{ ok: boolean; achievementsUnlocked?: number | null; achievementsTotal?: number | null; message?: string }>('game.extras', { id }),
  openFolder: (id: string) => rawCall<{ ok: boolean; message?: string; path?: string }>('game.openFolder', { id }),
  properties: (id: string) => rawCall<GameProperties>('game.properties', { id }).then(withNulls),
  /** One Properties change; `secret` (a beta access code) never goes in `value`. */
  setProperty: (id: string, key: GamePropertyKey, value = '', secret?: string) =>
    rawCall<{ ok: boolean; message?: string | null; properties?: GameProperties }>('game.properties.set', {
      id, key, value, ...(secret ? { secret } : {}),
    }).then(result => result.properties ? { ...result, properties: withNulls(result.properties) } : result),
  /** Opens the native image picker. The UI never supplies a filesystem path. */
  artReplace: (id: string) => rawCall<ArtworkMutationResponse>('art.replace', { id }),
  artReset: (id: string) => rawCall<ArtworkMutationResponse>('art.reset', { id }),
  artRefetch: (id: string) => rawCall<ArtworkMutationResponse>('art.refetch', { id }),
  /** A folder's cropped picture (PNG, base64), stored for it; the folder names the returned address once saved. */
  libraryFolderArt: (folderId: string, image: string) =>
    rawCall<{ ok: boolean; message?: string; art?: string | null }>('library.folderArt', { folderId, image }, 60_000),
  /**
   * Library › Refresh: sizes measured again, every store asked again (time
   * played, last launched, games that weren't showing), Riot hours, every
   * played game's achievements and every cover. Custom covers stay.
   */
  libraryRefreshAll: () => rawCall<{ ok: boolean; achievements: number; covers: number }>('library.refreshAll', {}, 20 * 60_000),
  /** Cancels the running job, only when it is still this game's. */
  cancelInstall: (id: string) => rawCall<{ ok: boolean; message?: string }>('game.cancelInstall', { id }),
  /** Pause the running Epic, GOG or Amazon download; Resume continues it. */
  pauseInstall: (id: string) => rawCall<{ ok: boolean; message?: string }>('game.pauseInstall', { id }),
  /** Removes a not-yet-started job; the active one goes through cancelInstall. */
  dequeue: (id: string) =>
    rawCall<{ ok: boolean; message?: string; queuedGameIds?: string[]; pausedDownloads?: PausedDownload[] }>('game.dequeue', { id }),
  resumeDownload: (id: string) => rawCall<InstallResponse>('game.resumeDownload', { id }),
  progress: (id?: string) =>
    rawCall<InstallProgress>('game.progress', id ? { id } : {}),
  /** `handoff`: the store signs in inside its own app, which is now open. Nothing is connected yet. */
  storesAuth: (store: string) =>
    rawCall<{ ok: boolean; message?: string; requiresUserAction?: boolean; handoff?: boolean }>('stores.auth', { store }),
  /** Reports the Music room rect; the native host routes it to the hosted
      desktop client (Spotify) or the YouTube Music or Apple Music web surface. */
  musicSetBounds: (bounds: { visible: boolean; service?: MusicService; left?: number; top?: number; width?: number; height?: number; cutouts?: Cutout[] }) =>
    rawCall<{ ok: boolean; service?: MusicService; state?: string; ready?: boolean; message?: string }>('music.setBounds', bounds),
  /** Latest now-playing snapshot for the selected provider (its own page, or its own Windows media session). `music.playback` events push the same shape. */
  musicPlayback: () => rawCall<{ ok: boolean; playback: MusicPlayback | null }>('music.playback'),
  musicControl: (action: MusicAction, options?: { positionMs?: number }) =>
    rawCall<{ ok: boolean; message?: string }>('music.control', { action, ...options }),
  /** The music app's own volume (`source: 'app'`, Spotify, YouTube Music and Apple Music) or its
      Windows session volume (`'session'`). The slider is
      0–100, the wire level is 0–1. `music.volume` events push changes made in the app. */
  musicVolume: (percent?: number) =>
    rawCall<{ ok: boolean; level?: number | null; muted?: boolean; source?: MusicVolumeSource; message?: string }>(
      'music.volume', percent === undefined ? {} : { level: Math.max(0, Math.min(100, percent)) / 100 }),
  musicInstall: (service: MusicService) => rawCall<DesktopInstallResponse>('music.install', { service }, 320_000),
  musicOpen: (service: MusicService) => rawCall<{ ok: boolean; message?: string }>('music.open', { service }, 60_000),
  /** Exo's own Spotify room: starts the hidden client and says whether it is signed in. */
  spotifyStart: () => rawCall<{ ok: boolean; state: PlayerRoomState; message?: string }>('spotify.start', undefined, 60_000),
  /** The room closed; the hidden client may sleep when idle. */
  spotifyLeave: () => rawCall<{ ok: boolean }>('spotify.leave'),
  /** The spotify: URI a shared link opens (a page or a Jam); a short link is followed on the host, without cookies. */
  spotifyLink: (url: string) => rawCall<{ ok: boolean; uri?: string; message?: string }>('spotify.link', { url }, 15_000),
  /** Signed out: Spotify's hidden login hands off to the default browser; its window never shows. */
  spotifySignIn: () => rawCall<{ ok: boolean; message?: string }>('spotify.signIn', undefined, 30_000),
  spotifyView: (view: PlayerView, options: PlayerViewOptions = {}) =>
    rawCall<{ ok: boolean; data?: PlayerViewData; message?: string }>('spotify.view', { view, ...options }, 30_000),
  /** context: the playlist, album or artist a track plays in; the playlist for add and remove; the device id for transfer.
      uid: a playlist row, or a Jam member to remove. A new playlist or folder answers its uri. */
  spotifyAct: (action: PlayerAction, options: PlayerActOptions = {}) =>
    rawCall<{ ok: boolean; message?: string; uri?: string | null }>('spotify.act', { action, ...options }, 30_000),
  /** Exo's own YouTube Music room: loads the hidden page and says whether it is signed in. */
  ytmusicStart: () => rawCall<{ ok: boolean; state: PlayerRoomState; message?: string }>('ytmusic.start', undefined, 60_000),
  ytmusicView: (view: PlayerView, options: PlayerViewOptions = {}) =>
    rawCall<{ ok: boolean; data?: PlayerViewData; message?: string }>('ytmusic.view', { view, ...options }, 30_000),
  /** context: the list (ytm:list:…) or page a song plays in. */
  ytmusicAct: (action: PlayerAction, options: PlayerActOptions = {}) =>
    rawCall<{ ok: boolean; message?: string }>('ytmusic.act', { action, ...options }, 30_000),
  /** Thaw an idle, frozen music app before a click lands on it. */
  musicWarm: () => rawCall<{ ok: boolean }>('music.warm'),
  /** Exo's own Apple Music room: loads the hidden music.apple.com page and says whether it is signed in. */
  applemusicStart: () => rawCall<{ ok: boolean; state: PlayerRoomState; message?: string }>('applemusic.start', undefined, 60_000),
  applemusicView: (view: PlayerView, options: PlayerViewOptions = {}) =>
    rawCall<{ ok: boolean; data?: PlayerViewData; message?: string }>('applemusic.view', { view, ...options }, 30_000),
  /** context: the album, playlist, artist or station a song plays in (am:albums:…); the playlist for add and remove.
      uid: a row of your own playlist. */
  applemusicAct: (action: PlayerAction, options: PlayerActOptions = {}) =>
    rawCall<{ ok: boolean; message?: string }>('applemusic.act', { action, ...options }, 30_000),
  /** The room's Sign in button for a web service: Apple's MusicKit sign-in window, or Google's sign-in page in Exo's window. */
  musicSignIn: (service: 'youtube' | 'apple') => rawCall<{ ok: boolean; message?: string }>('music.signIn', { service }, 30_000),
  musicReload: () => rawCall<{ ok: boolean; service?: MusicService; ready?: boolean; message?: string }>('music.reload'),
  /** Exo Capture: whether it is installed, what it is doing, and its settings. */
  captureStatus: () => rawCall<{ ok: boolean; state?: CaptureState; settings?: CaptureSettings }>('capture.status'),
  captureSettings: (patch: Partial<CaptureSettings>) =>
    rawCall<{ ok: boolean; message?: string | null; state?: CaptureState; settings?: CaptureSettings }>('capture.settings', patch),
  /** saveReplay, record (start or stop), snip, openFolder. */
  captureAct: (action: 'saveReplay' | 'record' | 'snip' | 'openFolder') =>
    rawCall<{ ok: boolean; message?: string; state?: CaptureState }>('capture.act', { action }),
  /** Every capture, newest first; with a game id, that game's only. */
  captureList: (gameId?: string | null, limit?: number) =>
    rawCall<{ ok: boolean; items?: CaptureItem[] }>('capture.list', { gameId: gameId ?? null, limit: limit ?? 0 }),
  captureItem: (id: string, action: 'favourite' | 'unfavourite' | 'delete' | 'reveal' | 'copy' | 'discord') =>
    rawCall<{ ok: boolean; message?: string; item?: CaptureItem }>('capture.item', { id, action }),
  /** A lossless trim, or an export preset, between two points (ms). */
  captureEdit: (id: string, preset: CaptureExport, startMs: number, endMs: number) =>
    rawCall<{ ok: boolean; message?: string; item?: CaptureItem | null }>('capture.edit', { id, preset, startMs, endMs }, 15 * 60_000),
  /** The snip editor's PNG (base64) over the snip, then copied. */
  captureSaveImage: (id: string, png: string) =>
    rawCall<{ ok: boolean; message?: string; item?: CaptureItem }>('capture.saveImage', { id, png }, 60_000),
  /** The shader add-on: whether it is installed, its engine's state, and its page's URL. */
  shadersAddon: () => rawCall<{ ok: boolean; present: boolean; state?: string; message?: string | null; url?: string }>('shaders.addon'),
  /** One request from the add-on's page to its engine. */
  shadersCall: (method: string, params?: unknown) =>
    rawCall<{ ok: boolean; result?: unknown; message?: string }>('shaders.call', { method, params: params ?? {} }, 10 * 60_000),
  /** Seconds each game takes to compile on this PC (measured, else estimated), by the engine's game id. */
  shadersEstimates: () => rawCall<{ ok: boolean; seconds: Record<string, number> }>('shaders.estimates'),
  friendsBadge: () => rawCall<{ count: number }>('friends.badge'),
  desktopClientsStatus: () =>
    rawCall<{ ok: boolean; apps: Array<{ id: string; title: string; state: string }> }>('desktopClients.status'),
  desktopClientsInstall: (id: string) =>
    rawCall<DesktopInstallResponse>('desktopClients.install', { id }, 320_000),
  /** Store clients and apps Exo starts when needed that also start with Windows, and whether they still do. */
  listDeps: () => rawCall<{ items: DependencyItem[] }>('deps.list'),
  /** The apps Exo does the job of (Discord, Snipping Tool, Game Bar…); clean first clears what removed ones left. */
  replacedScan: (clean = false) => rawCall<{ ok: boolean; cleared: number; apps: ReplacedApp[] }>('replaced.scan', { clean }, 60_000),
  /** One of them removed with everything it left, as Revo Uninstaller does it. */
  replacedRemove: (id: string) =>
    rawCall<{ ok: boolean; message?: string | null; removed: number; left: number; apps: ReplacedApp[] }>('replaced.remove', { id }, 15 * 60_000),
  offerDepInstall: (id: string) =>
    rawCall<{ ok: boolean; message?: string; exitCode?: number | null; restartRequired?: boolean; status?: string }>(
      'deps.offerInstall', { id }, 30 * 60_000),
  cancelDepInstall: (id: string) =>
    rawCall<{ ok: boolean; message?: string }>('deps.cancelInstall', { id }),
  storesCheck: () => rawCall<StoreLocalCheck>('stores.check'),
  storesMatrix: () => rawCall<StoreStatus[]>('stores.matrix'),
  getSettings: () => rawCall<LauncherSettings>('settings.get'),
  accountsList: () => rawCall<StoreAccounts>('accounts.list'),
  /** What Exo last read; force (or a read older than half an hour) reads again, arriving as gifts.changed. */
  giftsList: (force = false) => rawCall<StoreGifts>('gifts.list', { force }),
  /** Accept adds the game to the library; the store's library is read again. */
  giftsAnswer: (store: StoreGift['store'], id: string, accept: boolean) =>
    rawCall<{ ok: boolean; message?: string | null }>('gifts.answer', { store, id, accept }, 120_000),
  giftsSteamSignIn: () => rawCall<{ ok: boolean; message?: string | null }>('gifts.steamSignIn', {}, 15 * 60_000),
  giftsSteamSignOut: () => rawCall<{ ok: boolean; message?: string | null }>('gifts.steamSignOut', {}, 60_000),
  /** Steam, Riot: sign in as `key` (the client restarts). Epic, GOG, Amazon: sign out, then that store's sign-in. */
  accountsSwitch: (store: AccountStore | SwitchStore, key?: string) =>
    rawCall<{ ok: boolean; message?: string | null }>('accounts.switch', key ? { store, key } : { store }, 15 * 60_000),
  /** Steam, Riot: the client closes and opens its own sign-in for another account. */
  accountsAdd: (store: SwitchStore) => rawCall<{ ok: boolean; message?: string | null }>('accounts.add', { store }, 120_000),
  /** Steam forgets the account; for Riot, Exo forgets its saved sign-in. */
  accountsRemove: (store: SwitchStore, key: string) =>
    rawCall<{ ok: boolean; message?: string | null }>('accounts.remove', { store, key }, 120_000),
  accountsSignOut: (store: Exclude<AccountStore, 'steam'>) =>
    rawCall<{ ok: boolean; message?: string | null }>('accounts.signOut', { store }, 120_000),
  /** Exo takes the Epic Games Launcher's sign-in; the launcher signs out. */
  accountsEpicImport: () => rawCall<{ ok: boolean; message?: string | null }>('accounts.epicImport', {}, 120_000),
  /** Signs another Epic account in for its hours. */
  accountsEpicAdd: () => rawCall<{ ok: boolean; message?: string | null }>('accounts.epicAdd', {}, 15 * 60_000),
  accountsEpicRemove: (key: string) => rawCall<{ ok: boolean; message?: string | null }>('accounts.epicRemove', { key }, 120_000),
  setSettings: (
    patch: Partial<LauncherSettings> & {
      steamWebApiKey?: string
      itchApiKey?: string
      riotId?: string | null
      igdbTwitchClientId?: string
      igdbTwitchClientSecret?: string
      steamGridDbKey?: string
      openXblKey?: string
    },
  ) => rawCall<LauncherSettings>('settings.set', patch as Record<string, unknown>),
  riotHoursRefresh: (riotId?: string) =>
    rawCall<RiotHoursRefresh>(
      'playtime.riotRefresh',
      riotId ? { riotId } : {},
    ),
  /** Reads one source's hours again: 'xbox' or a tracker game key. */
  playtimeRefresh: (source: string) =>
    rawCall<HoursRefresh>('playtime.refresh', { source }, 60_000),
  minimize: () => rawCall<{ ok: boolean }>('shell.minimize'),
  maximize: () => rawCall<{ ok: boolean; maximized?: boolean }>('shell.maximize'),
  windowState: () => rawCall<{ ok: boolean; maximized?: boolean }>('shell.windowState'),
  close: () => rawCall<{ ok: boolean }>('shell.close'),
  openUrl: (url: string) => rawCall<{ ok: boolean }>('shell.openUrl', { url }),
  showStore: (store: string) =>
    rawCall<{ ok: boolean; message?: string }>('shell.showStore', { store }),
  /** A program (.exe) picked in Windows' file picker. */
  pickProgram: () => rawCall<{ ok: boolean; cancelled?: boolean; path?: string; message?: string }>('shell.pickProgram'),
  pickFolder: (title?: string) =>
    rawCall<{ ok: boolean; cancelled?: boolean; path?: string; message?: string }>(
      'shell.pickFolder',
      title ? { title } : {},
    ),
  setChromeLayout: (chrome: ChromeLayout) =>
    rawCall<{ ok: boolean }>('shell.setChromeLayout', chrome),
  version: () => rawCall<{ version: string }>('app.version'),
  /** `manual` skips the host's short release cache (Settings' Check for update). */
  checkUpdate: (manual = false) => rawCall<AppUpdateResponse>('app.checkUpdate', manual ? { manual: true } : {}),
  installUpdate: () => rawCall<AppUpdateResponse>('app.installUpdate', {}, 30 * 60_000),
  log: (entry: AppLogEntry) => rawCall<{ ok: boolean }>('app.log', entry, 10_000),
  openLogs: () => rawCall<{ ok: boolean; message?: string }>('app.openLogs'),
  repairCache: (scope: 'sizes' | 'upscalers') => rawCall<{ ok: boolean; message?: string }>('app.repairCache', { scope }),
  dlssStatus: (id: string, refresh = false) =>
    rawCall<DlssStatus>('dlss.status', { id, ...(refresh ? { refresh: true } : {}) }, refresh ? 120_000 : 60_000),
  /** No file: every file to the newest release. With a file: that file to exactly this release. */
  dlssApply: (id: string, file?: string, release?: string) =>
    rawCall<DlssRunResult>('dlss.updateAll', { id, ...(file ? { file, release: release ?? 'latest' } : {}) }, 10 * 60_000),
  dlssRestore: (id: string, file?: string) =>
    rawCall<DlssRunResult>('dlss.restore', { id, ...(file ? { file } : {}) }),
  /** NVIDIA's on-screen DLSS overlay. Changing it shows Windows' administrator prompt, so it waits up to 2 minutes. */
  dlssIndicator: (on?: boolean) =>
    rawCall<{ ok: boolean; available: boolean; on: boolean; message?: string | null }>('dlss.indicator', on === undefined ? {} : { on }, on === undefined ? 15_000 : 120_000),
  /** Allow (naming the anti-cheat the user was shown) or stop allowing changes to an anti-cheat game's upscaler files. */
  dlssConsent: (id: string, allow: boolean, antiCheat?: string) =>
    rawCall<{ ok: boolean; message?: string }>('dlss.consent', { id, allow, ...(allow && antiCheat ? { antiCheat } : {}) }),
  shadersStatus: (id: string) => rawCall<ShaderStatus>('shaders.status', { id }),
  hdrState: () => rawCall<HdrState>('hdr.state', {}),
  /** Steam's and Epic's own notifications and sounds off, kept off; message says when a store takes it later. */
  quietStores: () => rawCall<{ ok: boolean; message?: string | null }>('stores.quiet', {}, 60_000),
  /** A game's HDR support (asks PCGamingWiki the first time); with a mode, sets its Auto/Always/Never. */
  hdrGame: (id: string, mode?: string) => rawCall<HdrGame>('hdr.game', { id, ...(mode ? { mode } : {}) }, 30_000),
  /** Every screen's refresh rate and output color; set starts a 15 s countdown that keep ends and revert (or the host, when it runs out) undoes. */
  /** The client's state; connect starts it again after it stopped. */
  discordStatus: (connect = false) => rawCall<DiscordStatus>('discord.status', { connect }),
  /** Starts a QR sign-in (steps arrive as discord.signin), or cancels it. */
  discordSignIn: (cancel = false) => rawCall<{ ok: boolean }>('discord.signIn', { cancel }),
  discordSignOut: () => rawCall<{ ok: boolean }>('discord.signOut', {}),
  /** A Windows notification from Exo while it is in the background. */
  appNotify: (title: string, body: string) => rawCall<{ ok: boolean }>('app.notify', { title, body }),
  discordHome: () => rawCall<DiscordHome>('discord.home', {}),
  discordChannels: (guildId: string) => rawCall<DiscordChannels>('discord.channels', { guildId }),
  /** 50 messages: the newest, or those before, after or around one; peek reads them without opening the channel (the Inbox's Unreads). */
  discordMessages: (channelId: string, at: { before?: string; after?: string; around?: string; peek?: boolean } = {}) =>
    rawCall<{ ok: boolean; message?: string | null; messages?: DiscordMessage[] | null; lastRead?: string | null }>('discord.messages', { channelId, ...at }, 30_000),
  /** The Inbox's Mentions: 25 older than before, in one server or all, with role and @everyone mentions or not; remove takes one off the list. */
  discordMentions: (options: { before?: string; guildId?: string | null; roles?: boolean; everyone?: boolean; remove?: string } = {}) =>
    rawCall<{ ok: boolean; message?: string | null; messages?: DiscordMessage[] | null; places?: Record<string, DiscordPlace | null> }>('discord.mentions',
      Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined && v !== null)), 30_000),
  /** The Inbox's For You: Discord's notification center, older than before. */
  discordForYou: (before?: string) => rawCall<{ ok: boolean; message?: string | null; items?: DiscordForYouItem[] | null; hasMore?: boolean }>('discord.forYou', before ? { before } : {}, 30_000),
  /** The Inbox's Unreads: the unread channels of servers you haven't muted, newest first. */
  discordUnreads: () => rawCall<{ channels: DiscordUnreadChannel[] }>('discord.unreads', {}),
  /** Who reacted with an emoji (burst: the super reactions), 100 at a time after the last one; canRemove: Manage Messages here. */
  discordReactors: (channelId: string, messageId: string, emoji: string, burst: boolean, after?: string, limit?: number) =>
    rawCall<{ ok: boolean; message?: string | null; users?: DiscordUser[] | null; canRemove?: boolean }>('discord.reactors', { channelId, messageId, emoji, burst, ...(after ? { after } : {}), ...(limit ? { limit } : {}) }, 30_000),
  /** A text file's preview: its first 50 KB, and how many bytes are left. */
  /** Copy Image (onto the clipboard as a bitmap) or Save Image (into Downloads; the name it got), for a picture on Discord's servers. */
  discordImage: (action: 'copy' | 'save', url: string) => rawCall<{ ok: boolean; message?: string | null; name?: string | null }>('discord.image', { action, url }, 60_000),
  discordFileText: (url: string) => rawCall<{ ok: boolean; message?: string | null; text?: string | null; left?: number }>('discord.fileText', { url }, 30_000),
  /** ping: false sends a reply without pinging its author (Discord's @ OFF); forward sends that message here, content as a note after it. */
  discordSend: (channelId: string, content: string, replyTo?: string, uploads?: string[], options: { ping?: boolean; forward?: { channelId: string; messageId: string } } = {}) =>
    rawCall<{ ok: boolean; message?: string | null; sent?: DiscordMessage | null }>('discord.send', { channelId, content, ...(replyTo ? { replyTo } : {}), ...(uploads?.length ? { uploads } : {}), ...options }, 120_000),
  /** One base64 piece of a file for the next message; the first piece (no uploadId) starts it. */
  discordUpload: (piece: { uploadId?: string; name?: string; type?: string; data?: string; cancel?: boolean }) =>
    rawCall<{ ok: boolean; message?: string; uploadId?: string }>('discord.upload', piece, 30_000),
  /** burst: a super reaction (Nitro); userId takes someone else's off (Manage Messages). */
  discordReact: (channelId: string, messageId: string, emoji: string, add: boolean, options: { burst?: boolean; userId?: string } = {}) =>
    rawCall<{ ok: boolean; message?: string | null }>('discord.react', { channelId, messageId, emoji, add, ...options }),
  discordEmojis: (guildId: string | null) => rawCall<DiscordEmojis>('discord.emojis', guildId ? { guildId } : {}),
  /** The conversation on screen (null when none or the room is hidden): it doesn't notify. */
  discordView: (channelId: string | null) => rawCall<{ ok: boolean }>('discord.view', channelId ? { channelId } : {}),
  discordEdit: (channelId: string, messageId: string, content: string) =>
    rawCall<{ ok: boolean; message?: string | null }>('discord.edit', { channelId, messageId, content }, 30_000),
  discordDelete: (channelId: string, messageId: string) =>
    rawCall<{ ok: boolean; message?: string | null }>('discord.delete', { channelId, messageId }, 30_000),
  /** unread: Mark Unread, with messageId the message before the one chosen. */
  discordAck: (channelId: string, messageId: string, unread = false) =>
    rawCall<{ ok: boolean; message?: string | null; unread?: DiscordUnread }>('discord.ack', { channelId, messageId, ...(unread ? { unread } : {}) }),
  /** Voice: join a channel (or a DM's call with no guildId), leave, or set mute and deafen. */
  discordVoice: (action: 'state' | 'join' | 'leave' | 'set' | 'user', params: { guildId?: string | null; channelId?: string; muted?: boolean; deafened?: boolean; userId?: string; volume?: number; stream?: boolean } = {}) =>
    rawCall<{ ok: boolean; message?: string | null; voice?: DiscordVoice }>('discord.voice', { action, ...params }),
  /** Rings the other people in a DM, after joining its call. */
  /** Go Live: watch someone's stream in the call this client is in, or stop watching. */
  discordStream: (action: 'watch' | 'stop', userId?: string) =>
    rawCall<{ ok: boolean; message?: string | null }>('discord.stream', { action, ...(userId ? { userId } : {}) }),
  /** Whether the page shows call video now (on screen, with a camera or stream to draw): only then do frames come. */
  discordFrames: (on: boolean) => rawCall<{ ok: boolean; message?: string | null }>('discord.stream', { action: 'frames', on }),
  /** Whether this page decodes H.265 in hardware, so Discord connections offer to receive it. */
  discordVideoDecode: (hevc: boolean) => rawCall<{ ok: boolean; message?: string | null }>('discord.stream', { action: 'decode', hevc }),
  /**
   * Go Live from this client: what can be shared (screens and windows with pictures), a fresh picture of
   * one (or of the stream while live, no source), start (a source, height 0 for its own, frame rate, sound), stop.
   */
  discordGoLive: (action: 'sources' | 'preview' | 'start' | 'stop' | 'self', params: { source?: string; width?: number; height?: number; fps?: number; sound?: boolean; on?: boolean } = {}) =>
    rawCall<{ ok: boolean; message?: string | null; sources?: GoLiveSource[]; thumb?: string | null }>('discord.golive', { action, ...params }, 20_000),
  /** The camera in the call: start (size and frame rate), one encoded frame (Annex B, base64), or stop. */
  discordCamera: (action: 'start' | 'frame' | 'stop', params: { width?: number; height?: number; fps?: number; timestamp?: number; data?: string } = {}) =>
    rawCall<{ ok: boolean; message?: string | null }>('discord.camera', { action, ...params }, 15_000),
  discordRing: (channelId: string) => rawCall<{ ok: boolean; message?: string | null }>('discord.ring', { channelId }),
  /** Decline an incoming call: it stops ringing here and in your other Discord apps. */
  discordDecline: (channelId: string) => rawCall<{ ok: boolean; message?: string | null }>('discord.ring', { channelId, decline: true }),
  discordFriends: () => rawCall<{ friends: DiscordFriend[] }>('discord.friends', {}),
  /**
   * Add or accept by id (accept), ignore, cancel, unblock or remove (remove), add by username, block, ignore and unignore,
   * open a DM (answers its channel id), or the relationship as Discord sent it (state: 0 none, 1 friends, 2 blocked,
   * 3 their request, 4 yours; ignored; and bot). stranger: Discord wants the accept confirmed (confirm).
   */
  discordFriend: (action: 'accept' | 'remove' | 'add' | 'dm' | 'block' | 'ignore' | 'unignore' | 'state', params: { userId?: string; username?: string; confirm?: boolean }) =>
    rawCall<{ ok: boolean; message?: string | null; channelId?: string | null; relationship?: number; ignored?: boolean; bot?: boolean; stranger?: boolean }>('discord.friend', { action, ...params }, 30_000),
  /** The member list; at asks Discord for the rows from that one on (they arrive as discord.members). */
  discordMembers: (guildId: string, at?: number) => rawCall<DiscordMemberList>('discord.members', at === undefined ? { guildId } : { guildId, at }),
  /** People to @mention whose names match; ask also asks Discord for more (they arrive as discord.colors). */
  discordMentionable: (guildId: string, query: string, ask: boolean) => rawCall<{ users: DiscordUser[] }>('discord.mentionable', { guildId, query, ask }),
  discordColors: (guildId: string, userIds: string[]) => rawCall<{ colors: Record<string, string | null> }>('discord.colors', { guildId, userIds }),
  /** A channel's pinned messages, or (with a message id) pin or unpin it. */
  discordPins: (channelId: string, messageId?: string, pin?: boolean) =>
    rawCall<{ ok: boolean; message?: string | null; messages?: DiscordMessage[] | null; places?: Record<string, DiscordPlace | null> }>('discord.pins', { channelId, ...(messageId ? { messageId, pin } : {}) }, 30_000),
  /** Discord's search bar: a server (narrowed by in:) or a DM, with its filters, sort and page. */
  discordSearch: (channelId: string, filters: DiscordSearchFilters) =>
    rawCall<{ ok: boolean; message?: string | null; result?: { messages?: DiscordMessage[][]; total_results?: number } | null; places?: Record<string, DiscordPlace | null> }>('discord.search', { channelId, filters }, 30_000),
  /** The account's favorite GIFs (Discord's own list): read, add one, or remove one. */
  discordGifFavorites: (action: 'list' | 'add' | 'remove' = 'list', gif?: { url: string; src?: string; width?: number; height?: number }) =>
    rawCall<{ ok: boolean; gifs?: DiscordFavoriteGif[] | null }>('discord.gifFavorites', { action, ...(gif ?? {}) }, 30_000),
  /** The emoji picker's Favorites and Frequently Used (Discord's own): read, favorite, unfavorite, or count a use. Each emoji is a custom one's id or a Unicode one's Discord name. */
  discordEmojiFavorites: (action: 'list' | 'add' | 'remove' | 'use' = 'list', emoji?: string, reaction?: boolean) =>
    rawCall<{ ok: boolean; favorites?: string[] | null; frequent?: string[] | null; reactions?: string[] | null }>('discord.emojiFavorites', { action, ...(emoji ? { emoji } : {}), ...(reaction ? { reaction } : {}) }, 30_000),
  discordGifs: (query?: string) => rawCall<{ ok: boolean; gifs?: DiscordGif[] | null }>('discord.gifs', query ? { query } : {}, 30_000),
  /** Join or leave a server, read an invite (a message's invite card), its Server Guide or events, or create a channel. */
  discordServer: (action: 'join' | 'invite' | 'leave' | 'guide' | 'events' | 'members' | 'createChannel' | 'prune' | 'createEvent' | 'eventStatus' | 'ics' | 'rsvp' | 'showAll' | 'mute' | 'notify', params: { muted?: boolean; minutes?: number; level?: number; suppressEveryone?: boolean; suppressRoles?: boolean; invite?: string; guildId?: string; parentId?: string; name?: string; kind?: 'text' | 'voice'; sort?: number; days?: number; countOnly?: boolean; eventId?: string; interested?: boolean; on?: boolean; status?: 2 | 3 | 4; description?: string; start?: string; channelId?: string; location?: string; end?: string; query?: string; afterJoined?: number; afterUser?: string }) =>
    rawCall<{ ok: boolean; message?: string | null; guildId?: string | null; channelId?: string | null; invite?: DiscordInvite | null; invalid?: boolean; guide?: DiscordGuide | null; events?: { event: DiscordEvent; interested: boolean }[] | null; members?: DiscordMemberSearch | null; roles?: Record<string, DiscordRole>; online?: number | null; total?: number | null; resources?: DiscordResource[]; pruned?: number | null }>('discord.server', { action, ...params }, 30_000),
  /**
   * Server Settings, Edit Channel and the person menu: a server's (guildId) or channel's (channelId) settings and the
   * changes to them, each checked by the host against the user's permissions. data is Discord's own reply.
   */
  discordAdmin: (action: string, params: Record<string, unknown> = {}) =>
    rawCall<{ ok: boolean; message?: string | null; data?: unknown }>('discord.admin', { action, ...params }, 60_000),
  discordProfile: (userId: string, guildId: string | null) =>
    rawCall<{ ok: boolean; message?: string | null; profile?: DiscordProfile | null; extras?: DiscordProfileExtras | null; note?: string | null }>('discord.profile', { userId, ...(guildId ? { guildId } : {}) }, 30_000),
  /** A profile's Note (only visible to you), saved on Discord. */
  discordSaveNote: (userId: string, note: string) =>
    rawCall<{ ok: boolean; message?: string | null }>('discord.profile', { userId, note }, 30_000),
  /** A full profile's Mutual Friends. */
  /** The user panel's device menus: devices, choices and volumes; with values, saves them. */
  discordAudio: (change: { input?: string; output?: string; inputVolume?: number; outputVolume?: number; soundboardVolume?: number; soundboardMuted?: boolean }) =>
    rawCall<{ inputs: { id: string; name: string }[]; outputs: { id: string; name: string }[]; input: string | null; output: string | null; inputVolume: number; outputVolume: number; soundboardVolume: number; soundboardMuted: boolean }>('discord.audio', change, 15_000),
  /** The account's Discord settings (PreloadedUserSettings, Discord's defaults filled in); with changes, saves them (guildFolders: the whole server list). */
  discordUserSettings: (changes?: Partial<AccountSettings> & { guildFolders?: DiscordRailItem[] }) =>
    rawCall<{ ok: boolean; message?: string | null; values?: AccountSettings | null }>('discord.userSettings', changes ? { changes } : {}, 30_000),
  /** My Account, Profiles, Data & Privacy, Devices and Connected Apps. */
  discordAccount: (action: DiscordAccountAction, params: { globalName?: string; bio?: string; pronouns?: string; accentColor?: number | null; uploadId?: string; remove?: boolean; grant?: string[]; revoke?: string[]; idHashes?: string[]; id?: string } = {}) =>
    rawCall<{ ok: boolean; message?: string | null; me?: DiscordAccount | null; data?: unknown }>('discord.account', { action, ...params }, 60_000),
  /**
   * Discord's Shop: the catalog and what the account owns, one product (a profile effect's layers), putting on
   * (skuId) or taking off (null) an owned decoration, nameplate or profile effect, the account's saved payment
   * methods (brand and last four only), Discord's price for a SKU with one of them, and buying at that price.
   */
  discordShop: (action: 'catalog' | 'product' | 'equip' | 'payment' | 'preview' | 'buy' | 'stripeKey' | 'card' | 'cardSave' | 'paymentSecret',
    params: {
      skuId?: string | null; kind?: 'decoration' | 'nameplate' | 'effect'; paymentSourceId?: string; amount?: number; currency?: string
      /** Adding a card: the billing address Discord checks, then the id Stripe gave the card and Discord's address token. */
      name?: string; line1?: string; line2?: string; city?: string; state?: string; postalCode?: string; country?: string
      paymentMethod?: string; addressToken?: string; paymentId?: string
    } = {}) =>
    rawCall<{
      ok: boolean; message?: string | null; catalog?: DiscordShopCatalog | null; owned?: DiscordShopProduct[] | null; product?: DiscordShopProduct | null
      payment?: DiscordPaymentChoice[]; price?: DiscordShopPrice | null; confirm?: boolean
      /** Discord's Stripe key, a Stripe client secret, Discord's billing address token, and a payment the bank must confirm. */
      key?: string | null; clientSecret?: string | null; addressToken?: string | null; paymentId?: string | null
    }>('discord.shop', { action, ...params }, 60_000),
  /** A display name style's font, Discord's own file (base64): Discord serves it only to its own site. */
  discordFont: (family: string) => rawCall<{ ok: boolean; data?: string | null }>('discord.font', { family }, 30_000),
  /** The settings Exo keeps for its Discord client (input profile, Push to Talk, keybinds, notifications, sounds); with values, saves them. */
  discordClientSettings: (change: Partial<DiscordClientSettings> & { streamerQuiet?: boolean; streamerSilent?: boolean } = {}) =>
    rawCall<DiscordClientSettings>('discord.clientSettings', change, 15_000),
  /** The live microphone in Voice & Video: on starts or renews it (levels arrive as discord.micLevel), off stops it. */
  discordMicTest: (on: boolean) => rawCall<{ ok: boolean }>('discord.micTest', { on }),
  /** Only My Voice: learn the voice from the last Voice Check take (fetches the 40 MB voice model the first time), or forget it. */
  discordMyVoice: (action: 'learn' | 'forget') => rawCall<{ ok: boolean; learned: boolean; message?: string | null }>('discord.myVoice', { action }, 180_000),
  /**
   * Lucid, the separate EQ app: its state, Start with Exo (set), its own window (open), Equalizer APO's device picker
   * (devices), a change to its settings (change: Lucid closes and starts again out of sight), or its download page (get).
   */
  lucid: (action: 'state' | 'set' | 'open' | 'devices' | 'change' | 'get' = 'state', params: { on?: boolean; change?: LucidChange } = {}) =>
    rawCall<LucidState>('lucid', { action, ...params }, 30_000),
  /** The headphones Lucid has tunings for, read from this PC's Lucid. */
  lucidHeadphones: () => rawCall<{ ok: boolean; headphones: LucidHeadphone[] }>('lucid.headphones'),
  /** A newer Lucid its own feed offers (null: none, or offline). Lucid's window installs it. */
  lucidUpdate: () => rawCall<{ version: string | null }>('lucid.update', {}, 30_000),
  /** Voice Tune: record the guided take (each part's seconds), cancel it, whether this mic has a kept tuning (state), keep its tuning for this mic, forget it, or fix Windows (unmute, no ducking). */
  discordVoiceTune: (action: 'record' | 'cancel' | 'state' | 'keep' | 'forget' | 'unmute' | 'noDucking', params: { parts?: number[] } = {}) =>
    rawCall<VoiceTuneResult & { windows?: VoiceTuneWindows; processing?: string | null }>('discord.voiceTune', { action, ...params }, 90_000),
  /** Voice Check: seconds from the microphone, before and after the input profile's processing (WAV data), and how the mic is set. */
  discordVoiceCheck: (seconds: number) => rawCall<VoiceCheckResult>('discord.voiceCheck', { seconds }, 20_000),
  /** Plays one of Discord's sounds (preview: even when it's turned off). */
  discordSound: (name: string, preview = false) => rawCall<{ ok: boolean }>('discord.sound', { name, preview }),
  discordMutualFriends: (userId: string) =>
    rawCall<{ ok: boolean; message?: string | null; friends?: DiscordUser[] | null }>('discord.profile', { userId, mutualFriends: true }, 30_000),
  /** A forum's open posts (threads), newest activity first. */
  /** 25 threads or posts, newest activity first: the open ones, or archived ones from offset. */
  discordThreads: (channelId: string, page: { archived?: boolean; offset?: number } = {}) =>
    rawCall<{ ok: boolean; message?: string | null; threads?: DiscordThread[]; firstMessages?: DiscordMessage[] | null; hasMore?: boolean; tags?: DiscordForumTag[] }>('discord.threads', { channelId, ...page }, 30_000),
  /** Create Thread from a message, or a forum post (name, its first message, tags). */
  discordThread: (channelId: string, thread: { name: string; messageId?: string; content?: string; tags?: string[] }) =>
    rawCall<{ ok: boolean; message?: string | null; thread?: { id: string; name: string } | null }>('discord.thread', { channelId, ...thread }, 30_000),
  /** Create Poll: a question, two to ten answers, its length in hours and whether several may be picked. */
  discordPollCreate: (channelId: string, poll: { question: string; texts: string[]; hours: number; multiple: boolean }) =>
    rawCall<{ ok: boolean; message?: string | null }>('discord.poll', { channelId, action: 'create', ...poll }),
  /** Vote on a poll (no answers takes the vote back), or end your own. */
  discordPoll: (channelId: string, messageId: string, answers: number[] | 'end') =>
    rawCall<{ ok: boolean; message?: string | null }>('discord.poll', answers === 'end' ? { channelId, messageId, action: 'end' } : { channelId, messageId, answers }),
  /** The soundboard: Discord's default sounds and this server's (list), or play one in your voice channel. */
  discordSoundboard: (action: 'list' | 'play', params: { guildId?: string | null; channelId?: string; soundId?: string; emojiId?: string | null; emojiName?: string | null }) =>
    rawCall<{ ok: boolean; message?: string | null; defaults?: unknown; guild?: unknown }>('discord.soundboard', { action, ...params }),
  /** An animated (Lottie) sticker's animation, as JSON text. */
  discordStickerData: (id: string) => rawCall<{ ok: boolean; json?: string; message?: string }>('discord.stickerData', { id }, 20_000),
  /** The sticker picker's groups and the account's favorites; add or remove favorites or unfavorites one first. */
  discordStickers: (guildId: string | null, action?: 'add' | 'remove', stickerId?: string) =>
    rawCall<{ premium?: boolean; groups?: DiscordStickerGroup[]; favorites?: string[] | null }>('discord.stickers', { ...(guildId ? { guildId } : {}), ...(action && stickerId ? { action, stickerId } : {}) }, 30_000),
  discordSticker: (channelId: string, stickerId: string) =>
    rawCall<{ ok: boolean; message?: string | null; sent?: DiscordMessage | null }>('discord.sticker', { channelId, stickerId }, 30_000),
  /** A server channel's bell (mute or unmute) or Invite People (a 7-day invite link). */
  discordChannel: (channelId: string, action: 'mute' | 'invite' | 'collapse' | 'read' | 'delete' | 'optin' | 'close' | 'add', value?: boolean, userId?: string) =>
    rawCall<{ ok: boolean; message?: string | null; muted?: boolean; collapsed?: boolean; url?: string | null; channelId?: string | null }>('discord.channel', { channelId, action, ...(userId ? { userId } : {}), ...(value === undefined ? {} : action === 'collapse' ? { collapsed: value } : action === 'optin' ? { optedIn: value } : { muted: value }) }, 30_000),
  /** The bell's menu: mute for minutes (absent: until turned back on), or the channel's notifications (0 all, 1 mentions, 2 nothing, 3 as the level above). */
  discordChannelNotify: (channelId: string, change: { muted: boolean; minutes?: number } | { level: 0 | 1 | 2 | 3 }) =>
    rawCall<{ ok: boolean; message?: string | null; muted?: boolean }>('discord.channel', { channelId, action: 'level' in change ? 'notify' : 'mute', ...change }, 30_000),
  discordMarkRead: (guildId: string) => rawCall<{ ok: boolean }>('discord.markRead', { guildId }),
  discordSetStatus: (status: 'online' | 'idle' | 'dnd' | 'invisible') => rawCall<{ ok: boolean; message?: string | null }>('discord.setStatus', { status }),
  discordTyping: (channelId: string) => rawCall<{ ok: boolean }>('discord.typing', { channelId }),
  /**
   * Apps: the commands here (commands), or what the user just did: run a command, ask an option's autocomplete, press a
   * message's button or choose in its select (component), submit an app's form (modal), dismiss an ephemeral message.
   */
  discordApps: (channelId: string, action: 'commands' | 'run' | 'autocomplete' | 'component' | 'modal' | 'dismiss', params: Record<string, unknown> = {}) =>
    rawCall<{ ok: boolean; message?: string | null; nonce?: string | null; commands?: AppCommand[]; applications?: AppInfo[] }>('discord.apps', { channelId, action, ...params }, 60_000),
  gpuDriver: (action: 'state' | 'update' = 'state', branch: 'game' | 'studio' = 'game') => rawCall<DriverState>('gpu.driver', { action, branch }, 60_000),
  gpuDisplay: (action: 'state' | 'set' | 'adjust' | 'video' | 'override' = 'state', change?: DisplayChange) =>
    rawCall<DisplayState>('gpu.display', { action, ...(change ?? {}) }, 30_000),
  /**
   * System > Graphics > Driver and profile: Exo's global profile for this PC; apply the G-SYNC or No G-SYNC variant (a
   * Radeon's with its Anti-Lag choice, an Intel GPU's with its Low latency choice), backing up what it replaces, or undo it.
   */
  gpuProfile: (action?: 'apply' | 'undo', gsync?: boolean, latency?: { antiLag?: RadeonAntiLag; lowLatency?: IntelLowLatency }) =>
    rawCall<GpuProfile>('gpu.profile', action ? { action, ...(action === 'apply' ? { gsync: gsync === true, ...latency } : {}) } : {}, 30_000),
  /** System > Graphics: the GPU's temperature, power, clock, VRAM and fan now. */
  gpuSensors: () => rawCall<GpuSensors>('gpu.sensors', {}, 15_000),
  /** Game sheet: a game's driver frame generation (a Radeon's Fluid Motion Frames, Intel's XeSS override); with a change, sets it for the game. */
  gpuGame: (id: string, change?: { afmf?: boolean; frameGen?: IntelFrameGen }) => rawCall<GpuGame>('gpu.game', { id, ...change }, 30_000),
  /** A Profile Inspector import to the global profile: pick a .nip (waits for the picker), apply, undo, cancel, or state. */
  gpuImport: (action: 'pick' | 'apply' | 'undo' | 'cancel' | 'state') =>
    rawCall<GpuImportAnswer>('gpu.import', { action }, action === 'pick' ? 10 * 60_000 : 30_000),
  /** System > This PC: the checks; apply or undo AMD's power plan tuning; gamemode opens Windows' Game Mode settings. */
  systemHealth: (action?: 'apply' | 'undo' | 'chipset' | 'gamemode') => rawCall<PcHealth>('system.health', action ? { action } : {}, 35_000),
  /** System > This PC > Interrupts: the devices; apply switches every one that can to MSI mode, undo puts all back, revert one. Waits on Windows' permission prompt. */
  systemInterrupts: (action?: 'apply' | 'undo' | 'revert', device?: string) =>
    rawCall<Interrupts>('system.interrupts', action ? { action, ...(device ? { device } : {}) } : {}, 120_000),
  /** The saved home page at once (refreshed behind it); refresh waits for a fresh one. */
  storeHome: (refresh = false) => rawCall<StoreHome>('store.home', refresh ? { refresh: true } : {}, 45_000),
  /** superseded: a newer search replaced this one. */
  storeSearch: (query: string) => rawCall<{ ok: boolean; message?: string; items: StoreTile[] }>('store.search', { query }, 20_000),
  /** A store page or CheapShark deal: opens in that store's launcher when installed, else the browser. */
  storeOpen: (url: string) => rawCall<{ ok: boolean; message?: string }>('store.open', { url }, 20_000),
  storeGame: (appId: string) => rawCall<StoreGame>('store.game', { appId }, 30_000),
  /** The other official launchers for a game page, Epic first; ok false when CheapShark did not answer. */
  storeGameOffers: (appId: string) => rawCall<{ ok: boolean; offers: StoreOffer[] }>('store.gameOffers', { appId }, 15_000),
  storeWishlist: (action: 'get' | 'add' | 'remove' | 'check', item?: { appId: string; name?: string }) =>
    rawCall<{ ok: boolean; message?: string; items: WishItem[] }>('store.wishlist', { action, ...(item ?? {}) }, 60_000),
  /** HID for the Devices room's mouse module: devices by opaque key, report bytes as base64. */
  hidList: (p: Record<string, unknown>) => rawCall<HidReply>('hid.list', p, 15_000),
  hidOpen: (p: Record<string, unknown>) => rawCall<HidReply>('hid.open', p, 15_000),
  hidClose: (p: Record<string, unknown>) => rawCall<HidReply>('hid.close', p),
  hidSendReport: (p: Record<string, unknown>) => rawCall<HidReply>('hid.sendReport', p),
  hidSendFeatureReport: (p: Record<string, unknown>) => rawCall<HidReply>('hid.sendFeatureReport', p),
  hidReceiveFeatureReport: (p: Record<string, unknown>) => rawCall<HidReply>('hid.receiveFeatureReport', p),
  hidReceiveInputReport: (p: Record<string, unknown>) => rawCall<HidReply>('hid.receiveInputReport', p),
  /** Exo Mouse's saved profiles: an opaque JSON object it owns, kept in Exo's data folder. */
  mouseProfilesGet: () => rawCall<{ ok: boolean; message?: string; data?: unknown }>('mouse.profiles.get'),
  mouseProfilesSet: (p: Record<string, unknown>) => rawCall<{ ok: boolean; message?: string }>('mouse.profiles.set', p),
  keysPreview: () =>
    rawCall<{ ok: boolean; looksLikeKey?: boolean; store?: string; key?: string }>('keys.preview'),
  keysActivate: (key: string, store?: string) =>
    rawCall<{ ok: boolean; store?: string; message?: string }>('keys.activate', {
      key,
      ...(store ? { store } : {}),
    }),
  twitchConnect: () =>
    rawCall<{ ok: boolean; message?: string }>('twitch.connect'),
}
