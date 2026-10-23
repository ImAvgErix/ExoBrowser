import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'

/** section: a heading over the items that share it (macOS menus); on: this item's own check, for a menu
    with one choice per section. */
export type MenuItem = { id: string; label: string; icon?: ReactNode; section?: string; on?: boolean }

/** A long section (a song's playlists) gets a field that narrows it, past this many items. */
const FILTER_FROM = 10

/** Menu button over a native popover: top layer, light dismiss, anchored under its trigger. */
export function Menu({ label, anchor, offset, triggerClassName, trigger, items, checked, filter, disabled = false, onAction }: {
  label: string
  anchor: `--${string}`
  offset: number
  triggerClassName: string
  trigger: ReactNode
  items: MenuItem[]
  /** Set for a single-choice menu: the items become menuitemradio. */
  checked?: string
  /** section: the items a field above it narrows (shown once it is long); label: the field's name. */
  filter?: { section: string; label: string }
  /** A trigger that can't open its menu, by pointer or keyboard. */
  disabled?: boolean
  onAction: (id: string) => void
}) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [find, setFind] = useState('')
  const filtering = !!filter && items.filter(item => item.section === filter.section).length > FILTER_FROM
  const needle = find.trim().toLowerCase()
  const shown = filtering && needle ? items.filter(item => item.section !== filter.section || item.label.toLowerCase().includes(needle)) : items
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const entries = () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]') ?? [])
  // The name carries the current choice too, as the trigger shows it ("Sort library, Recent").
  const current = checked === undefined ? undefined : items.find(item => item.id === checked)?.label
  function hide(returnFocus: boolean) {
    if (menuRef.current?.matches(':popover-open')) menuRef.current.hidePopover()
    if (returnFocus) triggerRef.current?.focus()
  }
  function choose(itemId: string) {
    hide(true)
    onAction(itemId)
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const list = entries()
    const at = list.indexOf(document.activeElement as HTMLElement)
    const typing = event.target instanceof HTMLInputElement
    const to = typing ? { ArrowDown: 0, ArrowUp: list.length - 1 }[event.key]
      : { ArrowDown: at + 1, ArrowUp: at - 1, Home: 0, End: list.length - 1 }[event.key]
    if (to !== undefined) {
      event.preventDefault()
      list[(to + list.length) % list.length]?.focus()
    } else if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      hide(true)
    } else if (event.key === 'Tab') hide(false)
  }
  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={triggerClassName}
        style={{ anchorName: anchor }}
        aria-label={current ? `${label}, ${current}` : label}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={id}
        popoverTarget={id}
      >
        {trigger}
      </button>
      <div
        ref={menuRef}
        id={id}
        popover="auto"
        role="menu"
        aria-label={label}
        className="exo-shelf-sort-menu"
        style={{ positionAnchor: anchor, marginTop: offset }}
        onToggle={(event) => {
          setOpen(event.newState === 'open')
          if (event.newState !== 'open') setFind('')
          else (entries().find((item) => item.ariaChecked === 'true') ?? entries()[0])?.focus()
        }}
        onKeyDown={onKeyDown}
      >
        {filtering ? (
          <input type="search" className="exo-menu-find" value={find} placeholder={filter.label} aria-label={filter.label}
            onChange={(event) => setFind(event.target.value)} />
        ) : null}
        {shown.map((item, index) => [
          item.section && item.section !== shown[index - 1]?.section
            ? <div key={'section:' + item.section} className="exo-menu-section" role="presentation">{item.section}</div>
            : null,
          <div
            key={item.id}
            role={checked === undefined && item.on === undefined ? 'menuitem' : 'menuitemradio'}
            aria-checked={item.on ?? (checked === undefined ? undefined : item.id === checked)}
            tabIndex={-1}
            className="exo-menu-item"
            onClick={() => choose(item.id)}
            onKeyDown={(event) => {
              if (event.key !== 'Enter' && event.key !== ' ') return
              event.preventDefault()
              choose(item.id)
            }}
          >
            {item.icon}
            {item.label}
          </div>,
        ])}
      </div>
    </>
  )
}
