'use client';

import React, { useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { useLanguageStore } from '@/stores/languageStore';
import enMessages from '@/messages/en.json';

const MESSAGES_MAP: Record<string, any> = {
  en: enMessages,
  ur: () => import('@/messages/ur.json'),
  ar: () => import('@/messages/ar.json'),
  de: () => import('@/messages/de.json'),
  es: () => import('@/messages/es.json'),
  fa: () => import('@/messages/fa.json'),
  fr: () => import('@/messages/fr.json'),
  hi: () => import('@/messages/hi.json'),
  tr: () => import('@/messages/tr.json'),
  zh: () => import('@/messages/zh.json'),
};

export function ClientI18nProvider({
  children,
  initialLocale,
  initialMessages,
}: {
  children: React.ReactNode;
  initialLocale: string;
  initialMessages: any;
}) {
  const { language } = useLanguageStore();
  const [messages, setMessages] = useState<any>(initialMessages);
  const [locale, setLocale] = useState(initialLocale);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    async function loadMessages() {
      const loader = MESSAGES_MAP[language];
      if (typeof loader === 'function') {
        try {
          const mod = await loader();
          setMessages(mod.default);
          setLocale(language);
        } catch (e) {
          console.error(`Failed to load messages for ${language}`, e);
        }
      } else if (loader) {
        setMessages(loader);
        setLocale(language);
      }
    }
    loadMessages();
  }, [language, isMounted]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
