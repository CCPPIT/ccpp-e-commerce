import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Database, Check } from 'lucide-react-native';
import { router } from 'expo-router';
import { seedData } from '../scripts/seed-data';

export default function SeedDataScreen() {
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);

  const handleSeedData = async () => {
    setLoading(true);
    try {
      const result = await seedData();
      
      if (result.success) {
        setCompleted(true);
        Alert.alert(
          'نجح التحديث',
          'تم إضافة البيانات التجريبية بنجاح! يمكنك الآن استخدام التطبيق.',
          [
            {
              text: 'موافق',
              onPress: () => router.replace('/'),
            },
          ]
        );
      } else {
        Alert.alert('خطأ', 'حدث خطأ أثناء إضافة البيانات');
      }
    } catch (error) {
      Alert.alert('خطأ', 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إعداد البيانات</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          {completed ? (
            <Check size={80} color="#4ECDC4" />
          ) : (
            <Database size={80} color="#4ECDC4" />
          )}
        </View>

        <Text style={styles.title}>
          {completed ? 'تم الإعداد بنجاح!' : 'إعداد البيانات التجريبية'}
        </Text>

        <Text style={styles.description}>
          {completed
            ? 'تم إضافة البيانات التجريبية بنجاح. يمكنك الآن استخدام التطبيق بشكل كامل.'
            : 'لتجربة التطبيق بشكل كامل، نحتاج لإضافة بعض البيانات التجريبية مثل المنتجات والفئات.'
          }
        </Text>

        {!completed && (
          <TouchableOpacity
            style={[styles.seedButton, loading && styles.seedButtonDisabled]}
            onPress={handleSeedData}
            disabled={loading || completed}
          >
            <Text style={styles.seedButtonText}>
              {loading ? 'جاري الإعداد...' : 'إضافة البيانات التجريبية'}
            </Text>
          </TouchableOpacity>
        )}

        {completed && (
          <TouchableOpacity
            style={styles.continueButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.continueButtonText}>الذهاب للصفحة الرئيسية</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Inter_700Bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
    fontFamily: 'Inter_700Bold',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    fontFamily: 'Inter_400Regular',
  },
  seedButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    minWidth: 250,
    alignItems: 'center',
  },
  seedButtonDisabled: {
    backgroundColor: '#b0b0b0',
  },
  seedButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
  continueButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 30,
    minWidth: 250,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
});
