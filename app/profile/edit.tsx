import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export default function EditProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    } else {
      router.replace('/auth/login');
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      setProfile(data);
      setFullName(data?.full_name || '');
      setPhone(data?.phone || '');
      setAddress(data?.address || '');
      setCity(data?.city || '');
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone,
          address,
          city,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      Alert.alert('تم التحديث', 'تم تحديث ملفك الشخصي بنجاح', [
        { text: 'موافق', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الملف الشخصي');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><Text>جاري التحميل...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>الاسم الكامل</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName} textAlign="right" />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>رقم الهاتف</Text>
          <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>العنوان</Text>
          <TextInput style={styles.input} value={address} onChangeText={setAddress} textAlign="right" />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>المدينة</Text>
          <TextInput style={styles.input} value={city} onChangeText={setCity} textAlign="right" />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, updating && styles.disabledButton]}
          onPress={handleUpdateProfile}
          disabled={updating}
        >
          <Text style={styles.saveButtonText}>
            {updating ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  placeholder: { width: 40 },
  content: { padding: 20 },
  inputContainer: { marginBottom: 20 },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: 'Inter_400Regular',
  },
  saveButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: { backgroundColor: '#ccc' },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
});
