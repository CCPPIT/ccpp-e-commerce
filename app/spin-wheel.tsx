import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Gift } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const segments = [
  { prize: '10 نقاط', value: 10, color: '#4ECDC4' },
  { prize: 'حظ أوفر', value: 0, color: '#f1f2f6' },
  { prize: '50 نقطة', value: 50, color: '#FFA500' },
  { prize: '5 نقاط', value: 5, color: '#4ECDC4' },
  { prize: '20 نقطة', value: 20, color: '#ff4757' },
  { prize: 'حظ أوفر', value: 0, color: '#f1f2f6' },
  { prize: '100 نقطة', value: 100, color: '#8B5CF6' },
  { prize: '15 نقطة', value: 15, color: '#4ECDC4' },
];

const WHEEL_SIZE = 300;
const SEGMENT_ANGLE = 360 / segments.length;

export default function SpinWheelScreen() {
  const { user } = useAuth();
  const spinValue = useRef(new Animated.Value(0)).current;
  const [spinning, setSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSpinStatus();
  }, []);

  const checkSpinStatus = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from('user_spins')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      setCanSpin(!data);
    } catch (err) {
      console.error("Error checking spin status:", err);
      setCanSpin(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSpin = () => {
    if (spinning || !canSpin || !user) return;
    
    setSpinning(true);
    const randomSpins = Math.floor(Math.random() * 5) + 5;
    const randomSegment = Math.floor(Math.random() * segments.length);
    const finalAngle = (randomSpins * 360) + (randomSegment * SEGMENT_ANGLE);

    spinValue.setValue(0);

    Animated.timing(spinValue, {
      toValue: finalAngle,
      duration: 4000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      const prizeSegment = segments[(segments.length - 1 - randomSegment + (segments.length / 2)) % segments.length];
      
      Alert.alert('تهانينا!', `لقد فزت بـ ${prizeSegment.prize}!`);
      
      try {
        if (prizeSegment.value > 0) {
          await supabase.rpc('add_loyalty_points', {
            p_user_id: user.id,
            points_to_add: prizeSegment.value,
          });
        }
        await supabase.from('user_spins').insert({ user_id: user.id });
      } catch (err) {
        console.error("Error updating points/spin status:", err);
      }
      
      setSpinning(false);
      setCanSpin(false);
    });
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 360],
    outputRange: ['0deg', '360deg'],
  });

  if (loading) {
    return <SafeAreaView style={styles.container}><Text>جاري التحميل...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><X size={30} color="#333" /></TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Gift size={60} color="#FFA500" />
        <Text style={styles.title}>عجلة الحظ اليومية</Text>
        <Text style={styles.subtitle}>
          {canSpin ? 'جرّب حظك واربح نقاط ولاء!' : 'لقد استخدمت فرصتك لهذا اليوم. عد غداً!'}
        </Text>

        <View style={styles.wheelContainer}>
          <Animated.View style={[styles.wheel, { transform: [{ rotate: spin }] }]}>
            {segments.map((segment, index) => (
              <View
                key={index}
                style={[
                  styles.segment,
                  {
                    transform: [{ rotate: `${index * SEGMENT_ANGLE}deg` }, { skewY: `${90 - SEGMENT_ANGLE}deg` }],
                    backgroundColor: segment.color,
                  },
                ]}
              >
                <Text style={styles.segmentText}>{segment.prize}</Text>
              </View>
            ))}
          </Animated.View>
          <View style={styles.pointer} />
        </View>

        <TouchableOpacity
          style={[styles.spinButton, (!canSpin || spinning) && styles.disabledButton]}
          onPress={handleSpin}
          disabled={!canSpin || spinning}
        >
          <Text style={styles.spinButtonText}>{spinning ? '...' : 'أدر العجلة'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 20, alignItems: 'flex-start' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', fontFamily: 'Inter_700Bold', color: '#333', marginTop: 15 },
  subtitle: { fontSize: 16, color: '#666', fontFamily: 'Inter_500Medium', marginBottom: 40, textAlign: 'center' },
  wheelContainer: { width: WHEEL_SIZE, height: WHEEL_SIZE, justifyContent: 'center', alignItems: 'center', position: 'relative', marginBottom: 50 },
  wheel: { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_SIZE / 2, overflow: 'hidden' },
  segment: {
    position: 'absolute',
    width: WHEEL_SIZE / 2,
    height: WHEEL_SIZE / 2,
    originX: WHEEL_SIZE / 2,
    originY: WHEEL_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  segmentText: {
    transform: [{ skewY: `-${90 - SEGMENT_ANGLE}deg` }, { rotate: `${SEGMENT_ANGLE / 2}deg` }],
    color: '#333',
    fontWeight: 'bold',
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    position: 'absolute',
    right: -WHEEL_SIZE / 4,
    paddingRight: 10,
  },
  pointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 30,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#333',
    position: 'absolute',
    top: -15,
    zIndex: 1,
  },
  spinButton: { backgroundColor: '#4ECDC4', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5 },
  spinButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  disabledButton: { backgroundColor: '#ccc' },
});
