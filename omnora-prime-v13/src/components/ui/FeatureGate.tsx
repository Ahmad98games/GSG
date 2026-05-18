'use client'

import React from 'react'
import { Lock } from 'lucide-react'
import { useTierStore, Tier, TierLimits } from '@/stores/tierStore'

import { useToast } from '@/hooks/useToast'

interface FeatureGateProps {
  feature: keyof TierLimits
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function FeatureGate({
  feature, children, fallback
}: FeatureGateProps) {
  const { hasFeature, tier } = useTierStore()
  
  if (hasFeature(feature)) {
    return <>{children}</>
  }
  
  if (fallback) return <>{fallback}</>
  
  return (
    <UpgradePrompt
      feature={feature}
      currentTier={tier}
    />
  )
}

export function UpgradePrompt({
  feature, currentTier
}: {
  feature: string
  currentTier: Tier
}) {
  const requiredTier = getRequiredTier(feature)
  const { info } = useToast()
  
  const handleUpgradeClick = () => {
    window.open('https://noxishub.app/pricing', '_blank')
    info(
      'Visit noxishub.app/pricing to upgrade.',
      'After payment, enter your new license key in Settings → License.'
    )
  }
  
  return (
    <div className="relative rounded-sm overflow-hidden border border-white/5 bg-black/20">
      {/* Blurred background hint */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/60 z-10 flex flex-col items-center justify-center p-6 text-center">
        
        <div className="w-12 h-12 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/20 flex items-center justify-center mb-4">
          <Lock size={20} className="text-[#C5A059]" />
        </div>
        
        <p className="text-white font-medium text-sm">
          {getFeatureName(feature)}
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Available on{' '}
          <span className="text-[#C5A059] font-medium capitalize">
            {requiredTier}
          </span>
          {' '}and above
        </p>
        
        <button
          onClick={handleUpgradeClick}
          className="mt-4 px-4 py-2 text-xs bg-[#C5A059] text-black font-semibold hover:bg-[#D4B069] transition-colors rounded-md cursor-pointer"
        >
          {requiredTier.toLowerCase() === 'elite' ? 'View Elite Plans' : 'View Pro Plans'}
        </button>
      </div>
      
      {/* Semi-visible content preview */}
      <div className="opacity-20 pointer-events-none filter blur-[2px]">
        <div className="p-8 space-y-4">
            <div className="h-4 w-3/4 bg-white/10 rounded" />
            <div className="h-4 w-1/2 bg-white/10 rounded" />
            <div className="h-4 w-5/6 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  )
}

function getRequiredTier(feature: string): string {
  const proFeatures = [
    'aiCctvDetection', 'whatsappAutoAlerts',
    'customerPortal', 'recurringInvoices',
    'staffUsers', 'batchTracking', 'exportDocs',
    'advancedAnalytics'
  ]
  const eliteFeatures = [
    'fireDetection', 'whatsappApi',
    'customThemes', 'apiAccess'
  ]
  
  if (eliteFeatures.includes(feature))
    return 'Elite'
  if (proFeatures.includes(feature))
    return 'Pro'
  return 'Pro'
}

function getFeatureName(feature: string): string {
  const names: Record<string, string> = {
    aiCctvDetection: 'AI Camera Detection',
    whatsappAutoAlerts: 'WhatsApp Auto Alerts',
    customerPortal: 'Customer Portal',
    recurringInvoices: 'Recurring Invoices',
    staffUsers: 'Multi-User Access',
    batchTracking: 'Batch & Lot Tracking',
    exportDocs: 'B2B Export Documents',
    advancedAnalytics: 'Advanced Analytics',
    fireDetection: 'Fire Detection',
    whatsappApi: 'WhatsApp Business API',
    customThemes: 'Custom Themes',
    apiAccess: 'API Access',
  }
  return names[feature] || feature
}
