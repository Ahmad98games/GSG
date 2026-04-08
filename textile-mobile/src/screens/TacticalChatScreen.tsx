import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  FlatList, KeyboardAvoidingView, Platform, 
  StyleSheet
} from 'react-native';
import { 
  Send, Shield, Zap, Lock, 
  Terminal, CheckCheck, RefreshCw 
} from 'lucide-react-native';
import { supabase } from '../lib/supabase';
import { useProductStore } from '../store/useProductStore';
import { THEME } from '../lib/theme';

const SHARED_SECRET = 'GS-TACTICAL-KEY-2026';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  content: string; // Encrypted Garbage
  decryptedContent?: string;
  timestamp: string;
}

export default function TacticalChatScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  // E2EE logic using SubtleCrypto (Same as PC)
  const getEncryptionKey = async () => {
    // Note: SubtleCrypto is available in modern JS environments.
    // Ensure the polyfill or native version is active.
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
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    // Use base64 encoding (standard for transmission)
    const base64 = btoa(String.fromCharCode(...combined));
    return base64;
  };

  const decryptMessage = async (garbage: string) => {
    try {
      const key = await getEncryptionKey();
      const binaryString = atob(garbage);
      const combined = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        combined[i] = binaryString.charCodeAt(i);
      }
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv }, key, ciphertext
      );
      return new TextDecoder().decode(decrypted);
    } catch (e) {
      return '[ENCRYPTION_ERROR]';
    }
  };

  useEffect(() => {
    const channel = supabase.channel('tactical_comms')
      .on('broadcast', { event: 'TAC_MSG' }, async ({ payload }) => {
        const decrypted = await decryptMessage(payload.content);
        setMessages(prev => [...prev, { ...payload, decryptedContent: decrypted }]);
        setIsTyping(null);
      })
      .on('broadcast', { event: 'TYPING' }, ({ payload }) => {
        if (payload.senderId !== 'FIELD_NODE_01') {
           setIsTyping(payload.senderName);
           setTimeout(() => setIsTyping(null), 3000);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const encrypted = await encryptMessage(inputValue);
    const newMessage: Message = {
      id: Math.random().toString(36).slice(2),
      senderId: 'FIELD_NODE_01',
      senderName: 'FIELD_NODE_ALPHA',
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

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[
      styles.messageWrapper,
      item.senderId === 'FIELD_NODE_01' ? styles.myMessage : styles.theirMessage
    ]}>
      <View style={styles.msgHeader}>
        <Text style={styles.senderText}>{item.senderName}</Text>
        <Text style={styles.timeText}>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <View style={[
        styles.messageBox,
        item.senderId === 'FIELD_NODE_01' ? styles.myBox : styles.theirBox
      ]}>
        <Text style={styles.messageText}>{item.decryptedContent}</Text>
      </View>
      <View style={styles.msgFooter}>
        <CheckCheck size={10} color={THEME.colors.primary} style={{ opacity: 0.5 }} />
        <Text style={styles.securedText}>SECURED</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.headerTitle}>
          <View style={styles.pulseDot} />
          <Text style={styles.headerText}>TACTICAL MESSENGER v7.1</Text>
        </View>
        <View style={styles.e2eeBadge}>
          <Lock size={10} color={THEME.colors.primary} />
          <Text style={styles.e2eeText}>E2EE: AES_GCM</Text>
        </View>
      </View>

      <FlatList 
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {isTyping && (
        <View style={styles.typingContainer}>
          <Zap size={10} color={THEME.colors.primary} />
          <Text style={styles.typingText}>{isTyping} is decrypting data...</Text>
        </View>
      )}

      <View style={styles.inputArea}>
        <TextInput 
          style={styles.input}
          value={inputValue}
          onChangeText={(v) => {
            setInputValue(v);
            supabase.channel('tactical_comms').send({
              type: 'broadcast',
              event: 'TYPING',
              payload: { senderId: 'FIELD_NODE_01', senderName: 'FIELD_NODE_ALPHA' }
            });
          }}
          placeholder="TYPE_SECURE_PAYLOAD..."
          placeholderTextColor={THEME.colors.textSecondary}
          selectionColor={THEME.colors.primary}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Send size={20} color={THEME.colors.background} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.colors.background },
  header: { 
    height: 60, 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
    borderBottomWidth: 1, 
    borderBottomColor: THEME.colors.border 
  },
  headerTitle: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: THEME.colors.primary },
  headerText: { color: THEME.colors.textPrimary, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  e2eeBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 5, 
    backgroundColor: THEME.colors.surface, 
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderWidth: 1, 
    borderColor: THEME.colors.border, 
    borderRadius: 2 
  },
  e2eeText: { color: THEME.colors.primary, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  listContent: { padding: 20, gap: 20 },
  messageWrapper: { maxWidth: '85%', gap: 4 },
  myMessage: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  msgHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  senderText: { color: THEME.colors.textSecondary, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  timeText: { color: THEME.colors.border, fontSize: 8 },
  messageBox: { paddingHorizontal: 15, paddingVertical: 10, borderWidth: 1 },
  myBox: { backgroundColor: THEME.colors.surface, borderColor: THEME.colors.primary + '44' },
  theirBox: { backgroundColor: THEME.colors.surface, borderColor: THEME.colors.border },
  messageText: { color: THEME.colors.textPrimary, fontSize: 13, lineHeight: 18 },
  msgFooter: { flexDirection: 'row', alignItems: 'center', gap: 4, opacity: 0.5 },
  securedText: { color: THEME.colors.primary, fontSize: 7, fontWeight: '900', letterSpacing: 1 },
  typingContainer: { paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 6 },
  typingText: { color: THEME.colors.primary, fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  inputArea: { 
    padding: 20, 
    flexDirection: 'row', 
    gap: 12, 
    borderTopWidth: 1, 
    borderTopColor: THEME.colors.border, 
    paddingBottom: Platform.OS === 'ios' ? 40 : 20 
  },
  input: { 
    flex: 1, 
    backgroundColor: THEME.colors.surfaceRaised, 
    borderWidth: 1, 
    borderColor: THEME.colors.border, 
    height: 50, 
    paddingHorizontal: 15, 
    color: THEME.colors.textPrimary, 
    fontSize: 12 
  },
  sendButton: { 
    width: 50, 
    height: 50, 
    backgroundColor: THEME.colors.primary, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderRadius: 2 
  }
});
