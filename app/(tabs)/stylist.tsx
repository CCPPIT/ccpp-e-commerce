import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Bot, Send } from 'lucide-react-native';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Database } from '../../lib/supabase';
import { getAIResponse } from '../../lib/aiStylist';

type Message = Database['public']['Tables']['ai_messages']['Row'];

export default function StylistScreen() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadConversation = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let convId = conversationId;
      if (!convId) {
        const { data: convData, error: convError } = await supabase
          .from('ai_conversations')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (convError && convError.code !== 'PGRST116') throw convError;

        if (convData) {
          convId = convData.id;
        } else {
          const { data: newConv, error: newConvError } = await supabase
            .from('ai_conversations')
            .insert({ user_id: user.id })
            .select('id')
            .single();
          if (newConvError) throw newConvError;
          convId = newConv.id;
        }
        setConversationId(convId);
      }
      
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data.length === 0) {
        const welcomeMessage: Message = {
          id: 'welcome',
          conversation_id: convId,
          sender: 'ai',
          content: 'أهلاً بك! أنا مساعدك الذكي للأزياء. كيف يمكنني مساعدتك اليوم؟',
          created_at: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      } else {
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading conversation:", error);
      Alert.alert('خطأ', 'لا يمكن تحميل المحادثة');
    } finally {
      setLoading(false);
    }
  }, [user, conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const handleSend = async () => {
    if (input.trim() === '' || !conversationId || !user) return;

    const userMessage: Message = {
      id: Math.random().toString(),
      conversation_id: conversationId,
      sender: 'user',
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');

    try {
      await supabase.from('ai_messages').insert({ conversation_id: conversationId, sender: 'user', content: currentInput });
      
      const aiContent = getAIResponse(currentInput);
      const aiMessage: Message = {
        id: Math.random().toString(),
        conversation_id: conversationId,
        sender: 'ai',
        content: aiContent,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, aiMessage]);

      await supabase.from('ai_messages').insert({ conversation_id: conversationId, sender: 'ai', content: aiContent });
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert('خطأ', 'لا يمكن إرسال الرسالة');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageBubble, item.sender === 'ai' ? styles.aiBubble : styles.userBubble]}>
      <Text style={styles.messageText}>{item.content}</Text>
    </View>
  );

  if (!user) {
     return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Bot size={80} color="#ccc" />
          <Text style={styles.authTitle}>المساعد الذكي</Text>
          <Text style={styles.authSubtitle}>سجل الدخول للتحدث مع مساعد الأزياء الخاص بك.</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.authButtonText}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>المساعد الذكي</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <FlatList
          data={messages}
          renderItem={renderMessage}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.chatContainer}
        />
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="اسأل عن نصيحة..."
            value={input}
            onChangeText={setInput}
            textAlign="right"
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Send size={24} color="white" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  chatContainer: { padding: 10 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 18, marginBottom: 10 },
  aiBubble: { backgroundColor: '#e9ecef', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  userBubble: { backgroundColor: '#4ECDC4', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 16, color: '#333', fontFamily: 'Inter_400Regular' },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', padding: 10, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  input: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, fontFamily: 'Inter_400Regular' },
  sendButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4ECDC4', justifyContent: 'center', alignItems: 'center' },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20, fontFamily: 'Inter_700Bold' },
  authSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10, marginBottom: 30, fontFamily: 'Inter_400Regular' },
  authButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  authButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
});
