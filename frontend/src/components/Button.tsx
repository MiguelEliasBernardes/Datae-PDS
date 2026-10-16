import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'sm'
  /** Família do rótulo. Por padrão: primary → Inclusive Sans, secondary → Inter. */
  font?: 'display' | 'sans'
  /** Ícone opcional exibido ao final do rótulo (ex.: seta, circle-plus). */
  icon?: ReactNode
}

const variants = {
  primary: 'bg-primary text-surface hover:bg-primary/90',
  secondary:
    'bg-surface text-primary-strong border-[1.5px] border-primary hover:bg-primary/5',
} as const

const sizes = {
  md: 'h-12 rounded-[10px] text-[14px]',
  sm: 'h-9 rounded-[9px] text-[13px]',
} as const

const fonts = {
  display: 'font-display',
  sans: 'font-sans',
} as const

/** Botão reutilizável nas variantes "principal" e "secundário" do Figma. */
export function Button({
  variant = 'primary',
  size = 'md',
  font,
  icon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const fontClass = fonts[font ?? (variant === 'primary' ? 'display' : 'sans')]
  return (
    <button
      className={`relative flex w-full items-center justify-center font-medium transition-colors ${variants[variant]} ${sizes[size]} ${fontClass} ${className}`}
      {...props}
    >
      <span>{children}</span>
      {icon && (
        <span className="absolute right-4 flex items-center">{icon}</span>
      )}
    </button>
  )
}
