import { redirect } from 'next/navigation';

export default function TestSupabaseRedirect() {
  redirect('/settings/diagnostics');
}
