import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Database, Json } from '../../lib/supabase';
import { format } from 'date-fns';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderItem = Database['public']['Tables']['order_items']['Row'] & {
  product: Database['public']['Tables']['products']['Row'];
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && id) {
      loadOrderDetails();
    } else if (!user) {
      router.replace('/auth/login');
    }
  }, [user, id]);

  const loadOrderDetails = async () => {
    try {
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .eq('user_id', user!.id)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, product:products(*)')
        .eq('order_id', id);
      
      if (itemsError) throw itemsError;
      setOrderItems(itemsData as any);
    } catch (error) {
      console.error('Error loading order details:', error);
      Alert.alert('خطأ', 'لم يتم العثور على الطلب');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <SafeAreaView style={styles.container}><Text style={styles.loadingText}>جاري التحميل...</Text></SafeAreaView>;
  }

  if (!order) {
    return <SafeAreaView style={styles.container}><Text style={styles.loadingText}>لم يتم العثور على الطلب</Text></SafeAreaView>;
  }

  const shippingAddress = order.shipping_address as { [key: string]: string };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تفاصيل الطلب</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخص الطلب</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>#{order.id.substring(0, 8)}</Text>
            <Text style={styles.detailLabel}>رقم الطلب</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{format(new Date(order.created_at), 'yyyy/MM/dd')}</Text>
            <Text style={styles.detailLabel}>تاريخ الطلب</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailValue}>{order.status}</Text>
            <Text style={styles.detailLabel}>حالة الطلب</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detailValue, { color: '#4ECDC4' }]}>${order.total_amount.toFixed(2)}</Text>
            <Text style={styles.detailLabel}>المجموع الكلي</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>المنتجات</Text>
          {orderItems.map(item => (
            <View key={item.id} style={styles.productItem}>
              <Image source={{ uri: item.product.image_urls[0] }} style={styles.productImage} />
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{item.product.name_ar}</Text>
                <Text style={styles.productDetails}>{item.quantity} x ${item.price.toFixed(2)}</Text>
              </View>
              <Text style={styles.productTotal}>${(item.quantity * item.price).toFixed(2)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عنوان الشحن</Text>
          <Text style={styles.addressText}>{shippingAddress?.fullName}</Text>
          <Text style={styles.addressText}>{shippingAddress?.phone}</Text>
          <Text style={styles.addressText}>{shippingAddress?.address}, {shippingAddress?.city}</Text>
        </View>
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
  loadingText: { textAlign: 'center', marginTop: 20, fontSize: 16, color: '#666' },
  content: { padding: 15 },
  section: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'right',
    fontFamily: 'Inter_700Bold',
  },
  detailRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabel: { fontSize: 16, color: '#666', fontFamily: 'Inter_500Medium' },
  detailValue: { fontSize: 16, color: '#333', fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  productImage: { width: 50, height: 50, borderRadius: 8, marginRight: 15 },
  productInfo: { flex: 1, alignItems: 'flex-end' },
  productName: { fontSize: 16, color: '#333', textAlign: 'right', fontFamily: 'Inter_600SemiBold' },
  productDetails: { fontSize: 14, color: '#666', textAlign: 'right', fontFamily: 'Inter_400Regular' },
  productTotal: { fontSize: 16, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  addressText: { fontSize: 16, color: '#333', textAlign: 'right', lineHeight: 24, fontFamily: 'Inter_400Regular' },
});
