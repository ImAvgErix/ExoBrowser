import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Row, Section } from '../../components/settings/parts'
import * as I from '../icons'
import { useBrowser } from '../host'
import { saveItem, setVault, useVault, type Field, type Item } from './store'
import { Act } from './parts'
import { DEFAULT_RECIPE, generate, strength } from './generate'
import { parseOtp } from './totp'
import { siteName } from './sites'

type Edit = (patch: Partial<Item>) => void
type Key = keyof Item

/** A text field for one of the item's values. */
function Input({ item, edit, field, label, type = 'text', placeholder, wide }: { item: Item; edit: Edit; field: Key; label: string; type?: string; placeholder?: string; wide?: boolean }) {
  return (
    <Row label={label}>
      <input className={`exo-field exb-field${wide ? ' is-wide' : ''}`} type={type} aria-label={label} placeholder={placeholder} spellCheck={false} autoComplete="off"
        value={(item[field] as string | undefined) ?? ''} onChange={e => edit({ [field]: e.target.value })} />
    </Row>
  )
}

/** Generated passwords follow Vault settings: their length, and whether they use symbols. */
export function useRecipe() {
  const b = useBrowser()
  return { ...DEFAULT_RECIPE, length: Number(b.settings.vaultLength || DEFAULT_RECIPE.length), symbols: (b.settings.vaultSymbols || 'on') === 'on' }
}

function PasswordInput({ item, edit }: { item: Item; edit: Edit }) {
  const [shown, setShown] = useState(!item.password)
  const recipe = useRecipe()
  const s = strength(item.password ?? '')
  return (
    <Row label="Password" detail={item.password ? `${s.label} · ${s.bits} bits` : 'Make one with the dice'}>
      <input className="exo-field exb-field is-wide exb-vault-mono" type={shown ? 'text' : 'password'} aria-label="Password" spellCheck={false} autoComplete="off"
        value={item.password ?? ''} onChange={e => edit({ password: e.target.value })} />
      <Act label={shown ? 'Hide password' : 'Show password'} onPress={() => setShown(v => !v)}>{shown ? <I.EyeOff /> : <I.Eye />}</Act>
      <Act label="Generate a strong password" onPress={() => { edit({ password: generate(recipe) }); setShown(true) }}><I.Dice /></Act>
    </Row>
  )
}

function LoginFields({ item, edit }: { item: Item; edit: Edit }) {
  const otpBad = !!item.totp && !parseOtp(item.totp)
  return (
    <>
      <Input item={item} edit={edit} field="username" label="Username or email" />
      <PasswordInput item={item} edit={edit} />
      <Row label="Websites" detail="Separate more than one with commas. Exo Vault fills this login on these sites only">
        <input className="exo-field exb-field is-wide" aria-label="Websites" placeholder="example.com" spellCheck={false} value={(item.urls ?? []).join(', ')}
          onChange={e => edit({ urls: e.target.value.split(/\s*,\s*/).filter((u, n, all) => u || n === all.length - 1) })} />
      </Row>
      <Row label="2FA setup key" detail={otpBad ? "That isn't a setup key or an otpauth:// link" : 'The key or otpauth:// link a site shows when you turn on an authenticator app'}>
        <input className="exo-field exb-field is-wide exb-vault-mono" aria-label="2FA setup key" spellCheck={false} autoComplete="off" value={item.totp ?? ''}
          onChange={e => edit({ totp: e.target.value.trim() })} />
      </Row>
    </>
  )
}

function CardFields({ item, edit }: { item: Item; edit: Edit }) {
  return (
    <>
      <Input item={item} edit={edit} field="cardholder" label="Name on card" />
      <Input item={item} edit={edit} field="number" label="Card number" type="password" />
      <Input item={item} edit={edit} field="expiry" label="Expires" placeholder="MM/YY" />
      <Input item={item} edit={edit} field="cvv" label="Security code" type="password" />
      <Input item={item} edit={edit} field="pin" label="PIN" type="password" />
    </>
  )
}

