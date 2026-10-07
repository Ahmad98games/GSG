import {
  AbsoluteFill,
  useCurrentFrame,
  spring,
  useVideoConfig,
} from 'remotion'
import { NoxisWindowFrame } from '../components/NoxisWindowFrame'
import { NoxisSidebar } from '../components/NoxisSidebar'
import { Windows11Cursor, CursorWaypoint } from '../components/Windows11Cursor'
import { PitchHUD } from '../components/PitchHUD'

// Calibrated 1920x1080 screen coordinates
const TAX_WAYPOINTS: CursorWaypoint[] = [
  { frame: 0, x: 500, y: 220, type: 'arrow' },
  { frame: 45, x: 885, y: 350, type: 'pointer', click: true, label: 'Verified Signatures ✓' },
  { frame: 130, x: 775, y: 965, type: 'pointer', click: true, label: 'Download Certified Audit Report (PDF)' },
  { frame: 200, x: 775, y: 965, type: 'arrow' },
]


export const S07_TaxCompliance: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const f = frame - from

  // QR Code generator spring
  const qrSpring = spring({
    frame: f - 35,
    fps,
    config: { damping: 14, stiffness: 220, mass: 0.7 },
  })

  // Stamp drop
  const stampSpring = spring({
    frame: f - 80,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.8 },
  })

  const isAuditButtonClicked = f >= 128 && f <= 140

  return (
    <AbsoluteFill className="bg-[#060708]">
      <NoxisWindowFrame pageTitle="TAX & REGULATORY COMPLIANCE" activeThemeAccent="#06B6D4">
        <NoxisSidebar activeId="compliance" accentColor="#06B6D4" />

        <div className="flex-1 flex flex-col overflow-y-auto p-7 space-y-5 font-sans pb-20 relative">
          {/* Compliance Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-xl">🛡️</span>
                <h2 className="text-lg font-bold text-white font-mono tracking-wide">
                  TAX & STATUTORY COMPLIANCE SUBSYSTEM
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  FBR / PRA / SRB / UAE FTA VERIFIED
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Automated electronic invoice integration with cryptographic signature generation and instant NTN active-taxpayer verification.
              </p>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 font-bold">FBR Gateway Online</span>
            </div>
          </div>

          {/* Split Layout */}
          <div className="grid grid-cols-2 gap-6 flex-1">
            {/* Left: Tax Calculation & NTN Verification */}
            <div className="bg-[#0A0E15] border border-white/[0.08] rounded-lg p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                  ACTIVE TAXPAYER VERIFICATION
                </span>

                {/* Taxpayer Card */}
                <div className="p-3.5 rounded bg-[#0F141F] border border-cyan-500/30 flex items-center justify-between font-mono">
                  <div>
                    <p className="text-xs font-bold text-white">AL-HAMEED TEXTILE MILLS LTD</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">NTN: 8492019-3 · STRN: 3277876123456</p>
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    ACTIVE (100% FILER)
                  </span>
                </div>

                {/* Statutory Breakdown Table */}
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-gray-400">Gross Goods Value</span>
                    <span className="text-white font-bold">PKR 100,000.00</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-gray-400">General Sales Tax (GST 18%)</span>
                    <span className="text-cyan-400 font-bold">+ PKR 18,000.00</span>
                  </div>
                  <div className="flex justify-between p-2 rounded bg-white/[0.02]">
                    <span className="text-gray-400">Withholding Tax (WHT Section 153)</span>
                    <span className="text-amber-400 font-bold">- PKR 1,000.00</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded bg-white/[0.05] border border-white/[0.08] text-sm">
                    <span className="text-white font-bold">Total Statutory Invoice</span>
                    <span className="text-emerald-400 font-black">PKR 117,000.00</span>
                  </div>
                </div>
              </div>

              <div className="text-[10px] font-mono text-gray-500">
                Direct integration with Pakistan FBR Digital Invoicing & Electronic Fiscal Devices (EFD).
              </div>
            </div>

            {/* Right: Live Certified Invoice & Cryptographic QR */}
            <div className="bg-[#0D1118] border border-white/[0.08] rounded-lg p-5 flex flex-col justify-between relative overflow-hidden font-mono">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase">FBR INVOICE NUMBER</span>
                    <p className="text-sm font-bold text-white">POS-2026-FBR-9840281-PK</p>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-cyan-400/10 text-cyan-400 border border-cyan-400/30">
                    E-SEALED
                  </span>
                </div>

                {/* QR Code and Cryptographic Hash */}
                <div className="flex items-center gap-5 p-4 rounded bg-[#07090E] border border-white/[0.06]">
                  <div
                    className="w-24 h-24 bg-white p-2 rounded flex flex-col justify-between shrink-0"
                    style={{ transform: `scale(${qrSpring})` }}
                  >
                    <div className="w-full h-full bg-black flex items-center justify-center text-white text-[8px] font-black text-center p-1 leading-tight">
                      [FBR QR ENCODED]
                    </div>
                  </div>

                  <div className="space-y-1.5 text-[10px]">
                    <p className="text-gray-300 font-bold">DIGITAL FISCAL SEAL</p>
                    <p className="text-gray-500 font-mono break-all text-[8px]">
                      SHA256: 8f9b4c0e3a129df87b41e289c44a0e98f712ac98b1a3d4f5
                    </p>
                    <p className="text-emerald-400 font-semibold text-[9px]">
                      ✓ Validated with FBR Production Server
                    </p>
                  </div>
                </div>
              </div>

              {/* Verified Stamp Overlay */}
              {f >= 80 && (
                <div
                  className="absolute bottom-16 right-6 border-2 border-emerald-400 px-4 py-1.5 rounded text-emerald-400 font-black text-sm tracking-widest uppercase rotate-[-8deg] bg-emerald-500/10 backdrop-blur-sm z-20"
                  style={{ transform: `scale(${stampSpring}) rotate(-8deg)` }}
                >
                  ✓ FBR COMPLIANT
                </div>
              )}
            </div>
          </div>

          {/* Verified Signatures Badge centered at x: 885, y: 350 */}
          <div
            className="absolute z-20 pointer-events-none"
            style={{
              left: 885,
              top: 350,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 font-mono text-[10px] font-bold shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Verified Signatures · Cryptographic HSM Validated</span>
            </div>
          </div>

          {/* Download Certified Audit Report (PDF) centered at x: 775, y: 965 */}
          <div
            className="absolute z-30"
            style={{
              left: 775,
              top: 965,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <button
              className="px-6 py-2.5 rounded border text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xl"
              style={{
                background: isAuditButtonClicked ? '#10B981' : 'rgba(255,255,255,0.08)',
                color: isAuditButtonClicked ? '#000000' : '#FFFFFF',
                borderColor: isAuditButtonClicked ? '#10B981' : 'rgba(255,255,255,0.2)',
                transform: isAuditButtonClicked ? 'scale(0.96)' : 'scale(1)',
              }}
            >
              <span>📄</span>
              <span>Download Certified Audit Report (PDF)</span>
            </button>
          </div>
        </div>
      </NoxisWindowFrame>

      {/* Windows 11 Native Cursor (Screen Level) */}
      <Windows11Cursor waypoints={TAX_WAYPOINTS} />

      {/* Customer Pitch HUD */}
      <PitchHUD
        badge="07 · STATUTORY COMPLIANCE"
        title="ZERO-HEADACHE FBR DIGITAL INVOICING & TAX AUDIT CERTIFICATION"
        explanation="Protect your business against fines and regulatory notices with 100% automated FBR Tier-1 e-invoicing, digital fiscal QR codes, and tamper-proof tax audit seals."
        roiPoints={['Automatic 18% GST Calculations', 'Zero Tax Penalty Risk', 'One-Click Audit PDF']}
        accentColor="#06B6D4"
      />
    </AbsoluteFill>
  )
}
