import { useEffect, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Row, Section } from '../../components/settings/parts'
import { send } from '../host'
import { addLogins, b64, onVaultMessage, setVault, useVault, vaultNow, type Item, type VaultData } from './store'
import { readExport } from './importers'

/*
 * Moving in and out: saved passwords straight from every browser on this PC, any other password manager's export,
 * and an encrypted export of this vault to open on another PC.
 */

type Found = { url: string; username: string; password: string; created: number }

onVaultMessage('importItems', m => {
  let found: Found[] = []
  try { found = JSON.parse(m.items as string) as Found[] } catch { /* nothing readable */ }
  const source = m.source as string
  const locked = Number(m.locked) || 0
  // Nothing saved there: the passwords may live in a password manager instead.
  if (!found.length && !locked) {
    setVault({ note: `${source} has no passwords saved on this PC. If a password manager kept them (Proton Pass, Bitwarden), export from it and bring that file in` })
    return
  }
  addLogins(found.map(f => ({ type: 'login', urls: [f.url], username: f.username, password: f.password, created: f.created || undefined })), source)
  if (locked) setVault({ note: `${vaultNow().note}. ${locked} more couldn't be read here: export them from ${source} as a CSV file and bring that in` })
})
onVaultMessage('importText', m => {
  const items = readExport(m.name as string, m.text as string)
  if (items.length) addLogins(items, m.name as string)
  else setVault({ note: `${m.name as string} has nothing Exo Vault can read. Export as CSV or unencrypted JSON and try that` })
})
onVaultMessage('importJson', m => {
  let data: Partial<VaultData> = {}
  try { data = JSON.parse(m.json as string) as VaultData } catch { /* nothing readable */ }
  setVault({ importLocked: '' })
  addLogins((data.items ?? []).filter((i: Item) => !i.trashed), 'the Exo Vault export')
})

function Browsers() {
  const v = useVault()
  useEffect(() => { send('vaultSources') }, [])
  return (
    <Section id="vault-import" title="Bring in passwords">
      {v.sources.map(([key, name]) => (
        <Row key={key} label={name} detail={`The passwords ${name} saved on this PC. Close ${name} first if it is open`}>
          <Button size="sm" className="exo-set-btn" onPress={() => send('vaultImportBrowser', key)}>Import</Button>
        </Row>
      ))}
      <Row label="From a file" detail="An export from Proton Pass, Bitwarden, 1Password, LastPass, Dashlane, KeePass, Safari or any browser (CSV or JSON), or an Exo Vault export">
        <Button size="sm" className="exo-set-btn" onPress={() => send('vaultImportFile')}>Choose file</Button>
      </Row>
      <ExoFile />
    </Section>
  )
}

/** An Exo Vault export opens with the password it was exported with. */
function ExoFile() {
  const v = useVault()
  const [password, setPassword] = useState('')
  if (!v.importLocked) return null
  const open = () => { send('vaultImportOpen', b64(password)); setPassword('') }
  return (
    <Row label={v.importLocked} detail="The password this export was made with" error={v.error || null}>
      <input className="exo-field exb-field" type="password" aria-label="Export password" value={password} autoFocus onChange={e => setPassword(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && password) open() }} />
      <Button size="sm" className="exo-set-btn is-primary" isDisabled={!password} onPress={open}>Open</Button>
    </Row>
  )
}

function Export() {
  const v = useVault()
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const ready = password.length >= 10 && password === again
  const go = () => {
    send('vaultExport', b64(password), b64(JSON.stringify(v.data)))
    setPassword('')
    setAgain('')
  }
  return (
    <Section id="vault-export" title="Export">
      <Row label="Encrypted export" detail="One file with everything in the vault, locked with a password you choose here. Open it in Exo Vault on another PC"
        error={password && password.length < 10 ? 'At least 10 characters' : again && again !== password ? "The two don't match" : null}>
        <input className="exo-field exb-field" type="password" autoComplete="new-password" aria-label="Export password" placeholder="Password" value={password}
          onChange={e => setPassword(e.target.value)} />
        <input className="exo-field exb-field" type="password" autoComplete="new-password" aria-label="Export password again" placeholder="Again" value={again}
          onChange={e => setAgain(e.target.value)} />
        <Button size="sm" className="exo-set-btn is-primary" isDisabled={!ready} onPress={go}>Export</Button>
      </Row>
    </Section>
  )
}

export function Transfer() {
  return (
    <>
      <Browsers />
      <Export />
    </>
  )
}
