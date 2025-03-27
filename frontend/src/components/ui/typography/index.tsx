import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface TypographyProps {
  children: ReactNode
  className?: string
}

export function H1({ children, className }: TypographyProps) {
  return (
    <h1 className={cn(
      'font-heading scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl',
      className
    )}>
      {children}
    </h1>
  )
}

export function H2({ children, className }: TypographyProps) {
  return (
    <h2 className={cn(
      'font-heading scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0',
      className
    )}>
      {children}
    </h2>
  )
}

export function H3({ children, className }: TypographyProps) {
  return (
    <h3 className={cn(
      'font-heading scroll-m-20 text-2xl font-semibold tracking-tight',
      className
    )}>
      {children}
    </h3>
  )
}

export function P({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      'font-body leading-7 [&:not(:first-child)]:mt-6',
      className
    )}>
      {children}
    </p>
  )
}

export function Lead({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      'font-body text-xl text-text-secondary',
      className
    )}>
      {children}
    </p>
  )
}

export function Large({ children, className }: TypographyProps) {
  return (
    <div className={cn(
      'font-body text-lg font-semibold',
      className
    )}>
      {children}
    </div>
  )
}

export function Small({ children, className }: TypographyProps) {
  return (
    <small className={cn(
      'font-body text-sm font-medium leading-none',
      className
    )}>
      {children}
    </small>
  )
}

export function Subtle({ children, className }: TypographyProps) {
  return (
    <p className={cn(
      'font-body text-sm text-text-secondary',
      className
    )}>
      {children}
    </p>
  )
}

export function Accent({ children, className }: TypographyProps) {
  return (
    <span className={cn(
      'font-accent text-2xl text-primary-dark',
      className
    )}>
      {children}
    </span>
  )
} 