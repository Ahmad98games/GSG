import { notFound } from 'next/navigation'
import AdminPaymentsPage from './PaymentsDashboard'

interface Props {
  params: Promise<{ adminPath: string }>
}

export default async function PaymentsGate({ params }: Props) {
  const { adminPath } = await params

  // Reject any path that isn't the exact secret segment
  if (adminPath !== process.env.ADMIN_PATH_SEGMENT) {
    notFound()
  }

  return <AdminPaymentsPage />
}

export const dynamic = 'force-dynamic'
