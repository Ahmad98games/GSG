import { notFound } from 'next/navigation'
import AdminDashboard from './AdminDashboard'

interface Props {
  params: Promise<{ adminPath: string }>
}

export default async function AdminGate({ params }: Props) {
  const { adminPath } = await params

  // Reject any path that isn't the exact secret segment
  // This makes every other path return 404, not a redirect
  if (adminPath !== process.env.ADMIN_PATH_SEGMENT) {
    notFound()
  }

  return <AdminDashboard />
}

// Mark as dynamic so it is never statically generated
// and the path is never in the build output's route manifest
export const dynamic = 'force-dynamic'
