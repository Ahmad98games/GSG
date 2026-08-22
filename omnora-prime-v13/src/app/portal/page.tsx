import { redirect } from 'next/navigation';

interface Props {
  searchParams: Promise<{ t?: string; token?: string; partyId?: string }>;
}

export default async function PortalIndexPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.t || params.token;
  const partyId = params.partyId;

  if (token) {
    redirect(`/portal/${encodeURIComponent(token)}`);
  }

  if (partyId) {
    redirect(`/parties/${partyId}`);
  }

  // Fallback to internal parties directory instead of external website landing
  redirect('/parties');
}
