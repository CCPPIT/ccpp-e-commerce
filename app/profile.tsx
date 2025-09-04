import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  User, 
  Settings, 
  ShoppingBag, 
  Heart, 
  LogOut,
  Edit3,
  Award,
  ShieldCheck,
  Star,
  Zap,
  Trophy,
} from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Database } from '../lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Badge = Database['public']['Tables']['badges']['Row'];
type UserBadge = {
  badge: Badge;
};

const iconMap: { [key: string]: React.ElementType } = {
  'first-purchase': ShoppingBag,
  'first-review': Star,
  'power-user': Zap,
  'default': ShieldCheck,
};

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setProfile(null);
      return;
    }

    try {
      setLoading(true);
      const [profileRes, badgesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('user_badges').select('badge:badges(*)').eq('user_id', user.id)
      ]);

      if (profileRes.error && profileRes.error.code !== 'PGRST116') throw profileRes.error;
      setProfile(profileRes.data);
      
      if (badgesRes.error) throw badgesRes.error;
      setBadges(badgesRes.data as any);

    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadProfileData();
    }, [loadProfileData])
  );

  const handleSignOut = async () => {
    Alert.alert('تسجيل الخروج', 'هل أنت متأكد؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'تسجيل الخروج', style: 'destructive', onPress: async () => { await signOut(); router.replace('/(tabs)/home'); } },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><Text style={styles.loadingText}>جاري التحميل...</Text></View>
      </SafeAreaView>
    );
  }

  if (!user || !profile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.authContainer}>
          <User size={80} color="#ccc" />
          <Text style={styles.authTitle}>انضم إلينا!</Text>
          <Text style={styles.authSubtitle}>سجل الدخول لعرض ملفك الشخصي ومتابعة طلباتك.</Text>
          <TouchableOpacity style={styles.authButton} onPress={() => router.push('/auth/login')}>
            <Text style={styles.authButtonText}>تسجيل الدخول أو إنشاء حساب</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const menuItems = [
    { title: 'طلباتي', icon: ShoppingBag, onPress: () => router.push('/orders'), color: '#4ECDC4' },
    { title: 'المفضلة', icon: Heart, onPress: () => router.push('/favorites'), color: '#ff4757' },
    { title: 'التحديات', icon: Trophy, onPress: () => router.push('/challenges'), color: '#FFA500' },
    { title: 'الإعدادات', icon: Settings, onPress: () => {}, color: '#666' },
    { title: 'تسجيل الخروج', icon: LogOut, onPress: handleSignOut, color: '#ff4757' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الملف الشخصي</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push('/profile/edit')}><Edit3 size={20} color="#4ECDC4" /></TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}><User size={40} color="#666" /></View>
            )}
          </View>
          <Text style={styles.userName}>{profile?.full_name || 'مستخدم جديد'}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
        </View>

        <LinearGradient colors={['#4ECDC4', '#44A08D']} style={styles.loyaltyCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <View style={styles.loyaltyContent}>
            <Text style={styles.loyaltyPoints}>{profile?.loyalty_points || 0}</Text>
            <Text style={styles.loyaltyTitle}>نقاط الولاء</Text>
          </View>
          <Award size={40} color="rgba(255,255,255,0.5)" />
        </LinearGradient>

        {badges.length > 0 && (
          <View style={styles.badgesSection}>
            <Text style={styles.sectionTitle}>شارات الإنجاز</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesContainer}>
              {badges.map(({ badge }) => {
                const IconComponent = iconMap[badge.icon_name] || iconMap.default;
                return (
                  <View key={badge.id} style={styles.badgeItem}>
                    <View style={styles.badgeIconContainer}>
                      <IconComponent size={24} color="#4ECDC4" />
                    </View>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.onPress}>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuItemTitle}>{item.title}</Text>
                <item.icon size={20} color={item.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', fontFamily: 'Inter_500Medium' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  editButton: { padding: 8 },
  profileSection: { backgroundColor: 'white', alignItems: 'center', paddingTop: 30, paddingBottom: 20 },
  avatarContainer: { marginBottom: 15 },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#333', marginBottom: 5, fontFamily: 'Inter_700Bold' },
  userEmail: { fontSize: 16, color: '#666', fontFamily: 'Inter_400Regular' },
  loyaltyCard: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 15, borderRadius: 12, padding: 20, marginBottom: 20 },
  loyaltyContent: { alignItems: 'flex-end' },
  loyaltyTitle: { fontSize: 16, color: 'white', fontFamily: 'Inter_500Medium' },
  loyaltyPoints: { fontSize: 32, color: 'white', fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  badgesSection: { backgroundColor: 'white', marginHorizontal: 15, borderRadius: 12, padding: 15, marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'right', marginBottom: 15, fontFamily: 'Inter_700Bold' },
  badgesContainer: { flexDirection: 'row-reverse' },
  badgeItem: { alignItems: 'center', marginLeft: 15 },
  badgeIconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e8f8f7', justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  badgeName: { fontSize: 12, color: '#666', fontFamily: 'Inter_500Medium' },
  menuSection: { backgroundColor: 'white', marginHorizontal: 15, borderRadius: 12, paddingVertical: 5, marginBottom: 20 },
  menuItem: { paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f8f9fa' },
  menuItemContent: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  menuItemTitle: { fontSize: 16, color: '#333', fontFamily: 'Inter_600SemiBold' },
  authContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  authTitle: { fontSize: 24, fontWeight: 'bold', color: '#333', marginTop: 20, fontFamily: 'Inter_700Bold' },
  authSubtitle: { fontSize: 16, color: '#666', textAlign: 'center', marginTop: 10, marginBottom: 30, fontFamily: 'Inter_400Regular' },
  authButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 30, paddingVertical: 15, borderRadius: 25 },
  authButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
});
