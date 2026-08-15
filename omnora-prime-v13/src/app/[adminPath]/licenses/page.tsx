import { notFound } from 'next/navigation'
import AdminLicensesPage from './LicensesDashboard'

interface Props {
  params: Promise<{ adminPath: string }>
}

export default async function LicensesGate({ params }: Props) {
  const { adminPath } = await params

  // Reject any path that isn't the exact secret segment
  if (adminPath !== process.env.ADMIN_PATH_SEGMENT) {
    notFound()
  }

  return <AdminLicensesPage />
}

export const dynamic = 'force-dynamic'
