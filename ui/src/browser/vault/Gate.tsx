import { useEffect, useRef, useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Row, Section } from '../../components/settings/parts'
import * as I from '../icons'
import { create, helloUnlock, unlock, useVault } from './store'
import { strength } from './generate'

/** Making the vault: a master password it can't be opened without, which nobody can reset. */
export function CreateVault() {
  const v = useVault()
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const s = strength(password)
  const ready = password.length >= 10 && s.score >= 2 && password === again && !v.busy
  const why = password && password.length < 10 ? 'At least 10 characters' : password && s.score < 2 ? `${s.label}: add words, numbers or symbols` : again && again !== password ? "The two don't match" : ''
  return (
    <Section id="vault-create" title="Create your Exo Vault">
      <Row label="Your passwords, on this PC only" detail="Encrypted here with a master password. Nothing is sent anywhere, and nobody can open it without you" icon={<I.Vault />} />
      <Row label="Master password" detail={password ? `${s.label}. Nobody can reset it, Exo included, so pick one you'll remember` : 'Nobody can reset it, Exo included, so pick one you’ll remember'} error={why || v.error || null}>
        <input className="exo-field exb-field" type="password" autoComplete="new-password" aria-label="Master password" placeholder="Password" value={password} autoFocus
          onChange={e => setPassword(e.target.value)} />
        <input className="exo-field exb-field" type="password" autoComplete="new-password" aria-label="Master password again" placeholder="Again" value={again}
          onChange={e => setAgain(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && ready) create(password) }} />
      </Row>
      <Row label="Create the vault" detail="Then bring in your passwords from other browsers and password managers in one click">
        <Button size="sm" className="exo-set-btn is-primary" isDisabled={!ready} onPress={() => create(password)}>{v.busy ? 'Creating…' : 'Create'}</Button>
      </Row>
    </Section>
  )
}

/** Opening it: Windows Hello straight away when it's on, the master password otherwise. */
function UnlockVault() {
  const v = useVault()
  const [password, setPassword] = useState('')
  const asked = useRef(false)
  useEffect(() => {
    if (v.hello && !asked.current) { asked.current = true; helloUnlock() }
  }, [v.hello])
  return (
    <Section id="vault-unlock" title="Exo Vault is locked">
      {v.hello ? (
        <Row label="Windows Hello" detail="Your face, fingerprint or PIN" icon={<I.Fingerprint />}>
          <Button size="sm" className="exo-set-btn is-primary" isDisabled={v.busy} onPress={helloUnlock}>Unlock</Button>
        </Row>
      ) : null}
      <Row label="Master password" icon={<I.Lock />} error={v.error || null}>
        <input className="exo-field exb-field" type="password" autoComplete="current-password" aria-label="Master password" value={password}
          autoFocus={!v.hello} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && password && !v.busy) unlock(password) }} />
        <Button size="sm" className={`exo-set-btn${v.hello ? '' : ' is-primary'}`} isDisabled={!password || v.busy} onPress={() => unlock(password)}>{v.busy ? 'Opening…' : 'Unlock'}</Button>
      </Row>
    </Section>
  )
}

export function Gate() {
  const v = useVault()
  return v.state === 'none' ? <CreateVault /> : <UnlockVault />
}
