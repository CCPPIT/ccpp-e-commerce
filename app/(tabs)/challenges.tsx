import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Zap, Star, ShoppingBag, Award } from 'lucide-react-native';

const challenges = [
  { id: '1', title: 'تصفح 5 منتجات جديدة', points: 10, progress: 3, total: 5, icon: Zap },
  { id: '2', title: 'أضف تقييماً لمنتج', points: 50, progress: 0, total: 1, icon: Star },
  { id: '3', title: 'أكمل أول عملية شراء', points: 100, progress: 1, total: 1, icon: ShoppingBag, completed: true },
];

export default function ChallengesScreen() {
  const renderChallenge = (item: (typeof challenges)[0]) => (
    <View key={item.id} style={[styles.challengeCard, item.completed && styles.completedCard]}>
      <View style={styles.cardContent}>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={styles.challengeTitle}>{item.title}</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${(item.progress / item.total) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>{item.progress}/{item.total}</Text>
        </View>
        <View style={styles.iconContainer}>
          <item.icon size={24} color="#4ECDC4" />
        </View>
      </View>
      <View style={styles.rewardContainer}>
        <Text style={styles.rewardText}>{item.points} نقطة</Text>
        <Award size={16} color="#FFA500" />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>التحديات والمكافآت</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>التحديات اليومية</Text>
          {challenges.filter(c => !c.completed).map(renderChallenge)}
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الإنجازات المكتملة</Text>
          {challenges.filter(c => c.completed).map(renderChallenge)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  scrollContainer: { padding: 15 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'right', marginBottom: 10, fontFamily: 'Inter_700Bold' },
  challengeCard: { backgroundColor: 'white', borderRadius: 12, marginBottom: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#f0f0f0' },
  completedCard: { opacity: 0.6 },
  cardContent: { flexDirection: 'row-reverse', padding: 15 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e8f8f7', justifyContent: 'center', alignItems: 'center', marginLeft: 15 },
  challengeTitle: { fontSize: 16, fontWeight: '600', color: '#333', textAlign: 'right', fontFamily: 'Inter_600SemiBold' },
  progressContainer: { height: 8, backgroundColor: '#e0e0e0', borderRadius: 4, marginTop: 10, width: '100%' },
  progressBar: { height: '100%', backgroundColor: '#4ECDC4', borderRadius: 4 },
  progressText: { fontSize: 12, color: '#888', textAlign: 'right', marginTop: 5, fontFamily: 'Inter_500Medium' },
  rewardContainer: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5, backgroundColor: '#fff8e1', paddingHorizontal: 15, paddingVertical: 8 },
  rewardText: { color: '#FFA500', fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
});
