/** Compact switch for settings rows: a native role="switch" button. */
export function Switch({
  checked,
  onChange,
  labelledBy,
  describedBy,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (value: boolean) => void
  labelledBy?: string
  describedBy?: string
  label?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      className="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
    >
      <span className="switch__control">
        <span className="switch__thumb" />
      </span>
    </button>
  )
}
