// utils/index.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, isPast, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// Merge Tailwind classes safely
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date in pt-BR
export function formatDate(date: string | Date | null, fmt = 'dd/MM/yyyy'): string {
  if (!date) return '—'
  return format(new Date(date), fmt, { locale: ptBR })
}

// Format datetime
export function formatDateTime(date: string | Date | null): string {
  return formatDate(date, "dd/MM/yyyy 'às' HH:mm")
}

// Format file size
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Is deadline overdue?
export function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false
  return isPast(new Date(deadline))
}

// Days until deadline
export function daysUntilDeadline(deadline: string | null): number | null {
  if (!deadline) return null
  return differenceInDays(new Date(deadline), new Date())
}

// Deadline urgency class
export function deadlineUrgencyClass(deadline: string | null): string {
  const days = daysUntilDeadline(deadline)
  if (days === null) return ''
  if (days < 0) return 'text-danger'
  if (days <= 1) return 'text-warning'
  if (days <= 3) return 'text-amber-500'
  return 'text-ink-muted'
}

// Truncate text
export function truncate(text: string, length = 80): string {
  if (text.length <= length) return text
  return text.slice(0, length).trimEnd() + '…'
}

// Copy to clipboard
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

// Generate initials from name
export function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0]?.toUpperCase() ?? '')
    .join('')
}

// Consistent color from string (for avatars)
export function stringToColor(str: string): string {
  const COLORS = [
    '#5B4FE8', '#3B82F6', '#10B981', '#F59E0B',
    '#EF4444', '#8B5CF6', '#EC4899', '#0D9488',
  ]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLORS[Math.abs(hash) % COLORS.length]
}
