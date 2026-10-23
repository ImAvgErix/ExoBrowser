import { useState } from 'react'
import { Button } from '../../components/ui/Button'
import { Menu } from '../../components/ui/Menu'
import { Row, Section } from '../../components/settings/parts'
import * as I from '../icons'
import { send } from '../host'
import { deleteForever, emptyTrash, newItem, restoreItem, setVault, toggleFavorite, trashItem, useVault, type Item, type ItemType } from './store'
import { Act, ItemRow, OtpRow, Plain, Secret } from './parts'
import { strength } from './generate'
import { ItemEditor } from './Editor'

export const LISTS: Record<string, { title: string; keep: (i: Item) => boolean; empty: string }> = {
  all: { title: 'All items', keep: i => !i.trashed, empty: 'Nothing saved yet. Add a login, or bring yours in from Import and export' },
  login: { title: 'Logins', keep: i => !i.trashed && i.type === 'login', empty: 'No logins yet' },
  card: { title: 'Cards', keep: i => !i.trashed && i.type === 'card', empty: 'No cards yet' },
  note: { title: 'Notes', keep: i => !i.trashed && i.type === 'note', empty: 'No notes yet' },
  identity: { title: 'Identities', keep: i => !i.trashed && i.type === 'identity', empty: 'No identities yet' },
  favorite: { title: 'Favorites', keep: i => !i.trashed && !!i.favorite, empty: 'Star an item to keep it here' },
  trash: { title: 'Trash', keep: i => !!i.trashed, empty: 'The trash is empty' },
}

const NEW: { id: ItemType; label: string }[] = [{ id: 'login', label: 'Login' }, { id: 'card', label: 'Card' }, { id: 'note', label: 'Note' }, { id: 'identity', label: 'Identity' }]

const matches = (i: Item, q: string) =>
  [i.name, i.username, i.email, i.note, i.cardholder, i.fullName, ...(i.urls ?? [])].some(v => (v ?? '').toLowerCase().includes(q))

export function ItemList({ section }: { section: string }) {
  const v = useVault()
  const [query, setQuery] = useState('')
  const list = LISTS[section] ?? LISTS.all
  const q = query.trim().toLowerCase()
  const items = (v.data?.items ?? []).filter(i => list.keep(i) && (!q || matches(i, q))).sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  const isTrash = section === 'trash'
  return (
    <Section id={`vault-${section}`} title={list.title} action={
      <div className="exb-set-actions">
        <input className="exo-field exb-field" type="search" placeholder={`Search ${items.length} ${items.length === 1 ? 'item' : 'items'}`} aria-label="Search the vault" value={query} spellCheck={false}
          onChange={e => setQuery(e.target.value)} />
        {isTrash
          ? <Button size="sm" className="exo-set-btn is-danger" isDisabled={!items.length} onPress={emptyTrash}>Empty trash</Button>
          : <Menu label="New item" anchor="--exb-vault-new" offset={4} triggerClassName="exo-set-btn exb-vault-new" trigger={<><I.Plus size={14} />New</>}
              items={NEW} onAction={id => setVault({ editing: newItem(id as ItemType, section === 'favorite' ? { favorite: true } : {}), selected: null })} />}
      </div>}>
      {items.length ? items.map(i => (
        <ItemRow key={i.id} item={i}>{isTrash ? (
          <>
            <Act label="Restore" onPress={() => restoreItem(i.id)}><I.Undo /></Act>
            <Act label="Delete forever" onPress={() => deleteForever(i.id)}><I.Trash /></Act>
          </>
        ) : undefined}</ItemRow>
      )) : <Row label={q ? `Nothing matches “${query}”` : list.empty} />}
    </Section>
  )
}

