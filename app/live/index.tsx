import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Tv } from 'lucide-react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const mockLiveStreams = [
  {
    id: '1',
    title: 'إطلاق تشكيلة الصيف الجديدة',
    host: 'متجر الأزياء',
    thumbnail: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=500&q=80',
    viewers: 1200,
  },
  {
    id: '2',
    title: 'عرض حي لأحدث الإلكترونيات',
    host: 'تك زون',
    thumbnail: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=500&q=80',
    viewers: 850,
  },
  {
    id: '3',
    title: 'جلسة تنسيق ديكور المنزل',
    host: 'بيت الأناقة',
    thumbnail: 'https://images.unsplash.com/photo-1618220179428-22790b461013?w=500&q=80',
    viewers: 450,
  },
];

export default function LiveShoppingScreen() {
  const renderStreamItem = ({ item }: { item: (typeof mockLiveStreams)[0] }) => (
    <TouchableOpacity style={styles.streamCard} onPress={() => router.push(`/live/${item.id}`)}>
      <ImageBackground source={{ uri: item.thumbnail }} style={styles.thumbnail} imageStyle={{ borderRadius: 12 }}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.gradient}
        >
          <View style={styles.liveBadge}>
            <Text style={styles.liveText}>مباشر</Text>
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.streamTitle} numberOfLines={2}>{item.title}</Text>
            <Text style={styles.hostName}>{item.host}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><ArrowLeft size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>البث المباشر للتسوق</Text>
        <View style={{ width: 40 }} />
      </View>
      <FlatList
        data={mockLiveStreams}
        renderItem={renderStreamItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListHeaderComponent={() => (
          <View style={styles.listHeader}>
            <Tv size={40} color="#4ECDC4" />
            <Text style={styles.listHeaderText}>اكتشف عروض حية وحصرية</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  listContainer: { padding: 15 },
  listHeader: { alignItems: 'center', marginBottom: 20, paddingVertical: 10 },
  listHeaderText: { fontSize: 20, fontWeight: '600', color: '#666', marginTop: 10, fontFamily: 'Inter_600SemiBold' },
  streamCard: { height: 250, marginBottom: 15, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 5 },
  thumbnail: { flex: 1, justifyContent: 'flex-end' },
  gradient: { flex: 1, borderRadius: 12, justifyContent: 'space-between', padding: 15 },
  liveBadge: { backgroundColor: '#ff4757', borderRadius: 5, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start' },
  liveText: { color: 'white', fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  cardInfo: {},
  streamTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', fontFamily: 'Inter_700Bold', textAlign: 'right' },
  hostName: { fontSize: 14, color: '#eee', fontFamily: 'Inter_500Medium', textAlign: 'right', marginTop: 5 },
});
