/**
 * humanizeError — converts raw Supabase / network / auth errors into
 * plain-language messages that factory owners can actually act on.
 *
 * Usage:
 *   import { humanizeError } from '@/lib/utils/errors'
 *   ...
 *   catch (err: any) {
 *     const msg = humanizeError(err, 'payment')
 *     toast.error(msg)
 *   }
 */
export function humanizeError(error: any, context?: string): string {
  if (!error) return 'Something went wrong. Please try again.'

  const msg: string =
    error?.message || error?.details || error?.hint || String(error)

  // ── Supabase / Postgres constraint errors ──────────────────────────────
  if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
    return `This ${context || 'record'} already exists. Try a different name or code.`
  }

  if (msg.includes('violates not-null') || msg.includes('null value in column')) {
    const col = msg.match(/"(\w+)"/)?.[1]
    return col
      ? `"${col}" is required. Please fill it in before saving.`
      : 'A required field is missing. Please check the form and try again.'
  }

  if (msg.includes('foreign key') || msg.includes('violates foreign key')) {
    return `This ${context || 'record'} is linked to other data and cannot be deleted or modified right now.`
  }

  if (msg.includes('check constraint')) {
    return `The value you entered is not allowed. Please check the field and try again.`
  }

  // ── Auth errors ────────────────────────────────────────────────────────
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
    return 'Wrong email or password. Please try again.'
  }

  if (msg.includes('Email not confirmed')) {
    return 'Please verify your email address before logging in.'
  }

  if (msg.includes('JWT expired') || msg.includes('session_not_found')) {
    return 'Your session has expired. Please log in again.'
  }

  if (msg.includes('User already registered')) {
    return 'An account with this email already exists.'
  }

  // ── Network / connectivity errors ──────────────────────────────────────
  if (
    msg.includes('Failed to fetch') ||
    msg.includes('NetworkError') ||
    msg.includes('net::ERR') ||
    msg.includes('ECONNREFUSED') ||
    msg.includes('fetch failed')
  ) {
    return 'Network error. Please check your internet connection and try again.'
  }

  if (msg.includes('timeout') || msg.includes('ETIMEDOUT')) {
    return 'The request took too long. Please try again.'
  }

  // ── Permission errors ──────────────────────────────────────────────────
  if (
    msg.includes('permission denied') ||
    msg.includes('not authorized') ||
    msg.includes('insufficient privilege')
  ) {
    return "You don't have permission to do this. Contact your administrator."
  }

  if (msg.includes('row-level security') || msg.includes('RLS')) {
    return 'Access denied. You can only view or edit your own data.'
  }

  // ── Storage errors ─────────────────────────────────────────────────────
  if (msg.includes('Payload too large') || msg.includes('413')) {
    return 'The file is too large. Please reduce the file size and try again.'
  }

  if (msg.includes('storage') && msg.includes('not found')) {
    return 'The file could not be found. It may have been deleted.'
  }

  // ── Fallback: strip raw SQL/JSON noise and return cleaned message ───────
  // If it looks like a plain English message, return it directly.
  if (msg.length < 200 && !msg.includes('ERROR:') && !msg.includes('PGRST')) {
    return msg
  }

  return context
    ? `Could not ${context}. Please try again or contact support.`
    : 'Something went wrong. Please try again.'
}
