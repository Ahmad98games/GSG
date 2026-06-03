"use client"

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { searchKnowledge } from '@/lib/knowledge/knowledgeSearch'
import { KnowledgeEntry } from '@/lib/knowledge/noxis-docs'
import { X, Mic, Send, ChevronRight, Navigation, HelpCircle } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  results?: KnowledgeEntry[]
}

const QUICK_CHIPS = [
  'How to add karigar',
  'Create invoice',
  'Run payroll',
  'Where is calculator',
  'Backup data',
  'Give peshgi advance',
  'Mark attendance',
  'Log production',
]

export default function AskNoxis() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    text: 'Assalam o Alaikum! I am the Noxis assistant. Ask me how to use any feature, or tell me where to go.',
  }])
  const [input, setInput] = useState('')
  const [listening, setListening] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Ctrl+/ to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen])

  const handleQuery = (queryText: string) => {
    const text = queryText.trim()
    if (!text) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text }
    setInput('')

    const results = searchKnowledge(text, 2)
    let responseText = ''

    if (results.length === 0) {
      responseText = `I couldn't find specific information about "${text}". You can ask me about inventory, karigars, payroll, invoices, reports, calculators, or settings. Try "how to add karigar" or "where is the calculator".`
    } else {
      const top = results[0]
      responseText = top.content
      if (top.steps && top.steps.length > 0) {
        responseText += '\n\nSteps:\n' + top.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')
      }
      if (top.shortcut) {
        responseText += `\n\nShortcut: ${top.shortcut}`
      }
    }

    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      text: responseText,
      results: results.length > 0 ? results : undefined,
    }

    setMessages(prev => [...prev, userMsg, assistantMsg])
  }

  const navigateTo = (entry: KnowledgeEntry) => {
    if (entry.route) {
      router.push(entry.route)
      setIsOpen(false)
    }
  }

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      handleQuery('Voice not supported in this browser')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = 'en-US'
    recognition.continuous = false
    recognition.interimResults = false
    setListening(true)
    recognition.start()

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setInput(transcript)
      handleQuery(transcript)
    }

    recognition.onerror = () => setListening(false)
    recognition.onend = () => setListening(false)
  }

  if (!isOpen) return null

  // Show chips only in the welcome state (just 1 message)
  const showChips = messages.length === 1

  return (
    <div className="fixed bottom-20 right-4 w-[360px] max-h-[540px] bg-[#111418] border border-white/10 rounded-sm shadow-2xl z-50 flex flex-col overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#60A5FA] animate-pulse" />
          <span className="text-sm font-semibold text-white">Ask Noxis</span>
          <span className="text-[9px] text-gray-600 font-mono uppercase">AI</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-gray-300 transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map(msg => (
          <div key={msg.id}>
            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                style={{ maxWidth: '90%' }}
                className={`rounded px-3 py-2 text-xs leading-relaxed whitespace-pre-line ${
                  msg.role === 'user'
                    ? 'bg-[#60A5FA] text-black'
                    : 'bg-[#1A1D21] text-gray-300'
                }`}
              >
                {msg.text}
              </div>
            </div>

            {/* Navigation / action buttons from search results */}
            {msg.results && msg.results.length > 0 && (
              <div className="mt-2 space-y-1.5">
                {msg.results.map(result => (
                  <div key={result.id} className="p-2.5 bg-[#0F1115] border border-white/8 rounded">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[8px] font-black uppercase text-[#60A5FA] px-1.5 py-0.5 bg-[#60A5FA]/10 rounded">
                        {result.category}
                      </span>
                      {result.shortcut && (
                        <span className="text-[9px] font-mono text-gray-500 flex items-center gap-1">
                          <HelpCircle size={9} />
                          {result.shortcut}
                        </span>
                      )}
                    </div>
                    <h4 className="mt-1.5 font-bold text-white text-[11px]">{result.title}</h4>
                    {result.route && (
                      <button
                        onClick={() => navigateTo(result)}
                        className="mt-2 w-full py-1.5 bg-[#60A5FA] text-black text-[9px] font-black uppercase tracking-widest rounded hover:bg-[#60A5FA]/90 flex items-center justify-center gap-1.5"
                      >
                        <Navigation size={10} />
                        {result.action_label || 'Open'}
                        <ChevronRight size={10} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Quick suggestion chips — visible on first open only */}
        {showChips && (
          <div className="pt-2">
            <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CHIPS.map(chip => (
                <button
                  key={chip}
                  onClick={() => handleQuery(chip)}
                  className="px-2.5 py-1 text-[10px] bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white rounded-sm transition-colors"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="px-3 py-3 border-t border-white/8 flex items-center gap-2 flex-shrink-0">
        <button
          onClick={startListening}
          className={`w-8 h-8 rounded transition-colors flex items-center justify-center flex-shrink-0 ${
            listening
              ? 'bg-red-500/20 text-red-400 animate-pulse'
              : 'bg-white/5 text-gray-500 hover:text-gray-300'
          }`}
        >
          <Mic size={14} />
        </button>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleQuery(input) }}
          placeholder="Ask anything about Noxis..."
          className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-gray-700 min-w-0"
        />
        <button
          onClick={() => handleQuery(input)}
          disabled={!input.trim()}
          className="w-8 h-8 flex items-center justify-center rounded bg-[#60A5FA]/10 text-[#60A5FA] hover:bg-[#60A5FA]/20 disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
        >
          <Send size={13} />
        </button>
      </div>

      {/* Footer hint */}
      <div className="px-3 py-1.5 border-t border-white/5 text-[9px] text-gray-700 text-center">
        Ctrl+/ to toggle · Powered by Noxis AI
      </div>
    </div>
  )
}
