"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { 
  X, Keyboard, Search, Zap, 
  History, LayoutGrid, Package, 
  BookOpen, Factory, ClipboardList,
  Plus, Edit, Trash2, Save, 
  CornerDownLeft, Printer,
  Info 
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);
  const [gPressed, setGPressed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let gTimeout: NodeJS.Timeout;

    const handleKey = (e: KeyboardEvent) => {
      const isInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable;
      
      // Global overrides (Work even in inputs if needed, but here we keep standard)
      if (e.key === '?' && !isInput) {
        e.preventDefault();
        if (e.shiftKey) {
          router.push('/settings/about');
        } else {
          setIsOpen(prev => !prev);
        }
      }

      if (e.key === 'Escape') {
        setIsOpen(false);
      }

      if (isInput) return;

      // Ctrl + Key Shortcuts
      if (e.ctrlKey) {
        const key = e.key.toLowerCase();
        if (key === 'k') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('open-global-search'));
        }
        if (key === 'h') {
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('action-trail:toggle'));
        }
      }

      // G-Navigation Logic
      if (e.key.toLowerCase() === 'g') {
        setGPressed(true);
        clearTimeout(gTimeout);
        gTimeout = setTimeout(() => setGPressed(false), 800); // Increased window
      } else if (gPressed) {
        const key = e.key.toLowerCase();
        const routes: Record<string, string> = {
          'd': '/dashboard',
          'i': '/inventory',
          'k': '/khata',
          'p': '/production',
          'r': '/reports',
          'a': '/settings/about'
        };
        if (routes[key]) {
          e.preventDefault();
          router.push(routes[key]);
        }
        setGPressed(false);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      clearTimeout(gTimeout);
    };
  }, [gPressed, router]);

  const shortcuts = {
    Global: [
      { key: 'Ctrl + K', label: 'Global Search', icon: Search },
      { key: 'Space', label: 'Quick Actions', icon: Zap },
      { key: 'Ctrl + H', label: 'Action History', icon: History },
      { key: '?', label: 'Keyboard Shortcuts', icon: Keyboard },
      { key: 'Shift + ?', label: 'About Noxis', icon: Info },
      { key: 'Esc', label: 'Close Modal', icon: X },
    ],
    Navigation: [
      { key: 'G then D', label: 'Go to Dashboard', icon: LayoutGrid },
      { key: 'G then I', label: 'Go to Inventory', icon: Package },
      { key: 'G then K', label: 'Go to Khata', icon: BookOpen },
      { key: 'G then P', label: 'Go to Production', icon: Factory },
      { key: 'G then R', label: 'Go to Reports', icon: ClipboardList },
      { key: 'G then A', label: 'About Omnora', icon: Info },
    ],
    Actions: [
      { key: 'N', label: 'New (Context)', icon: Plus },
      { key: 'E', label: 'Edit Row', icon: Edit },
      { key: 'Del', label: 'Delete Row', icon: Trash2 },
      { key: 'Ctrl + S', label: 'Save Form', icon: Save },
      { key: 'Ctrl + ↵', label: 'Submit Form', icon: CornerDownLeft },
      { key: 'Ctrl + P', label: 'Print View', icon: Printer },
    ]
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl bg-[#1A1D21] border border-white/10 shadow-2xl p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <Keyboard className="text-electric-blue" size={24} />
                <h2 className="text-xl font-black text-white uppercase tracking-tighter">Keyboard Reference</h2>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {Object.entries(shortcuts).map(([category, items]) => (
                <div key={category} className="space-y-4">
                  <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] mb-6">{category}</h3>
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.key} className="flex items-center justify-between group">
                        <div className="flex items-center space-x-3">
                          <item.icon size={12} className="text-gray-500 group-hover:text-electric-blue transition-colors" />
                          <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">{item.label}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {item.key.split(' ').map((k, i) => (
                            <React.Fragment key={i}>
                              {k === '+' ? (
                                <span className="text-[10px] text-gray-700 mx-1">+</span>
                              ) : (
                                <kbd className="px-1.5 py-0.5 bg-onyx border border-white/10 rounded-sm text-[9px] font-mono text-electric-blue shadow-lg min-w-[24px] text-center">
                                  {k}
                                </kbd>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 pt-6 border-t border-white/5 text-center">
              <p className="text-[9px] text-gray-600 font-bold uppercase tracking-widest">
                Noxis OS v13.0 • Optimized for Industrial Workflow
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