function IdentityFields({ item, edit }: { item: Item; edit: Edit }) {
  return (
    <>
      <Input item={item} edit={edit} field="fullName" label="Full name" />
      <Input item={item} edit={edit} field="email" label="Email" type="email" />
      <Input item={item} edit={edit} field="phone" label="Phone" type="tel" />
      <Input item={item} edit={edit} field="company" label="Company" />
      <Input item={item} edit={edit} field="address" label="Street address" wide />
      <Input item={item} edit={edit} field="city" label="City" />
      <Input item={item} edit={edit} field="region" label="State or region" />
      <Input item={item} edit={edit} field="postal" label="Postal code" />
      <Input item={item} edit={edit} field="country" label="Country" />
    </>
  )
}

const FIELDS = { login: LoginFields, card: CardFields, identity: IdentityFields, note: () => null } as const
const TITLES = { login: 'login', card: 'card', note: 'note', identity: 'identity' } as const

/** Fields of your own: a name and a value, hidden like a password when you choose. */
function CustomFields({ item, edit }: { item: Item; edit: Edit }) {
  const fields = item.fields ?? []
  const set = (n: number, patch: Partial<Field>) => edit({ fields: fields.map((f, i) => (i === n ? { ...f, ...patch } : f)) })
  return (
    <>
      {fields.map((f, n) => (
        <Row key={n} label={f.name || 'Field'}>
          <input className="exo-field exb-field" aria-label="Field name" placeholder="Name" value={f.name} onChange={e => set(n, { name: e.target.value })} />
          <input className="exo-field exb-field" aria-label="Field value" placeholder="Value" type={f.hidden ? 'password' : 'text'} value={f.value}
            onChange={e => set(n, { value: e.target.value })} />
          <Act label={f.hidden ? 'Show this field' : 'Hide this field'} onPress={() => set(n, { hidden: !f.hidden })}>{f.hidden ? <I.EyeOff /> : <I.Eye />}</Act>
          <Act label="Remove this field" onPress={() => edit({ fields: fields.filter((_, i) => i !== n) })}><I.Trash /></Act>
        </Row>
      ))}
      <Row label="Add a field" detail="A security question, an account number, anything else">
        <Button size="sm" className="exo-set-btn" onPress={() => edit({ fields: [...fields, { name: '', value: '' }] })}>Add</Button>
      </Row>
    </>
  )
}

export function ItemEditor({ item: start }: { item: Item }) {
  const v = useVault()
  const [item, setItem] = useState(start)
  const edit: Edit = patch => setItem(i => ({ ...i, ...patch }))
  const exists = !!v.data?.items.some(i => i.id === item.id)
  const Fields = FIELDS[item.type]
  const save = () => {
    const urls = (item.urls ?? []).map(u => u.trim()).filter(Boolean)
    const name = item.name.trim() || (urls[0] ? siteName(urls[0]) : '') || `New ${TITLES[item.type]}`
    saveItem({ ...item, name, urls })
    setVault({ editing: null, selected: item.id })
  }
  return (
    <Section id="vault-edit" title={exists ? `Edit ${start.name || TITLES[item.type]}` : `New ${TITLES[item.type]}`} action={
      <div className="exb-set-actions">
        <Button size="sm" className="exo-set-btn" onPress={() => setVault({ editing: null })}>Cancel</Button>
        <Button size="sm" className="exo-set-btn is-primary" onPress={save}>Save</Button>
      </div>}>
      <Input item={item} edit={edit} field="name" label="Name" placeholder={item.type === 'login' ? 'Taken from the website when empty' : undefined} />
      <Fields item={item} edit={edit} />
      <Row label="Note" detail={item.type === 'note' ? 'Kept encrypted, like everything in the vault' : undefined}>
        <textarea className="exo-field exb-field is-wide exb-vault-textarea" aria-label="Note" value={item.note ?? ''} onChange={e => edit({ note: e.target.value })} />
      </Row>
      <CustomFields item={item} edit={edit} />
    </Section>
  )
}
