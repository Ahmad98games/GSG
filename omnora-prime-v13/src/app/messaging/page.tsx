"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from "framer-motion";
import { 
  Send, 
  MessageCircle, 
  Search,
  Check,
  CheckCheck,
  Mic,
  Image as ImageIcon,
  MoreVertical,
  ArrowLeft
} from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import EmptyState from "@/components/ui/EmptyState";
import { useCallback } from 'react';

// Supabase Client for Realtime
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Message {
  messageId: string;
  fromNodeId: string;
  toNodeId: string;
  payload: string;
  mediaType: 'text' | 'voice' | 'image';
  status: 'queued' | 'delivered' | 'read' | 'failed';
  queuedAt: string;
  deliveredAt?: string;
  readAt?: string;
  encryptedPayload?: Uint8Array | number[];
}

interface Conversation {
  nodeId: string;
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagingPage() {
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // 1. Fetch Conversations & Messages
  useEffect(() => {
    async function fetchData() {
      const res = await fetch('/api/messaging');
      const data = await res.json();
      if (Array.isArray(data)) {
        // Group by node_id for conversation list
        const groups = data.reduce((acc: Record<string, Conversation>, msg: Message) => {
          const nodeId = msg.fromNodeId === 'hub' ? msg.toNodeId : msg.fromNodeId;
          if (!acc[nodeId]) {
            acc[nodeId] = {
              nodeId,
              lastMessage: msg,
              unreadCount: msg.status !== 'read' && msg.fromNodeId !== 'hub' ? 1 : 0
            };
          } else {
            if (new Date(msg.queuedAt) > new Date(acc[nodeId].lastMessage.queuedAt)) {
              acc[nodeId].lastMessage = msg;
            }
            if (msg.status !== 'read' && msg.fromNodeId !== 'hub') {
              acc[nodeId].unreadCount++;
            }
          }
          return acc;
        }, {});
        setConversations(Object.values(groups));
      }
    }
    fetchData();
  }, []);

  useEffect(() => {
    if (activeNodeId) {
      async function fetchChat() {
        const res = await fetch(`/api/messaging?nodeId=${activeNodeId}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setMessages(data.map((m: Message) => ({
            ...m,
            payload: m.encryptedPayload ? Buffer.from(m.encryptedPayload as number[]).toString() : (m.payload || '')
          })));
        }
      }
      fetchChat();
    }
  }, [activeNodeId]);

  const handleIncomingMessage = useCallback((newMsg: Message) => {
    if (newMsg.fromNodeId === activeNodeId || newMsg.toNodeId === activeNodeId) {
      setMessages(prev => {
        // Prevent duplicates between Cloud and Local relays
        if (prev.some(m => m.messageId === newMsg.messageId)) return prev;
        return [...prev, newMsg];
      });
    }
    // Update conversation list
    setConversations(prev => {
      const nodeId = newMsg.fromNodeId === 'hub' ? newMsg.toNodeId : newMsg.fromNodeId;
      const existing = prev.find(c => c.nodeId === nodeId);
      if (existing) {
        return prev.map(c => c.nodeId === nodeId ? { ...c, lastMessage: newMsg, unreadCount: c.unreadCount + 1 } : c);
      } else {
        return [...prev, { nodeId, lastMessage: newMsg, unreadCount: 1 }];
      }
    });
  }, [activeNodeId]);

  // 2. Realtime Subscription (Cloud & Local LAN)
  useEffect(() => {
    // A. Supabase (Cloud Relay)
    const channel = supabase
      .channel('mesh_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mesh_messages' }, (payload) => {
        const newMsg = payload.new as Message;
        handleIncomingMessage(newMsg);
      })
      .subscribe();

    // B. Local SSE (Offline LAN Relay)
    const eventSource = new EventSource('/api/messaging/events');
    eventSource.addEventListener('new_message', (e: MessageEvent) => {
      const newMsg = JSON.parse(e.data);
      handleIncomingMessage(newMsg);
    });

    return () => {
      supabase.removeChannel(channel);
      eventSource.close();
    };
  }, [handleIncomingMessage]);

  // 3. Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeNodeId) return;

    const body = {
      toNodeId: activeNodeId,
      text: inputText.trim(),
      mediaType: 'text'
    };

    try {
      const res = await fetch('/api/messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      setMessages(prev => [...prev, { ...data, payload: inputText.trim() }]);
      setInputText("");
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  const filteredConversations = useMemo(() => {
    return conversations.filter(c => c.nodeId.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [conversations, searchQuery]);

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-inter">
      
      {/* Left Panel: Conversation List */}
      <div className="w-[320px] border-r border-white/5 bg-[#0A0A0B] flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-tight">Mesh Messenger</h1>
            <div className="flex items-center gap-1.5 bg-emerald/10 px-2 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-emerald">{conversations.length}</span>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search Mesh Nodes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-electric-blue/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.map((conv) => (
            <button
              key={conv.nodeId}
              onClick={() => setActiveNodeId(conv.nodeId)}
              className={cn(
                "w-full p-4 flex items-center gap-3 transition-all hover:bg-white/5 border-l-2",
                activeNodeId === conv.nodeId ? "bg-electric-blue/5 border-electric-blue" : "border-transparent"
              )}
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm font-bold uppercase text-slate-400 border border-white/5">
                {conv.nodeId.substring(0, 2)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-[#C5A059] uppercase tracking-widest">{conv.nodeId}</span>
                  <span className="text-[9px] text-slate-500 italic">
                    {formatDistanceToNow(new Date(conv.lastMessage.queuedAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate mt-0.5 opacity-80">
                  {conv.lastMessage.fromNodeId === 'hub' ? 'You: ' : ''}
                  {conv.lastMessage.payload || 'Attachment'}
                </p>
              </div>
              {conv.unreadCount > 0 && (
                <div className="w-5 h-5 rounded-full bg-electric-blue text-onyx text-[10px] font-bold flex items-center justify-center">
                  {conv.unreadCount}
                </div>
              )}
            </button>
          ))}
            <EmptyState 
               icon={MessageCircle}
               title="No active threads"
               body="Messages between mesh nodes will appear here once communication is established."
            />
        </div>
      </div>

      {/* Right Panel: Chat Thread */}
      <div className="flex-1 flex flex-col bg-onyx">
        {activeNodeId ? (
          <>
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-surface/30 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveNodeId(null)} 
                  className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500">
                    {activeNodeId.substring(0, 2)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald rounded-full border-2 border-onyx" />
                </div>
                <div>
                  <h2 className="text-sm font-bold font-mono text-[#C5A059] uppercase tracking-widest">{activeNodeId}</h2>
                  <p className="text-[10px] text-emerald font-bold tracking-widest uppercase">Node Online</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button className="text-slate-500 hover:text-white transition-colors"><MoreVertical className="w-5 h-5" /></button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)]">
              {messages.map((msg) => (
                <motion.div
                  key={msg.messageId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col group",
                    msg.fromNodeId === 'hub' ? "items-end" : "items-start"
                  )}
                >
                  <div className={cn(
                    "max-w-[70%] p-4 rounded-xl relative",
                    msg.fromNodeId === 'hub' 
                      ? "bg-electric-blue/10 border border-electric-blue/20 text-white rounded-tr-none" 
                      : "bg-[#1A1D21] border border-white/5 text-slate-200 rounded-tl-none"
                  )}>
                    {msg.mediaType === 'voice' && (
                      <div className="flex items-center gap-3 mb-2 text-electric-blue">
                        <Mic className="w-4 h-4" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Voice Note</span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{msg.payload}</p>
                    
                    <div className={cn(
                      "flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity",
                      msg.fromNodeId === 'hub' ? "justify-end" : "justify-start"
                    )}>
                      <span className="text-[9px] text-slate-500 italic">
                        {new Date(msg.queuedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {msg.fromNodeId === 'hub' && (
                        msg.status === 'read' ? <CheckCheck className="w-3 h-3 text-electric-blue" /> : <Check className="w-3 h-3 text-slate-500" />
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="p-6 border-t border-white/5 bg-surface/50">
              <form onSubmit={handleSend} className="max-w-4xl mx-auto flex gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Enter command or message..."
                    maxLength={1000}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-4 pr-12 text-white focus:outline-none focus:border-electric-blue/50 transition-all placeholder:text-slate-600"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-3 text-slate-500">
                    <button type="button" className="hover:text-white"><Mic className="w-4 h-4" /></button>
                    <button type="button" className="hover:text-white"><ImageIcon className="w-4 h-4" /></button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-electric-blue text-onyx px-6 rounded-xl font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(45,185,255,0.2)]"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <EmptyState 
            icon={MessageCircle}
            title="Mesh Node Selector"
            body="Select a communication node from the sidebar to begin an encrypted mesh session."
          />
        )}
      </div>
    </div>
  );
}
  