import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from '../../lib/utils'

/**
 * Native button. `.button` (tokens.css) is the base; `variant` is a page's lone primary (first run, Setup, a signed-out
 * room) or a quiet one (the Bar's icons, Back, a sheet's close). Every other button is `.exo-set-btn`
 * (`.is-primary`, `.is-danger`, `.is-compact`; DESIGN.md › Controls), passed as `className`.
 */
export function Button({ variant, size = 'md', isIconOnly, isDisabled, onPress, className, type = 'button', ...rest }:
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onClick' | 'title'> & {
    variant?: 'primary' | 'ghost'
    size?: 'sm' | 'md'
    isIconOnly?: boolean
    isDisabled?: boolean
    onPress?: () => void
    ref?: Ref<HTMLButtonElement>
  }) {
  return (
    <button
      {...rest}
      type={type}
      disabled={isDisabled}
      onClick={onPress && (() => onPress())}
      className={cn('button', variant && `button--${variant}`, size === 'sm' && 'button--sm', isIconOnly && 'button--icon-only', className)}
    />
  )
}
