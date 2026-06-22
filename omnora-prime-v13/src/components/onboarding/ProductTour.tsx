'use client'
import { useState, useEffect } from 'react'
import { Joyride, Step, EventData, STATUS } from 'react-joyride'
import { useRouter } from 'next/navigation'

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to Noxis Hub',
    content: 'This is a quick 60-second tour of how everything works. You can skip anytime.',
    skipBeacon: true,
  },
  {
    target: '[data-tour="sidebar-core"]',
    title: 'Core Operations',
    content: 'Stock, Karigars, and Piece Entry — your daily factory operations live here.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-commerce"]',
    title: 'Sales & Purchasing',
    content: 'Create invoices, manage customers, and track purchase orders.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-finance"]',
    title: 'Finance & Reports',
    content: 'Khata (ledger), Cashflow, and detailed Reports — all your numbers in one place.',
    placement: 'right',
  },
  {
    target: '[data-tour="search-bar"]',
    title: 'Quick Search',
    content: 'Press Ctrl+K anytime to jump to any page instantly. Try it after this tour.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="hub-status"]',
    title: 'Hub Status',
    content: 'Shows if your mobile devices are connected and synced.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-menu"]',
    title: 'Your Account',
    content: 'Settings, plan details, and logout — accessible here anytime.',
    placement: 'bottom-end',
  },
  {
    target: '[data-tour="quick-add"]',
    title: 'Quick Actions',
    content: 'The + button gives you fast access to common actions like adding stock or logging production.',
    placement: 'left',
  },
]

export function ProductTour() {
  const router = useRouter()
  const [run, setRun] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem(
      'noxis-tour-completed'
    )
    if (!seen) {
      // Small delay so the dashboard fully
      // renders before the tour starts
      const timer = setTimeout(() => setRun(true), 800)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleCallback = (data: EventData) => {
    const { status } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED]
      .includes(status as any)) {
      setRun(false)
      localStorage.setItem(
        'noxis-tour-completed', 'true'
      )
    }
  }

  return (
    <Joyride
      steps={TOUR_STEPS}
      run={run}
      continuous
      onEvent={handleCallback}
      options={{
        arrowColor: '#0F1114',
        backgroundColor: '#0F1114',
        overlayColor: 'rgba(0, 0, 0, 0.7)',
        primaryColor: '#60A5FA',
        textColor: '#E5E7EB',
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
      styles={{
        tooltip: {
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.1)',
        },
        buttonPrimary: {
          backgroundColor: '#60A5FA',
          color: '#000000',
          fontSize: 12,
          fontWeight: 700,
          padding: '8px 16px',
          borderRadius: 2,
        },
        buttonBack: {
          color: '#6B7280',
          fontSize: 12,
        },
        buttonSkip: {
          color: '#4B5563',
          fontSize: 11,
        },
      }}
    />
  )
}
