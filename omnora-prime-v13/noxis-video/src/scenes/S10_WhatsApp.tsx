import {
  AbsoluteFill,
  useCurrentFrame,
} from 'remotion'

const FULL_MESSAGE = `*NOXIS INVOICE NOTIFICATION*
━━━━━━━━━━━━━━━━━━━━
Dear *Hassan Textile Mills*,

Your tax invoice *#INV-000089* has been generated.

• *Bill Amount:* PKR 17,500
• *Paid Today:* PKR 5,000 (Cash)
• *Balance Due:* *PKR 12,500*
• *Status:* PARTIAL

📄 Official PDF Attached
Meezan Bank: PK42MEZN000100984512

_Generated automatically via Noxis Hub ERP_`

export const S10_WhatsApp: React.FC<{ from: number }> = ({ from }) => {
  const frame = useCurrentFrame()
  const f = Math.max(0, frame - from)

  // Typing effect: 3 characters per frame starting at frame 20
  const charCount = Math.max(0, Math.min(FULL_MESSAGE.length, Math.floor((f - 20) * 3)))
  const displayedMessage = FULL_MESSAGE.slice(0, charCount)

  // Double tick appears after typing completes (around frame 105)
  const showTick = f >= 105

  return (
    <AbsoluteFill className="flex flex-col justify-between" style={{ background: '#060708' }}>
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Noxis Invoice Summary (50%) */}
        <div
          className="w-1/2 p-10 border-r flex flex-col justify-between"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl font-black text-white">Noxis WhatsApp Bridge</span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Direct Cloud API
              </span>
            </div>

            {/* Invoice card */}
            <div className="bg-[#0F1114] border border-white/7 rounded-sm p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-start border-b border-white/6 pb-3">
                <div>
                  <p className="text-base font-bold text-white">Hassan Textile Mills</p>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">Khata ID #HT-402 · Faisalabad</p>
                </div>
                <span className="text-xs font-mono font-black px-2 py-1 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  PARTIAL
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 font-mono">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Invoice Ref</span>
                  <p className="text-sm font-bold text-gray-200">#INV-000089</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Total Billed</span>
                  <p className="text-sm font-bold text-gray-200">PKR 17,500</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Cash Paid</span>
                  <p className="text-sm font-bold text-emerald-400">PKR 5,000</p>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase">Balance Due</span>
                  <p className="text-lg font-black text-amber-400">PKR 12,500</p>
                </div>
              </div>

              <div className="pt-2">
                <button className="w-full py-3 bg-[#25D366] text-black font-black text-xs rounded-sm flex items-center justify-center gap-2 shadow-lg">
                  <span>✓ 1-Click WhatsApp Dispatch [Sent]</span>
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 font-mono">
            Zero per-message fees · Works with native phone WhatsApp Web or API
          </p>
        </div>

        {/* RIGHT: High-Fidelity Dark WhatsApp Chat UI (50%) */}
        <div className="w-1/2 p-10 bg-[#0B141A] flex flex-col justify-between">
          {/* WhatsApp Header */}
          <div className="bg-[#202C33] p-3 rounded-t-lg flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#128C7E] flex items-center justify-center text-white font-bold text-xs">
                HT
              </div>
              <div>
                <p className="text-sm font-bold text-[#E9EDEF]">Hassan Textile Mills</p>
                <p className="text-[10px] text-[#8696A0] font-mono">+92 300 8654321 · Online</p>
              </div>
            </div>
            <span className="text-gray-400 text-sm">🔒 End-to-end encrypted</span>
          </div>

          {/* Chat Canvas with Typing Bubble */}
          <div className="flex-1 bg-[#0B141A] p-4 flex flex-col justify-end overflow-hidden">
            <div
              className="max-w-[420px] bg-[#005C4B] text-[#E9EDEF] rounded-lg p-3.5 shadow-md self-end space-y-1 text-xs font-sans leading-relaxed"
              style={{
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
              }}
            >
              <pre className="whitespace-pre-wrap font-sans text-xs">
                {displayedMessage}
              </pre>

              <div className="flex items-center justify-end gap-1.5 pt-1 text-[10px] text-[#8696A0] font-mono">
                <span>04:15 PM</span>
                {showTick && (
                  <span className="text-[#53BDEB] font-bold">✓✓ Delivered</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Slogan Bar */}
      <div
        className="h-14 bg-[#0A0C0F] border-t px-8 flex items-center justify-center text-center"
        style={{ borderColor: 'rgba(255,255,255,0.06)' }}
      >
        <p className="text-base font-bold text-white tracking-wide">
          One tap. <span className="text-[#25D366]">Customer gets everything on WhatsApp instantly.</span>
        </p>
      </div>
    </AbsoluteFill>
  )
}
