'use client'
import React, { useState, useEffect } from 'react'
import { Joyride, Step, EventData, STATUS } from 'react-joyride'
import { useRouter } from 'next/navigation'

const TOUR_STEPS: Step[] = [
  {
    target: 'body',
    placement: 'center',
    title: 'Welcome to Noxis Hub',
    content: 'This is a quick 60-second tour of your industrial workstation. You can explore or skip anytime.',
  },
  {
    target: '[data-tour="sidebar-operations"]',
    title: 'Core Factory Operations',
    content: 'POS Counter, Karigars, Inventory, Stitching, Batch Tracking & Fabric — manage daily production here.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-finance"]',
    title: 'Finance & Accounts Ledger',
    content: 'Khata Dual-Entry, Invoices, Fabric Purchases, Karigar Wages, and Cash Flow — your financial backbone.',
    placement: 'right',
  },
  {
    target: '[data-tour="sidebar-system"]',
    title: 'System & Intelligence',
    content: 'CCTV Feeds, Mandi Commodity Rates, Foresight AI, and System Settings.',
    placement: 'right',
  },
  {
    target: '[data-tour="search-bar"]',
    title: 'Instant Command & Search',
    content: 'Press Ctrl+K anytime to jump to any invoice, karigar, ledger, or settings page in milliseconds.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="hub-status"]',
    title: 'Local Workstation & Hub Status',
    content: 'Monitors your local offline SQLite database and paired Android floor devices in real time.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="user-menu"]',
    title: 'Your Business Profile & License',
    content: 'View business details, active license tier, branch selection, and system preferences.',
    placement: 'bottom-end',
  },
  {
    target: '[data-tour="quick-add"]',
    title: 'Quick Actions (+)',
    content: '1-Click quick actions to add new stock, create an invoice, or log worker attendance.',
    placement: 'left',
  },
]

export function ProductTour() {
  const router = useRouter()
  const [run, setRun] = useState(false)
  const [tourKey, setTourKey] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const seen = localStorage.getItem('noxis-tour-completed')
    if (!seen) {
      // Delay so dashboard and sidebar DOM elements are fully mounted
      const timer = setTimeout(() => {
        setTourKey(prev => prev + 1)
        setRun(true)
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  // Allow re-launching tour from anywhere via custom event: window.dispatchEvent(new CustomEvent('start-noxis-tour'))
  useEffect(() => {
    const handleStart = () => {
      localStorage.removeItem('noxis-tour-completed')
      setRun(false)
      setTimeout(() => {
        setTourKey(prev => prev + 1)
        setRun(true)
      }, 100)
    }
    window.addEventListener('start-noxis-tour', handleStart)
    return () => window.removeEventListener('start-noxis-tour', handleStart)
  }, [])

  const handleCallback = (data: EventData) => {
    const { status } = data
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      setRun(false)
      localStorage.setItem('noxis-tour-completed', 'true')
    }
  }

  if (!mounted) return null

  return (
    <Joyride
      key={tourKey}
      steps={TOUR_STEPS}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleCallback}
      options={{
        arrowColor: '#0F172A',
        backgroundColor: '#0F172A',
        overlayColor: 'rgba(0, 0, 0, 0.65)',
        primaryColor: '#2563EB',
        textColor: '#F8FAFC',
        zIndex: 10000,
        showProgress: true,
        buttons: ['back', 'close', 'primary', 'skip'],
      }}
      styles={{
        tooltip: {
          borderRadius: 8,
          border: '1px solid rgba(255, 255, 255, 0.12)',
          backgroundColor: '#0F172A',
          padding: 16,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        },
        tooltipTitle: {
          color: '#FFFFFF',
          fontSize: 14,
          fontWeight: 700,
          fontFamily: 'inherit',
          letterSpacing: '-0.01em',
        },
        tooltipContent: {
          color: '#94A3B8',
          fontSize: 12,
          lineHeight: '1.5',
          padding: '8px 0',
        },
        buttonPrimary: {
          backgroundColor: '#2563EB',
          color: '#FFFFFF',
          fontSize: 12,
          fontWeight: 600,
          fontFamily: 'inherit',
          padding: '7px 14px',
          borderRadius: 6,
          cursor: 'pointer',
        },
        buttonBack: {
          color: '#94A3B8',
          fontSize: 12,
          fontFamily: 'inherit',
          fontWeight: 500,
          marginRight: 8,
          cursor: 'pointer',
        },
        buttonSkip: {
          color: '#64748B',
          fontSize: 12,
          fontFamily: 'inherit',
          cursor: 'pointer',
        },
      }}
    />
  )
}
export default ProductTour
