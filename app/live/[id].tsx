import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Heart, Send, ShoppingCart } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';

const mockProduct = {
  id: 'prod1',
  name: 'قميص صيفي خفيف',
  price: 29.99,
  image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500&q=80',
};

const mockComments = [
  { id: '1', user: 'نورة', text: 'ما هي الألوان المتوفرة؟' },
  { id: '2', user: 'أحمد', text: 'رائع جداً! 🔥' },
  { id: '3', user: 'فاطمة', text: 'هل يوجد خصم؟' },
  { id: '4', user: 'خالد', text: 'تم الطلب 👍' },
];

export default function LiveStreamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <View style={styles.videoPlaceholder}>
        <Text style={styles.videoText}>[مكان عرض الفيديو المباشر]</Text>
      </View>

      <SafeAreaView style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.hostInfo}>
            <Image source={{ uri: 'https://img-wrapper.vercel.app/image?url=https://randomuser.me/api/portraits/women/44.jpg' }} style={styles.hostAvatar} />
            <View>
              <Text style={styles.hostName}>متجر الأزياء</Text>
              <Text style={styles.viewers}>1.2k مشاهد</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X size={24} color="white" />
          </TouchableOpacity>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.leftPanel}>
            <TouchableOpacity style={styles.actionButton}><Heart size={28} color="white" /></TouchableOpacity>
          </View>
          <View style={styles.rightPanel}>
            <View style={styles.commentsContainer}>
              <ScrollView>
                {mockComments.map(c => (
                  <View key={c.id} style={styles.comment}>
                    <Text style={styles.commentUser}>{c.user}: </Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
            <View style={styles.productBanner}>
              <Image source={{ uri: mockProduct.image }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{mockProduct.name}</Text>
                <Text style={styles.productPrice}>${mockProduct.price}</Text>
              </View>
              <TouchableOpacity style={styles.buyButton}>
                <ShoppingCart size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.inputContainer}>
            <TextInput style={styles.input} placeholder="أضف تعليقاً..." placeholderTextColor="#999" />
            <TouchableOpacity><Send size={24} color="#fff" /></TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  videoPlaceholder: { ...StyleSheet.absoluteFillObject, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  videoText: { color: '#999', fontSize: 18, fontFamily: 'Inter_500Medium' },
  overlay: { flex: 1, justifyContent: 'space-between' },
  header: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'flex-start', padding: 15 },
  hostInfo: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  hostAvatar: { width: 32, height: 32, borderRadius: 16, marginLeft: 8 },
  hostName: { color: 'white', fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  viewers: { color: '#ccc', fontSize: 12, fontFamily: 'Inter_400Regular' },
  closeButton: { backgroundColor: 'rgba(0,0,0,0.5)', padding: 8, borderRadius: 20 },
  mainContent: { flex: 1, flexDirection: 'row', padding: 15, justifyContent: 'space-between' },
  leftPanel: { justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80 },
  actionButton: { marginBottom: 20 },
  rightPanel: { flex: 1, justifyContent: 'flex-end', marginLeft: 10 },
  commentsContainer: { height: 200, marginBottom: 15 },
  comment: { flexDirection: 'row-reverse', backgroundColor: 'rgba(0,0,0,0.3)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10, marginBottom: 5, alignSelf: 'flex-start' },
  commentUser: { color: '#4ECDC4', fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  commentText: { color: 'white', fontFamily: 'Inter_400Regular' },
  productBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, padding: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)' },
  productImage: { width: 40, height: 40, borderRadius: 8, marginRight: 10 },
  productInfo: { flex: 1 },
  productName: { color: 'white', fontWeight: 'bold', fontSize: 14, fontFamily: 'Inter_700Bold' },
  productPrice: { color: '#eee', fontSize: 12, fontFamily: 'Inter_500Medium' },
  buyButton: { backgroundColor: '#4ECDC4', padding: 10, borderRadius: 8 },
  footer: { padding: 15 },
  inputContainer: { flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 25, paddingHorizontal: 15, paddingVertical: 5 },
  input: { flex: 1, height: 40, color: 'white', textAlign: 'right', fontFamily: 'Inter_400Regular' },
});
