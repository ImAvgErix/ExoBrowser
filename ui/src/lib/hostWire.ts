// Generated from ExoBridgeProtocol.cs. Run npm run contracts:write after reviewing wire changes.
export type AppUpdateResponse = {
  ok: boolean
  alreadyLatest?: boolean
  updateAvailable?: boolean
  installed?: boolean
  shouldExit?: boolean
  inApp?: boolean
  latest?: string
  current?: string
  message?: string
}
