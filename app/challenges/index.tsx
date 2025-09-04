import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Trophy, CheckCircle, Gift } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Database } from '../../lib/supabase';

type Challenge = Database['public']['Tables']['challenges']['Row'];
type UserChallenge = Database['public']['Tables']['user_challenges']['Row'];

export default function ChallengesScreen() {
  const { user } = useAuth();
  const [dailyChallenges, setDailyChallenges] = useState<Challenge[]>([]);
  const [weeklyChallenges, setWeeklyChallenges] = useState<Challenge[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadChallenges = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [challengesRes, completedRes] = await Promise.all([
        supabase.from('challenges').select('*'),
        supabase.from('user_challenges').select('challenge_id').eq('user_id', user.id)
      ]);

      if (challengesRes.error) throw challengesRes.error;
      if (completedRes.error) throw completedRes.error;

      setDailyChallenges(challengesRes.data.filter(c => c.type === 'daily'));
      setWeeklyChallenges(challengesRes.data.filter(c => c.type === 'weekly'));
      setCompletedIds(new Set(completedRes.data.map(uc => uc.challenge_id)));
    } catch (error) {
      console.error("Error loading challenges:", error);
      Alert.alert('خطأ', 'لا يمكن تحميل التحديات');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(useCallback(() => { loadChallenges(); }, [loadChallenges]));

  const renderChallenge = ({ item }: { item: Challenge }) => {
    const isCompleted = completedIds.has(item.id);
    return (
      <View style={[styles.challengeCard, isCompleted && styles.completedCard]}>
        <View style={styles.challengeIcon}>
          {isCompleted ? <CheckCircle size={28} color="#28a745" /> : <Trophy size={28} color="#FFA500" />}
        </View>
        <View style={styles.challengeInfo}>
          <Text style={styles.challengeName}>{item.name}</Text>
          <Text style={styles.challengeDesc}>{item.description}</Text>
        </View>
        <View style={styles.rewardInfo}>
          <Gift size={20} color={isCompleted ? '#666' : '#FFA500'} />
          <Text style={styles.rewardPoints}>+{item.points_reward}</Text>
        </View>
      </View>
    );
  };
  
  if (!user) {
     return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <Trophy size={80} color="#ccc" />
          <Text style={styles.authTitle}>التحديات والمكافآت</Text>
          <Text style={styles.authSubtitle}>سجل الدخول للمشاركة في التحديات وكسب النقاط.</Text>
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
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><ArrowLeft size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>التحديات</Text>
        <View style={{ width: 40 }} />
      </View>
      
      {loading ? <Text style={styles.loadingText}>جاري التحميل...</Text> :
        <ScrollView>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>التحديات اليومية</Text>
            <FlatList
              data={dailyChallenges}
              renderItem={renderChallenge}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>التحديات الأسبوعية</Text>
            <FlatList
              data={weeklyChallenges}
              renderItem={renderChallenge}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  loadingText: { textAlign: 'center', marginTop: 20, fontFamily: 'Inter_500Medium' },
  section: { margin: 15 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'right', marginBottom: 15, fontFamily: 'Inter_700Bold' },
  challengeCard: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#f0f0f0' },
  completedCard: { backgroundColor: '#f0fff4', borderColor: '#28a745' },
  challengeIcon: { marginRight: 15 },
  challengeInfo: { flex: 1 },
  challengeName: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'right', fontFamily: 'Inter_600SemiBold' },
  challengeDesc: { fontSize: 14, color: '#666', textAlign: 'right', marginTop: 4, fontFamily: 'Inter_400Regular' },
  rewardInfo: { flexDirection: 'row', alignItems: 'center', marginLeft: 10, gap: 5 },
  rewardPoints: { fontSize: 16, fontWeight: 'bold', color: '#FFA500', fontFamily: 'Inter_700Bold' },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20, fontFamily: 'Inter_700Bold' },
  authSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10, marginBottom: 30, fontFamily: 'Inter_400Regular' },
  authButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  authButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
});
