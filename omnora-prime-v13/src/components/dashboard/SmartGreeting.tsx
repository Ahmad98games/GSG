'use client'
import { useMemo } from 'react'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { useCurrentUser } from '@/hooks/useCurrentUser'

export function SmartGreeting() {
  const { profile } = useBusinessProfile()
  const { currentUser } = useCurrentUser()

  const greeting = useMemo(() => {
    const hour = new Date().getHours()
    const day = new Date().getDay()

    let timeGreeting = ''
    if (hour >= 5 && hour < 12)
      timeGreeting = 'Good morning'
    else if (hour >= 12 && hour < 17)
      timeGreeting = 'Good afternoon'
    else if (hour >= 17 && hour < 21)
      timeGreeting = 'Good evening'
    else
      timeGreeting = 'Working late'

    const name = currentUser?.name
      ?.split(' ')[0] || (profile as any)?.owner_name?.split(' ')[0] || 'there'

    const dayAlerts: string[] = []
    if (day === 5) // Friday
      dayAlerts.push('Payroll day')
    if (day === 1) // Monday
      dayAlerts.push('New week')

    return { timeGreeting, name, dayAlerts }
  }, [currentUser, profile])

  return (
    <div className="flex items-baseline gap-3 mb-6">
      <h1 className="text-2xl font-bold text-white tracking-tight">
        {greeting.timeGreeting},{' '}
        <span className="text-[#60A5FA]">
          {greeting.name}
        </span>
      </h1>
      {greeting.dayAlerts.map(alert => (
        <span key={alert}
          className="text-[10px] font-bold uppercase tracking-widest text-[#C5A059] bg-[#C5A059]/10 border border-[#C5A059]/20 px-2 py-0.5 rounded-sm">
          {alert}
        </span>
      ))}
    </div>
  )
}
