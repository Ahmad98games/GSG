import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Zap, Lock, 
  Terminal, CheckCheck, 
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import type { DeviceNode } from '../layout/DashboardLayout';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string; // Encrypted Garbage
  decryptedContent?: string;
  timestamp: string;
}

interface Props {
  activeNode: DeviceNode | null;
}

const SHARED_SECRET = 'GS-TACTICAL-KEY-2026';

export const TacticalMessenger: React.FC<Props> = ({ activeNode }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // E2EE logic using SubtleCrypto
  const getEncryptionKey = async () => {
    const enc = new TextEncoder();
    const keyData = enc.encode(SHARED_SECRET);
    const hash = await crypto.subtle.digest('SHA-256', keyData);
    return await crypto.subtle.importKey(
      'raw', hash, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']
    );
  };

  const encryptMessage = async (text: string) => {
    const key = await getEncryptionKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, key, enc.encode(text)
    );
    
    // Combine IV + Ciphertext for transmission
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return btoa(String.fromCharCode(...combined));
  };

  const decryptMessage = React.useCallback(async (garbage: string) => {
    try {
      const key = await getEncryptionKey();
      const combined = new Uint8Array(atob(garbage).split('').map(c => c.charCodeAt(0)));
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv }, key, ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch {
      return '[ENCRYPTION_ERROR: ILLEGAL_KEY]';
    }
  }, []);

  useEffect(() => {
    const channel = supabase.channel('tactical_comms')
      .on('broadcast', { event: 'TAC_MSG' }, async ({ payload }) => {
        const decrypted = await decryptMessage(payload.content);
        setMessages(prev => [...prev, { ...payload, decryptedContent: decrypted }]);
        setIsTyping(null);
      })
      .on('broadcast', { event: 'TYPING' }, ({ payload }) => {
        if (payload.senderId !== 'MASTER_NODE') {
           setIsTyping(payload.senderName);
           setTimeout(() => setIsTyping(null), 3000);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [decryptMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const encrypted = await encryptMessage(inputValue);
    const newMessage: Message = {
      id: crypto.randomUUID(),
      senderId: 'MASTER_NODE',
      senderName: 'Master',
      content: encrypted,
      decryptedContent: inputValue,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');

    await supabase.channel('tactical_comms').send({
      type: 'broadcast',
      event: 'TAC_MSG',
      payload: newMessage
    });
  };

  const handleTyping = () => {
    supabase.channel('tactical_comms').send({
      type: 'broadcast',
      event: 'TYPING',
      payload: { senderId: 'MASTER_NODE', senderName: 'Master' }
    });
  };

  return (
    <div className="h-full flex flex-col bg-[#09090b] border border-zinc-900 shadow-2xl relative font-mono-vault animate-in fade-in duration-700">
      {/* Messenger Header */}
      <div className="px-6 py-4 bg-[#18181b] border-b border-[#27272a] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse" />
          <h3 className="text-[11px] font-black text-white italic uppercase tracking-[0.2em]">
            Tactical Messenger v7.1 {activeNode && `// TARGET: ${activeNode.name}`}
          </h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 border border-zinc-800 rounded-sm">
            <Lock className="w-3 h-3 text-[#D4AF37]/50" />
            <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">E2EE: AES_GCM_256</span>
          </div>
          <button onClick={() => setMessages([])} className="text-zinc-600 hover:text-red-500 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-10">
            <Terminal className="w-12 h-12 text-[#D4AF37]" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Listening for secure packets...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={cn(
              "flex flex-col space-y-1.5 max-w-[85%]",
              msg.senderId === 'MASTER_NODE' ? "ml-auto items-end" : "items-start"
            )}>
              <div className="flex items-center gap-2 px-1">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">{msg.senderName}</span>
                <span className="text-[7px] text-zinc-700">{new Date(msg.timestamp).toLocaleTimeString()}</span>
              </div>
              <div className={cn(
                "px-4 py-2.5 border transition-all relative group",
                msg.senderId === 'MASTER_NODE' 
                  ? "bg-[#D4AF37]/5 border-[#D4AF37]/30 text-white" 
                  : "bg-zinc-900 border-zinc-800 text-zinc-200"
              )}>
                <p className="text-[11px] leading-relaxed break-words selection:bg-[#D4AF37]/30">
                  {msg.decryptedContent}
                </p>
                {/* Visual Garbage Decrypting Effect */}
                <div className="absolute top-0 left-0 w-full h-[1px] bg-[#D4AF37]/20 group-hover:h-full transition-all opacity-0 group-hover:opacity-10" />
              </div>
              <div className="flex items-center gap-1 opacity-40">
                <CheckCheck className="w-3 h-3 text-[#D4AF37]" />
                <span className="text-[7px] uppercase font-black tracking-widest text-[#D4AF37]">SECURED</span>
              </div>
            </div>
          ))
        )}
        <div ref={scrollRef} />
      </div>

      {/* Status Bar */}
      {isTyping && (
        <div className="px-6 py-2 flex items-center gap-2">
          <Zap className="w-3 h-3 text-[#D4AF37] animate-bounce" />
          <span className="text-[8px] font-black text-[#D4AF37] uppercase tracking-widest">{isTyping} is decrypting data...</span>
        </div>
      )}

      {/* Input Module */}
      <form onSubmit={handleSend} className="p-6 bg-[#18181b] border-t border-[#27272a]">
        <div className="flex items-center gap-3">
          <input 
            type="text"
            value={inputValue}
            onChange={(e) => { setInputValue(e.target.value); handleTyping(); }}
            placeholder="TYPE_SECURE_PAYLOAD_HERE..."
            className="flex-1 bg-[#09090b] border border-zinc-800 focus:border-[#D4AF37] outline-none p-4 text-[11px] text-white placeholder:text-zinc-800 transition-all"
          />
          <button 
            type="submit"
            className="w-14 h-14 bg-[#D4AF37] hover:bg-[#C5A028] text-zinc-950 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-[#D4AF37]/5"
          >
            <Send className="w-5 h-5 fill-zinc-950" />
          </button>
        </div>
        <div className="mt-3 flex justify-between items-center opacity-30">
          <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-500">Protocol: GS_TAC_PULSE_7.1</span>
          <div className="flex gap-4">
             <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-600">Sync: READY</span>
             <span className="text-[7px] font-black uppercase tracking-[0.2em] text-zinc-600">Buffer: 0KB</span>
          </div>
        </div>
      </form>
    </div>
  );
};
