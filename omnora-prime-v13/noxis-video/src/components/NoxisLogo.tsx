import { Img, staticFile } from 'remotion'

export function NoxisLogo({
  size = 28,
  showWordmark = true,
  wordmarkSize = 14,
  subtext,
  glow = false,
}: {
  size?: number
  showWordmark?: boolean
  wordmarkSize?: number
  subtext?: string
  glow?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="relative flex items-center justify-center shrink-0"
        style={{
          width: size,
          height: size,
        }}
      >
        {glow && (
          <div
            className="absolute inset-0 rounded-full blur-md opacity-75"
            style={{
              background: 'radial-gradient(circle, rgba(6,182,212,0.6) 0%, rgba(197,160,89,0.3) 100%)',
            }}
          />
        )}
        <Img
          src={staticFile('logos/noxis.png')}
          alt="Noxis Hub"
          className="w-full h-full object-contain relative z-10"
        />
      </div>

      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span
              className="font-black tracking-[0.22em] text-white font-mono uppercase"
              style={{ fontSize: wordmarkSize }}
            >
              NOXIS
            </span>
            <span
              className="font-bold tracking-[0.16em] text-cyan-400 font-mono text-[10px] uppercase"
            >
              HUB
            </span>
          </div>
          {subtext && (
            <span className="text-[9px] text-gray-500 font-mono tracking-wider uppercase -mt-0.5">
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
