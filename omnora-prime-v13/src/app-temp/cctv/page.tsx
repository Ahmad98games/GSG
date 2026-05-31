'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTierStore } from '@/stores/tierStore'
import { useBusinessProfile } from '@/hooks/useBusinessProfile'
import { ScrollReveal3D } from '@/components/ui/AnimatedComponents'

type BetaView =
  'intro' | 'tour' | 'demo' | 'feedback' | 'thanks'

export default function CctvBetaPage() {
  const { tier } = useTierStore()
  const { profile } = useBusinessProfile()
  const [view, setView] = useState<BetaView>('intro')
  const [tourStep, setTourStep] = useState(0)
  const [demoCamera, setDemoCamera] = useState(0)
  const [feedback, setFeedback] = useState({
    rating: 0,
    use_case: '',
    camera_brand: '',
    camera_count: '',
    features_wanted: [] as string[],
    comments: '',
    email: '',
    business_name: profile?.business_name || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  // Tour steps
  const TOUR_STEPS = [
    {
      title: 'Connect your IP cameras',
      description: 'Noxis CCTV supports any IP camera that uses RTSP protocol. This includes popular brands like Hikvision, Dahua, Axis, and most Chinese IP cameras available in Pakistan and internationally.',
      icon: '📷',
      detail: 'You will enter your camera\'s IP address, port, username, and password. Noxis auto-builds the RTSP URL so you do not need to know the technical details.',
      visual: 'camera-setup',
    },
    {
      title: 'Live video on your PC',
      description: 'Once connected, see all your cameras in a grid layout on your Hub PC. Watch your factory floor, godown, and entry points in real time.',
      icon: '🖥️',
      detail: 'The video runs locally through a Python sidecar process. No cloud. No monthly video fees. Your footage stays on your machine.',
      visual: 'camera-grid',
    },
    {
      title: 'AI detection alerts',
      description: 'Noxis can detect people and vehicles entering restricted zones. When detected, you get an immediate alert on the Hub and on your mobile app.',
      icon: '🤖',
      detail: 'Powered by MobileNet SSD running locally on your PC. Works without internet. Available on Pro and Elite plans.',
      visual: 'ai-detection',
    },
    {
      title: 'Forensic-grade recordings',
      description: 'Every recording is cryptographically signed with HMAC-SHA256. If footage is tampered with, the system will detect it.',
      icon: '🔒',
      detail: 'This means your CCTV footage can be used as evidence. The signature verifies that the recording has not been edited or manipulated.',
      visual: 'recording',
    },
    {
      title: 'Mobile alerts',
      description: 'When your Hub detects motion or a zone breach, your Android phone gets notified immediately — even if you are away from the factory.',
      icon: '📱',
      detail: 'Alerts come through the Noxis mobile app via the NSP bridge. If you are on the same WiFi: instant. If remote: via Supabase cloud.',
      visual: 'mobile-alert',
    },
  ]

  // Demo cameras (fake MJPEG streams from public sources)
  const DEMO_CAMERAS = [
    {
      name: 'Factory Floor — Demo',
      location: 'Main Hall',
      status: 'online',
      // Use a public test stream or static image
      previewColor: '#1a2e1a',
      activity: 'Motion detected 2 min ago',
    },
    {
      name: 'Godown Entry — Demo',
      location: 'North Gate',
      status: 'online',
      previewColor: '#1a1a2e',
      activity: 'All clear',
    },
    {
      name: 'Production Line — Demo',
      location: 'Floor B',
      status: 'online',
      previewColor: '#2e1a1a',
      activity: 'Active — 12 workers',
    },
    {
      name: 'Office Entrance — Demo',
      location: 'Main Office',
      status: 'offline',
      previewColor: '#1a1a1a',
      activity: 'Connection lost',
    },
  ]

  const FEATURES_LIST = [
    'Person detection alerts',
    'Vehicle detection',
    'Fire detection',
    'Night vision support',
    'Mobile push notifications',
    'Recording playback',
    'Multiple camera grid',
    'Zone-based alerts',
    'PTZ camera control',
    'Audio recording',
  ]

  const handleFeedbackSubmit = async () => {
    if (!feedback.rating) {
      setSubmitError('Please select a rating')
      return
    }
    if (!feedback.comments.trim()) {
      setSubmitError('Please share your thoughts')
      return
    }

    setSubmitting(true)
    setSubmitError('')

    try {
      const res = await fetch(
        'https://formspree.io/f/xvgzkpee',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            ...feedback,
            features_wanted:
              feedback.features_wanted.join(', '),
            tier,
            submitted_at: new Date().toISOString(),
            source: 'Noxis Hub CCTV Beta',
          }),
        }
      )

      if (res.ok) {
        setView('thanks')
      } else {
        setSubmitError(
          'Could not submit. Check your internet and try again.'
        )
      }
    } catch {
      setSubmitError(
        'Connection failed. Try again.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#070809]">

      {/* ═══ INTRO VIEW ═══ */}
      {view === 'intro' && (
        <ScrollReveal3D className="max-w-2xl mx-auto px-6 py-16 text-center">

          {/* Beta badge */}
          <div className="inline-flex items-center
            gap-2 bg-amber-500/10 border
            border-amber-500/25 rounded-full
            px-4 py-1.5 mb-8">
            <div className="w-1.5 h-1.5
              rounded-full bg-amber-400
              animate-pulse" />
            <span className="text-xs font-semibold
              text-amber-400 tracking-widest
              uppercase">
              Beta Feature
            </span>
          </div>

          <h1 className="text-4xl font-bold
            tracking-tight text-white mb-4">
            Noxis CCTV
          </h1>
          <p className="text-gray-400 text-lg
            mb-2 leading-relaxed">
            Industrial security monitoring
            built into your ERP.
          </p>
          <p className="text-gray-600 text-sm
            mb-12">
            This feature is in active development.
            Take the tour, try the demo,
            and tell us what your factory needs.
          </p>

          {/* Three paths */}
          <div className="grid grid-cols-3 gap-4
            mb-10">
            {[
              {
                icon: '🗺️',
                title: 'Take the tour',
                desc: '5-step walkthrough of how CCTV works in Noxis',
                action: () => setView('tour'),
                primary: true,
              },
              {
                icon: '▶️',
                title: 'Try the demo',
                desc: 'See what the camera grid looks like with demo feeds',
                action: () => setView('demo'),
                primary: false,
              },
              {
                icon: '💬',
                title: 'Give feedback',
                desc: 'Tell us what you need and help shape this feature',
                action: () => setView('feedback'),
                primary: false,
              },
            ].map(path => (
              <button
                key={path.title}
                onClick={path.action}
                className={`p-5 text-left
                  border rounded-sm
                  transition-all duration-150
                  ${path.primary
                    ? 'bg-[#60A5FA]/5 border-[#60A5FA]/30 hover:bg-[#60A5FA]/10'
                    : 'bg-[#0F1114] border-white/8 hover:border-white/15'
                  }`}
              >
                <div className="text-2xl mb-3">
                  {path.icon}
                </div>
                <p className="text-sm font-semibold
                  text-white mb-1">
                  {path.title}
                </p>
                <p className="text-xs text-gray-500
                  leading-relaxed">
                  {path.desc}
                </p>
              </button>
            ))}
          </div>

          {/* What is working */}
          <div className="p-5 bg-[#0F1114]
            border border-white/6 rounded-sm
            text-left mb-6">
            <p className="text-xs font-semibold
              text-gray-500 uppercase tracking-widest
              mb-4">
              Current status
            </p>
            <div className="space-y-2">
              {[
                { done: true, text: 'Camera registration and RTSP URL builder' },
                { done: true, text: 'Python sidecar MJPEG proxy (test-stream endpoint)' },
                { done: true, text: 'Camera grid layout with status indicators' },
                { done: true, text: 'HMAC-SHA256 footage signing' },
                { done: true, text: 'AI detection toggle (Pro/Elite)' },
                { done: false, text: 'Automated recording storage and playback' },
                { done: false, text: 'Mobile push notification on detection' },
                { done: false, text: 'PTZ camera control' },
                { done: false, text: 'Fire detection model (Elite)' },
              ].map((item, i) => (
                <div key={i}
                  className="flex items-start gap-3">
                  <span className={`text-xs mt-0.5
                    flex-shrink-0 ${item.done
                      ? 'text-emerald-400'
                      : 'text-gray-600'}`}>
                    {item.done ? '✓' : '○'}
                  </span>
                  <span className={`text-xs
                    ${item.done
                      ? 'text-gray-300'
                      : 'text-gray-600'}`}>
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-gray-600">
            Your feedback directly shapes
            what we build next.
          </p>
        </ScrollReveal3D>
      )}

      {/* ═══ TOUR VIEW ═══ */}
      {view === 'tour' && (
        <ScrollReveal3D className="max-w-2xl mx-auto px-6 py-12">

          {/* Progress */}
          <div className="flex items-center
            gap-2 mb-10">
            <button
              onClick={() => setView('intro')}
              className="text-xs text-gray-600
                hover:text-gray-400 transition-colors
                mr-2"
            >
              ← Back
            </button>
            {TOUR_STEPS.map((_, i) => (
              <div key={i}
                className={`h-1 flex-1 rounded-full
                  transition-all duration-300
                  ${i <= tourStep
                    ? 'bg-[#60A5FA]'
                    : 'bg-white/8'}`}
              />
            ))}
            <span className="text-xs text-gray-600
              ml-2 flex-shrink-0">
              {tourStep + 1}/{TOUR_STEPS.length}
            </span>
          </div>

          {/* Step content */}
          {(() => {
            const step = TOUR_STEPS[tourStep]
            return (
              <div className="animate-in
                fade-in duration-200">

                {/* Visual mockup */}
                <div className="bg-[#0F1114]
                  border border-white/8 rounded-sm
                  mb-8 overflow-hidden">

                  {/* Visual for each step */}
                  {step.visual === 'camera-setup' && (
                    <div className="p-6">
                      <p className="text-[10px]
                        text-gray-600 uppercase
                        tracking-widest mb-4">
                        Camera settings
                      </p>
                      <div className="grid
                        grid-cols-2 gap-3">
                        {[
                          { label: 'Camera name', val: 'Front Gate' },
                          { label: 'Brand', val: 'Hikvision' },
                          { label: 'IP Address', val: '192.168.1.64' },
                          { label: 'Port', val: '554' },
                          { label: 'Username', val: 'admin' },
                          { label: 'Password', val: '••••••••' },
                        ].map(f => (
                          <div key={f.label}>
                            <p className="text-[10px]
                              text-gray-600 mb-1">
                              {f.label}
                            </p>
                            <div className="bg-[#161A1F]
                              border border-white/6
                              px-3 py-2 text-xs
                              text-gray-300 font-mono">
                              {f.val}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 p-3
                        bg-emerald-500/5
                        border border-emerald-500/20
                        rounded-sm">
                        <p className="text-[10px]
                          text-emerald-400 font-mono">
                          RTSP URL (auto-built):
                        </p>
                        <p className="text-[10px]
                          text-gray-400 font-mono mt-1">
                          rtsp://admin:****@192.168.1.64:554/stream1
                        </p>
                      </div>
                    </div>
                  )}

                  {step.visual === 'camera-grid' && (
                    <div className="p-4">
                      <div className="grid
                        grid-cols-2 gap-2">
                        {DEMO_CAMERAS.map(
                          (cam, i) => (
                          <div key={i}
                            className="aspect-video
                            relative overflow-hidden
                            rounded-sm"
                            style={{
                              backgroundColor:
                                cam.previewColor,
                            }}
                          >
                            {/* Fake camera grid lines */}
                            <div className="absolute
                              inset-0 opacity-10"
                              style={{
                                backgroundImage:
                                  'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                backgroundSize:
                                  '20px 20px',
                              }}
                            />
                            <div className="absolute
                              inset-0 flex items-center
                              justify-center text-2xl
                              opacity-20">
                              📷
                            </div>
                            <div className="absolute
                              bottom-0 left-0 right-0
                              p-2 bg-black/60">
                              <div className="flex
                                items-center
                                justify-between">
                                <p className="text-[9px]
                                  text-white
                                  font-medium">
                                  {cam.name}
                                </p>
                                <div className={`w-1.5
                                  h-1.5 rounded-full
                                  ${cam.status === 'online'
                                    ? 'bg-emerald-400'
                                    : 'bg-red-400'}`}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.visual === 'ai-detection' && (
                    <div className="p-6">
                      <div className="aspect-video
                        relative overflow-hidden
                        rounded-sm bg-[#1a2e1a]
                        mb-3">
                        <div className="absolute
                          inset-0 opacity-10"
                          style={{
                            backgroundImage:
                              'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                            backgroundSize:
                              '20px 20px',
                          }}
                        />
                        {/* Detection box */}
                        <div className="absolute
                          top-8 left-16 w-16 h-24
                          border-2 border-red-400">
                          <div className="absolute
                            -top-5 left-0 bg-red-400
                            text-black text-[9px]
                            font-bold px-1.5 py-0.5">
                            PERSON 94%
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center
                        gap-3 p-3 bg-red-500/5
                        border border-red-500/20
                        rounded-sm">
                        <div className="w-2 h-2
                          rounded-full bg-red-400
                          animate-pulse flex-shrink-0"
                        />
                        <p className="text-xs
                          text-red-300">
                          Person detected in
                          restricted zone —
                          Front Gate · Just now
                        </p>
                      </div>
                    </div>
                  )}

                  {step.visual === 'recording' && (
                    <div className="p-6">
                      <div className="space-y-2">
                        {[
                          { file: 'cam1_20250519_140532.mp4', sig: 'SHA: a3f2b1...', verified: true },
                          { file: 'cam1_20250519_140232.mp4', sig: 'SHA: 7c4d9e...', verified: true },
                          { file: 'cam2_20250519_135900.mp4', sig: 'SHA: 2b8f1a...', verified: false },
                        ].map((r, i) => (
                          <div key={i}
                            className="flex items-center
                            justify-between p-3
                            bg-[#161A1F]
                            border border-white/6
                            rounded-sm">
                            <div>
                              <p className="text-xs
                                font-mono text-gray-300">
                                {r.file}
                              </p>
                              <p className="text-[10px]
                                font-mono text-gray-600
                                mt-0.5">
                                {r.sig}
                              </p>
                            </div>
                            <span className={`text-[10px]
                              font-bold px-2 py-0.5
                              rounded-sm
                              ${r.verified
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-red-400 bg-red-500/10'}`}>
                              {r.verified
                                ? '✓ INTACT'
                                : '✗ TAMPERED'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {step.visual === 'mobile-alert' && (
                    <div className="p-6 flex
                      justify-center">
                      <div className="w-48
                        bg-[#161A1F]
                        border border-white/10
                        rounded-xl overflow-hidden">
                        <div className="bg-black
                          px-3 py-2 flex items-center
                          justify-between">
                          <span className="text-[10px]
                            text-white font-medium">
                            Noxis
                          </span>
                          <span className="text-[10px]
                            text-gray-500">
                            now
                          </span>
                        </div>
                        <div className="p-3">
                          <p className="text-xs
                            font-semibold text-white
                            mb-1">
                            🚨 Zone Breach Detected
                          </p>
                          <p className="text-[10px]
                            text-gray-400 leading-relaxed">
                            Person detected in
                            restricted area at
                            Front Gate.
                            Tap to view footage.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Step text */}
                <div className="mb-2">
                  <span className="text-3xl">
                    {step.icon}
                  </span>
                </div>
                <h2 className="text-xl font-bold
                  text-white mb-3">
                  {step.title}
                </h2>
                <p className="text-gray-400 text-sm
                  leading-relaxed mb-3">
                  {step.description}
                </p>
                <p className="text-gray-600 text-xs
                  leading-relaxed">
                  {step.detail}
                </p>
              </div>
            )
          })()}

          {/* Navigation */}
          <div className="flex items-center
            justify-between mt-10">
            <button
              onClick={() => setTourStep(
                Math.max(0, tourStep - 1)
              )}
              disabled={tourStep === 0}
              className="px-4 py-2 text-sm
                border border-white/10 text-gray-400
                hover:border-white/20
                disabled:opacity-30
                disabled:cursor-not-allowed
                transition-colors"
            >
              ← Previous
            </button>

            <button
              onClick={() => setView('feedback')}
              className="text-xs text-gray-600
                hover:text-gray-400 transition-colors"
            >
              Skip to feedback
            </button>

            {tourStep < TOUR_STEPS.length - 1 ? (
              <button
                onClick={() => setTourStep(
                  tourStep + 1
                )}
                className="px-4 py-2 text-sm
                  bg-[#60A5FA] text-black font-bold
                  hover:bg-blue-400
                  transition-colors"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => setView('feedback')}
                className="px-4 py-2 text-sm
                  bg-[#C5A059] text-black font-bold
                  hover:bg-amber-400
                  transition-colors"
              >
                Share Feedback →
              </button>
            )}
          </div>
        </ScrollReveal3D>
      )}

      {/* ═══ DEMO VIEW ═══ */}
      {view === 'demo' && (
        <ScrollReveal3D className="max-w-4xl mx-auto px-6 py-12">

          <div className="flex items-center
            justify-between mb-8">
            <div>
              <div className="flex items-center
                gap-3 mb-2">
                <button
                  onClick={() => setView('intro')}
                  className="text-xs text-gray-600
                    hover:text-gray-400
                    transition-colors"
                >
                  ← Back
                </button>
                <div className="inline-flex
                  items-center gap-1.5
                  bg-amber-500/10
                  border border-amber-500/20
                  px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5
                    rounded-full bg-amber-400
                    animate-pulse" />
                  <span className="text-[10px]
                    font-semibold text-amber-400
                    uppercase tracking-widest">
                    Demo Mode
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-600">
                These are simulated feeds —
                not real cameras
              </p>
            </div>
            <button
              onClick={() => setView('feedback')}
              className="px-4 py-2 text-xs
                font-semibold
                bg-[#C5A059] text-black
                hover:bg-amber-400
                transition-colors"
            >
              Give Feedback
            </button>
          </div>

          {/* Camera grid */}
          <div className="grid grid-cols-2 gap-3
            mb-6">
            {DEMO_CAMERAS.map((cam, i) => (
              <button
                key={i}
                onClick={() => setDemoCamera(i)}
                className={`relative aspect-video
                  overflow-hidden rounded-sm
                  border transition-all duration-150
                  ${demoCamera === i
                    ? 'border-[#60A5FA]/50 ring-1 ring-[#60A5FA]/20'
                    : 'border-white/8 hover:border-white/15'}`}
                style={{
                  backgroundColor: cam.previewColor
                }}
              >
                {/* Scanline effect */}
                <div className="absolute inset-0
                  opacity-[0.04]"
                  style={{
                    backgroundImage:
                      'repeating-linear-gradient(0deg, rgba(255,255,255,0.5), rgba(255,255,255,0.5) 1px, transparent 1px, transparent 3px)',
                  }}
                />

                {/* Grid overlay */}
                <div className="absolute inset-0
                  opacity-[0.06]"
                  style={{
                    backgroundImage:
                      'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
                    backgroundSize: '30px 30px',
                  }}
                />

                {/* Center icon */}
                <div className="absolute inset-0
                  flex items-center justify-center
                  text-3xl opacity-15">
                  {cam.status === 'offline'
                    ? '📵' : '📷'}
                </div>

                {/* Status badge */}
                {cam.status === 'offline' && (
                  <div className="absolute inset-0
                    bg-black/50 flex items-center
                    justify-center">
                    <span className="text-xs
                      text-red-400 font-medium">
                      Connection lost
                    </span>
                  </div>
                )}

                {/* Bottom bar */}
                <div className="absolute bottom-0
                  left-0 right-0 px-2 py-1.5
                  bg-gradient-to-t
                  from-black/80 to-transparent">
                  <div className="flex items-center
                    justify-between">
                    <div>
                      <p className="text-[10px]
                        text-white font-medium">
                        {cam.name}
                      </p>
                      <p className="text-[9px]
                        text-gray-400">
                        {cam.location}
                      </p>
                    </div>
                    <div className="flex items-center
                      gap-1.5">
                      <div className={`w-1.5 h-1.5
                        rounded-full
                        ${cam.status === 'online'
                          ? 'bg-emerald-400 animate-pulse'
                          : 'bg-red-400'}`}
                      />
                      <span className={`text-[9px]
                        ${cam.status === 'online'
                          ? 'text-emerald-400'
                          : 'text-red-400'}`}>
                        {cam.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Active indicator */}
                {demoCamera === i && (
                  <div className="absolute top-2
                    right-2 w-2 h-2 rounded-full
                    bg-[#60A5FA] animate-pulse"
                  />
                )}
              </button>
            ))}
          </div>

          {/* Selected camera detail */}
          <div className="p-4 bg-[#0F1114]
            border border-white/8 rounded-sm
            mb-4">
            <div className="flex items-start
              justify-between mb-3">
              <div>
                <p className="text-sm font-semibold
                  text-white">
                  {DEMO_CAMERAS[demoCamera].name}
                </p>
                <p className="text-xs text-gray-500
                  mt-0.5">
                  {DEMO_CAMERAS[demoCamera].location}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5
                border rounded-sm font-medium
                ${DEMO_CAMERAS[demoCamera].status
                  === 'online'
                  ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5'
                  : 'text-red-400 border-red-500/30 bg-red-500/5'}`}>
                {DEMO_CAMERAS[demoCamera].status}
              </span>
            </div>
            <div className="flex items-center gap-2
              text-xs text-gray-500">
              <span>📍</span>
              <span>
                {DEMO_CAMERAS[demoCamera].activity}
              </span>
            </div>
          </div>

          {/* Feature locks */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: '🤖',
                label: 'AI Detection',
                tier: 'Pro',
                available: tier === 'pro'
                  || tier === 'elite',
              },
              {
                icon: '🔥',
                label: 'Fire Detection',
                tier: 'Elite',
                available: tier === 'elite',
              },
              {
                icon: '📼',
                label: 'Recording Playback',
                tier: 'All tiers',
                available: false,
                beta: true,
              },
            ].map(f => (
              <div key={f.label}
                className={`p-3 border rounded-sm
                  ${f.available
                    ? 'border-emerald-500/25 bg-emerald-500/[0.03]'
                    : 'border-white/8 bg-[#0F1114]'}`}>
                <div className="flex items-center
                  justify-between mb-2">
                  <span className="text-lg">
                    {f.icon}
                  </span>
                  {f.beta ? (
                    <span className="text-[9px]
                      text-amber-400 font-semibold
                      uppercase tracking-widest">
                      Coming soon
                    </span>
                  ) : f.available ? (
                    <span className="text-[9px]
                      text-emerald-400 font-semibold">
                      ✓ Available
                    </span>
                  ) : (
                    <span className="text-[9px]
                      text-gray-600">
                      🔒 {f.tier}
                    </span>
                  )}
                </div>
                <p className="text-xs font-medium
                  text-gray-300">
                  {f.label}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-6 text-center">
            <button
              onClick={() => setView('feedback')}
              className="text-sm text-[#60A5FA]
                hover:text-blue-300 transition-colors"
            >
              Interested in CCTV? Tell us what
              your factory needs →
            </button>
          </div>
        </ScrollReveal3D>
      )}

      {/* ═══ FEEDBACK VIEW ═══ */}
      {view === 'feedback' && (
        <ScrollReveal3D className="max-w-xl mx-auto px-6 py-12">

          <div className="mb-8">
            <button
              onClick={() => setView('intro')}
              className="text-xs text-gray-600
                hover:text-gray-400
                transition-colors mb-4 block"
            >
              ← Back
            </button>
            <h2 className="text-2xl font-bold
              text-white mb-2">
              Help us build CCTV right
            </h2>
            <p className="text-gray-500 text-sm">
              Your answers directly determine
              what we prioritize next.
              Takes 2 minutes.
            </p>
          </div>

          <div className="space-y-6">

            {/* Rating */}
            <div>
              <p className="text-xs font-semibold
                uppercase tracking-widest
                text-gray-500 mb-3">
                How excited are you about
                CCTV in your ERP?
              </p>
              <div className="flex gap-2">
                {[1,2,3,4,5].map(r => (
                  <button
                    key={r}
                    onClick={() => setFeedback(
                      prev => ({ ...prev, rating: r })
                    )}
                    className={`flex-1 py-3 text-lg
                      border rounded-sm transition-all
                      ${feedback.rating === r
                        ? 'border-[#C5A059] bg-[#C5A059]/10'
                        : 'border-white/8 hover:border-white/20'}`}
                  >
                    {'★'.repeat(r)}
                  </button>
                ))}
              </div>
              {feedback.rating > 0 && (
                <p className="text-xs text-gray-500
                  mt-2 text-center">
                  {[
                    '',
                    'Not very useful',
                    'Somewhat useful',
                    'Useful',
                    'Very useful',
                    'Essential for my business',
                  ][feedback.rating]}
                </p>
              )}
            </div>

            {/* Use case */}
            <div>
              <label className="text-xs font-semibold
                uppercase tracking-widest
                text-gray-500 block mb-2">
                What would you use CCTV for?
              </label>
              <select
                value={feedback.use_case}
                onChange={e => setFeedback(
                  prev => ({
                    ...prev,
                    use_case: e.target.value
                  })
                )}
                className="w-full bg-[#0F1114]
                  border border-white/10 text-white
                  text-sm px-3 py-2.5 outline-none
                  focus:border-[#60A5FA]/40"
              >
                <option value="">Select...</option>
                <option value="security">Factory security / theft prevention</option>
                <option value="production">Monitoring production floor</option>
                <option value="entry">Entry/exit monitoring</option>
                <option value="remote">Remote factory monitoring</option>
                <option value="all">All of the above</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Camera brand */}
            <div>
              <label className="text-xs font-semibold
                uppercase tracking-widest
                text-gray-500 block mb-2">
                What camera brand do you have
                or plan to buy?
              </label>
              <select
                value={feedback.camera_brand}
                onChange={e => setFeedback(
                  prev => ({
                    ...prev,
                    camera_brand: e.target.value
                  })
                )}
                className="w-full bg-[#0F1114]
                  border border-white/10 text-white
                  text-sm px-3 py-2.5 outline-none
                  focus:border-[#60A5FA]/40"
              >
                <option value="">Select...</option>
                <option value="hikvision">Hikvision</option>
                <option value="dahua">Dahua</option>
                <option value="axis">Axis</option>
                <option value="tp-link">TP-Link</option>
                <option value="generic">Generic Chinese brand</option>
                <option value="none">I don't have cameras yet</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Camera count */}
            <div>
              <label className="text-xs font-semibold
                uppercase tracking-widest
                text-gray-500 block mb-2">
                How many cameras does your
                factory need?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['1-2', '3-5', '6-10', '10+'].map(c => (
                  <button
                    key={c}
                    onClick={() => setFeedback(
                      prev => ({
                        ...prev,
                        camera_count: c
                      })
                    )}
                    className={`py-2.5 text-sm
                      border rounded-sm font-medium
                      transition-all
                      ${feedback.camera_count === c
                        ? 'border-[#60A5FA]/50 bg-[#60A5FA]/10 text-[#60A5FA]'
                        : 'border-white/8 text-gray-400 hover:border-white/20'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Features wanted */}
            <div>
              <label className="text-xs font-semibold
                uppercase tracking-widest
                text-gray-500 block mb-2">
                Which features matter most to you?
                (select all that apply)
              </label>
              <div className="space-y-2">
                {FEATURES_LIST.map(f => (
                  <button
                    key={f}
                    onClick={() => setFeedback(
                      prev => ({
                        ...prev,
                        features_wanted:
                          prev.features_wanted
                            .includes(f)
                            ? prev.features_wanted
                                .filter(x => x !== f)
                            : [...prev.features_wanted, f]
                      })
                    )}
                    className={`w-full text-left
                      px-3 py-2.5 text-xs border
                      rounded-sm transition-all
                      ${feedback.features_wanted
                        .includes(f)
                        ? 'border-[#60A5FA]/40 bg-[#60A5FA]/8 text-white'
                        : 'border-white/6 text-gray-400 hover:border-white/15'}`}
                  >
                    <span className={`mr-2
                      ${feedback.features_wanted
                        .includes(f)
                        ? 'text-[#60A5FA]'
                        : 'text-gray-600'}`}>
                      {feedback.features_wanted
                        .includes(f) ? '☑' : '☐'}
                    </span>
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div>
              <label className="text-xs font-semibold
                uppercase tracking-widest
                text-gray-500 block mb-2">
                Any specific requirements or
                problems you want solved?
              </label>
              <textarea
                value={feedback.comments}
                onChange={e => setFeedback(
                  prev => ({
                    ...prev,
                    comments: e.target.value
                  })
                )}
                rows={4}
                placeholder="Tell us about your factory setup, what problems you face with security, what you expect from CCTV software..."
                className="w-full bg-[#0F1114]
                  border border-white/10 text-white
                  text-sm px-3 py-2.5 outline-none
                  resize-none
                  focus:border-[#60A5FA]/40
                  placeholder:text-gray-700"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-xs font-semibold
                uppercase tracking-widest
                text-gray-500 block mb-2">
                Your email
                <span className="text-gray-700
                  font-normal ml-2">
                  (optional — for early access)
                </span>
              </label>
              <input
                type="email"
                value={feedback.email}
                onChange={e => setFeedback(
                  prev => ({
                    ...prev,
                    email: e.target.value
                  })
                )}
                placeholder="yourname@example.com"
                className="w-full bg-[#0F1114]
                  border border-white/10 text-white
                  text-sm px-3 py-2.5 outline-none
                  focus:border-[#60A5FA]/40
                  placeholder:text-gray-700"
              />
              <p className="text-[11px] text-gray-700
                mt-1">
                We will notify you when CCTV
                is fully released.
                No spam. Unsubscribe anytime.
              </p>
            </div>

            {/* Error */}
            {submitError && (
              <div className="p-3 bg-red-500/8
                border border-red-500/20 text-xs
                text-red-400 rounded-sm">
                {submitError}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleFeedbackSubmit}
              disabled={submitting}
              className="w-full py-3.5 text-sm
                font-bold bg-[#60A5FA] text-black
                hover:bg-blue-400
                disabled:opacity-50
                disabled:cursor-not-allowed
                transition-colors"
            >
              {submitting
                ? 'Submitting...'
                : 'Submit Feedback'}
            </button>
          </div>
        </ScrollReveal3D>
      )}

      {/* ═══ THANKS VIEW ═══ */}
      {view === 'thanks' && (
        <ScrollReveal3D className="max-w-md mx-auto px-6 py-24 text-center">

          <div className="w-16 h-16 rounded-full
            bg-emerald-500/10
            border border-emerald-500/25
            flex items-center justify-center
            text-3xl mx-auto mb-8">
            🙏
          </div>

          <h2 className="text-2xl font-bold
            text-white mb-3">
            Thank you for your feedback
          </h2>
          <p className="text-gray-400 text-sm
            mb-2 leading-relaxed">
            Your input has been recorded.
            We read every response personally
            and use it to decide what to build next.
          </p>
          <p className="text-gray-600 text-xs mb-10">
            — Ahmad Mahboob, Omnora Labs
          </p>

          <div className="space-y-3">
            <button
              onClick={() => setView('intro')}
              className="w-full py-2.5 text-sm
                border border-white/10 text-gray-400
                hover:border-white/20
                transition-colors"
            >
              Back to CCTV overview
            </button>
            
            <Link
              href="/dashboard"
              className="block w-full py-2.5 text-sm
                bg-[#60A5FA] text-black font-bold
                hover:bg-blue-400 transition-colors
                text-center"
            >
              Return to Dashboard
            </Link>
          </div>
        </ScrollReveal3D>
      )}
    </div>
  )
}
