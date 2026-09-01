'use client'

import React, { useState, useCallback } from 'react'
import {
  Scissors,
  Printer,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  UserCheck,
  Tag,
} from 'lucide-react'
import QRCode from 'react-qr-code'
import { encodeJobPayload } from '@/lib/barcode/barcodeEngine'
import {
  UniversalLabelGenerator,
  LabelData,
} from '@/components/common/UniversalLabelGenerator'
import { useToastStore } from '@/hooks/useToast'
import { KarigarGradeBadge } from '@/components/karigars/KarigarGradeBadge'

const toast = Object.assign(
  (msg: string) => {
    useToastStore.getState().addToast({ type: 'warning', title: msg })
  },
  {
    success: (msg: string) =>
      useToastStore.getState().addToast({ type: 'success', title: msg }),
    error: (msg: string) =>
      useToastStore.getState().addToast({ type: 'error', title: msg }),
  }
)

export type JobStage =
  | 'CUTTING'
  | 'EMBROIDERY'
  | 'STITCHING'
  | 'QUALITY_INSPECTION'
  | 'FINISHED_STOCK'

export interface KarigarJobCardProps {
  jobId: string
  jobCode?: string
  karigarId: string
  karigarName: string
  karigarGrade?: string | null
  itemName: string
  skuCode: string
  quantity: number
  unit?: string
  initialStage?: JobStage
  onStageChange?: (newStage: JobStage) => void
}

const STAGES: { stage: JobStage; label: string; color: string }[] = [
  { stage: 'CUTTING', label: 'Cutting Stage', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { stage: 'EMBROIDERY', label: 'Embroidery Lot', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { stage: 'STITCHING', label: 'Stitching / Karigar', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { stage: 'QUALITY_INSPECTION', label: 'QC Inspection', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { stage: 'FINISHED_STOCK', label: 'Finished Stock', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
]

export const KarigarJobCard: React.FC<KarigarJobCardProps> = ({
  jobId,
  jobCode = 'JOB-2026-001',
  karigarId,
  karigarName,
  karigarGrade,
  itemName,
  skuCode,
  quantity,
  unit = 'pcs',
  initialStage = 'CUTTING',
  onStageChange,
}) => {
  const [currentStage, setCurrentStage] = useState<JobStage>(initialStage)
  const [showLabelModal, setShowLabelModal] = useState<boolean>(false)

  const encodedPayload = encodeJobPayload(jobId, karigarId, currentStage, skuCode)

  const labelData: LabelData = {
    title: `JOB TAG — ${jobCode}`,
    name: itemName,
    skuCode: skuCode,
    jobId: jobId,
    karigarId: karigarId,
    stage: currentStage,
    payloadType: 'JOB',
  }

  const handleNextStage = useCallback(() => {
    const currentIndex = STAGES.findIndex((s) => s.stage === currentStage)
    if (currentIndex < STAGES.length - 1) {
      const nextStage = STAGES[currentIndex + 1].stage
      setCurrentStage(nextStage)
      onStageChange?.(nextStage)
      toast.success(`Job updated to stage: ${nextStage}`)
    }
  }, [currentStage, onStageChange])

  return (
    <div className="bg-[#0C0F14] border border-white/10 rounded-xl p-5 shadow-xl space-y-4 relative overflow-hidden">
      {/* GLOW DECORATION */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* CARD HEADER */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Scissors size={16} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">{jobCode}</h3>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-gray-300">
                {quantity} {unit}
              </span>
            </div>
            <p className="text-[11px] text-gray-400">Karigar Work Order Tag</p>
          </div>
        </div>

        <button
          onClick={() => setShowLabelModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-bold transition-all"
        >
          <Printer size={13} />
          Print Job Tag
        </button>
      </div>

      {/* JOB CARD CONTENT */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* DETAILS */}
        <div className="md:col-span-8 space-y-2">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">
              Item / Article
            </span>
            <div className="text-sm font-bold text-white">{itemName}</div>
            <div className="text-xs font-mono text-gray-400">SKU: {skuCode}</div>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="flex items-center gap-2 text-xs text-gray-300">
              <UserCheck size={14} className="text-blue-400" />
              <span>Assigned Karigar: <strong>{karigarName}</strong></span>
              {karigarGrade && <KarigarGradeBadge grade={karigarGrade} />}
            </div>
          </div>
        </div>

        {/* TRACKABLE QR CODE DISPLAY */}
        <div className="md:col-span-4 flex flex-col items-center justify-center bg-white p-2.5 rounded-lg text-black shadow-inner">
          <QRCode value={encodedPayload} size={80} viewBox={`0 0 256 256`} />
          <div className="text-[8px] font-mono font-bold text-gray-800 mt-1 text-center truncate max-w-[120px]">
            {currentStage}
          </div>
        </div>
      </div>

      {/* STAGE SWITCHER PROGRESS BAR */}
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className="text-gray-400 flex items-center gap-1">
            <Clock size={12} className="text-blue-400" />
            Current Production Stage
          </span>
          <span className="text-blue-300 font-bold uppercase">{currentStage}</span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {STAGES.map((s, idx) => {
            const isCurrent = s.stage === currentStage
            const isCompleted =
              STAGES.findIndex((st) => st.stage === currentStage) > idx

            return (
              <button
                key={s.stage}
                onClick={() => {
                  setCurrentStage(s.stage)
                  onStageChange?.(s.stage)
                }}
                className={`py-1.5 px-1 rounded text-[9px] font-bold uppercase text-center transition-all truncate border ${
                  isCurrent
                    ? `${s.color} ring-2 ring-blue-500/30`
                    : isCompleted
                    ? 'bg-white/10 text-gray-300 border-white/20'
                    : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/15'
                }`}
              >
                {s.stage.replace('_', ' ')}
              </button>
            )
          })}
        </div>

        {currentStage !== 'FINISHED_STOCK' && (
          <div className="pt-2 flex justify-end">
            <button
              onClick={handleNextStage}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded-lg text-xs font-bold transition-all"
            >
              Advance to Next Stage
              <ArrowRight size={13} />
            </button>
          </div>
        )}
      </div>

      {/* THERMAL STICKER PRINT MODAL */}
      {showLabelModal && (
        <UniversalLabelGenerator
          isOpen={showLabelModal}
          onClose={() => setShowLabelModal(false)}
          data={labelData}
          defaultDimension="100x50"
          defaultQuantity={1}
        />
      )}
    </div>
  )
}
