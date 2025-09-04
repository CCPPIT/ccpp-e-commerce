import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Award, Crown } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase, Database } from '../lib/supabase';

type LeaderboardUser = Pick<Database['public']['Tables']['profiles']['Row'], 'full_name' | 'avatar_url' | 'loyalty_points'>;

export default function LeaderboardScreen() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, loyalty_points')
        .order('loyalty_points', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setUsers(data as LeaderboardUser[]);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      Alert.alert('خطأ', 'لا يمكن تحميل لوحة الصدارة');
    } finally {
      setLoading(false);
    }
  };

  const getRankColor = (rank: number) => {
    if (rank === 0) return '#FFD700'; // Gold
    if (rank === 1) return '#C0C0C0'; // Silver
    if (rank === 2) return '#CD7F32'; // Bronze
    return '#ccc';
  };

  const renderUserItem = ({ item, index }: { item: LeaderboardUser, index: number }) => (
    <View style={styles.userRow}>
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsText}>{item.loyalty_points}</Text>
        <Award size={16} color="#FFA500" />
      </View>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name}</Text>
      </View>
      <Image source={{ uri: item.avatar_url || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/50x50.png' }} style={styles.avatar} />
      <View style={[styles.rankContainer, { borderColor: getRankColor(index) }]}>
        {index < 3 ? <Crown size={16} color={getRankColor(index)} fill={getRankColor(index)} /> : <Text style={styles.rankText}>{index + 1}</Text>}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><ArrowLeft size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>لوحة الصدارة</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? <Text style={styles.loadingText}>جاري التحميل...</Text> :
        <FlatList
          data={users}
          renderItem={renderUserItem}
          keyExtractor={(item, index) => `${item.full_name}-${index}`}
          contentContainerStyle={styles.listContainer}
        />
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
  listContainer: { padding: 15 },
  userRow: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'white', borderRadius: 12, padding: 15, marginBottom: 10 },
  rankContainer: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderRadius: 20, marginRight: 15 },
  rankText: { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 15 },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'right', fontFamily: 'Inter_600SemiBold' },
  pointsContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  pointsText: { fontSize: 16, fontWeight: 'bold', color: '#FFA500', fontFamily: 'Inter_700Bold' },
});