function LoginRows({ item }: { item: Item }) {
  const s = item.password ? strength(item.password) : null
  return (
    <>
      <Plain label="Username" value={item.username} what="Username copied" />
      <Secret label="Password" value={item.password} what="Password copied" detail={s ? `${s.label} · ${s.bits} bits` : undefined} />
      <OtpRow secret={item.totp} />
      {(item.urls ?? []).map(u => (
        <Row key={u} label="Website" detail={u}>
          <Act label="Open website" onPress={() => send('navigate', /^https?:/i.test(u) ? u : `https://${u}`, 'new')}><I.ExternalLink /></Act>
        </Row>
      ))}
    </>
  )
}

function CardRows({ item }: { item: Item }) {
  return (
    <>
      <Plain label="Cardholder" value={item.cardholder} />
      <Secret label="Number" value={item.number} what="Card number copied" />
      <Plain label="Expires" value={item.expiry} />
      <Secret label="Security code" value={item.cvv} what="Security code copied" />
      <Secret label="PIN" value={item.pin} what="PIN copied" />
    </>
  )
}

function IdentityRows({ item }: { item: Item }) {
  const place = [item.address, [item.city, item.region, item.postal].filter(Boolean).join(' '), item.country].filter(Boolean).join(', ')
  return (
    <>
      <Plain label="Name" value={item.fullName} />
      <Plain label="Email" value={item.email} />
      <Plain label="Phone" value={item.phone} />
      <Plain label="Company" value={item.company} />
      <Plain label="Address" value={place} />
    </>
  )
}

const ROWS = { login: LoginRows, card: CardRows, identity: IdentityRows, note: () => null } as const
const when = (t: number) => new Date(t).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

function History({ item }: { item: Item }) {
  if (!item.history?.length) return null
  return (
    <Section id="vault-history" title="Password history">
      {item.history.map(h => <Secret key={h.changed} label={`Until ${when(h.changed)}`} value={h.password} what="Old password copied" />)}
    </Section>
  )
}

const back = <Act label="Back to the list" onPress={() => setVault({ selected: null })}><I.Back /></Act>

function Actions({ item }: { item: Item }) {
  if (item.trashed) return (
    <div className="exb-set-actions">
      {back}
      <Button size="sm" className="exo-set-btn" onPress={() => restoreItem(item.id)}>Restore</Button>
      <Button size="sm" className="exo-set-btn is-danger" onPress={() => deleteForever(item.id)}>Delete forever</Button>
    </div>
  )
  return (
    <div className="exb-set-actions">
      {back}
      <Act label={item.favorite ? 'Remove from favorites' : 'Add to favorites'} onPress={() => toggleFavorite(item.id)}><I.Star filled={!!item.favorite} /></Act>
      <Button size="sm" className="exo-set-btn" onPress={() => setVault({ editing: item })}>Edit</Button>
      <Button size="sm" className="exo-set-btn is-danger" onPress={() => trashItem(item.id)}>Delete</Button>
    </div>
  )
}

export function ItemView({ item }: { item: Item }) {
  const Rows = ROWS[item.type]
  return (
    <>
      <Section id="vault-item" title={item.name || 'Untitled'} action={<Actions item={item} />}>
        <Rows item={item} />
        {item.note ? <Row label="Note" detail={<span className="exb-vault-note">{item.note}</span>} /> : null}
        {(item.fields ?? []).map((f, n) => (f.hidden
          ? <Secret key={n} label={f.name || 'Field'} value={f.value} what={`${f.name || 'Field'} copied`} />
          : <Plain key={n} label={f.name || 'Field'} value={f.value} />))}
        <Row label="Saved" detail={`Created ${when(item.created)} · changed ${when(item.modified)}`} icon={<I.Clock />} />
      </Section>
      <History item={item} />
    </>
  )
}

export function Items({ section }: { section: string }) {
  const v = useVault()
  if (v.editing) return <ItemEditor key={v.editing.id} item={v.editing} />
  const item = v.data?.items.find(i => i.id === v.selected)
  return item ? <ItemView item={item} /> : <ItemList section={section} />
}
