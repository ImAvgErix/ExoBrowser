import type { ButtonHTMLAttributes, Ref } from 'react'
import { cn } from '../../lib/utils'

/** Native button. `.button` and its modifiers (tokens.css) are the base; each call site's exo-* class carries the look. */
export function Button({ variant = 'primary', size = 'md', isIconOnly, isDisabled, onPress, className, type = 'button', ...rest }:
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onClick' | 'title'> & {
    variant?: 'primary' | 'secondary' | 'ghost'
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
      className={cn('button', `button--${variant}`, size === 'sm' && 'button--sm', isIconOnly && 'button--icon-only', className)}
    />
  )
}
