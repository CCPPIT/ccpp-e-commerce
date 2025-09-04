import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, ShoppingBag } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/supabase';
import { format } from 'date-fns';

type Order = Database['public']['Tables']['orders']['Row'];

export default function OrdersScreen() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      router.replace('/auth/login');
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error loading orders:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل الطلبات');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'delivered') return { backgroundColor: '#28a745', color: 'white' };
    if (status === 'shipped') return { backgroundColor: '#17a2b8', color: 'white' };
    if (status === 'cancelled') return { backgroundColor: '#dc3545', color: 'white' };
    return { backgroundColor: '#ffc107', color: '#333' }; // pending
  };

  const renderOrderItem = ({ item }: { item: Order }) => (
    <TouchableOpacity 
      style={styles.orderItem}
      onPress={() => router.push(`/orders/${item.id}`)}
    >
      <View style={styles.orderLeft}>
        <Text style={styles.orderTotal}>${item.total_amount.toFixed(2)}</Text>
        <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
          <Text style={[styles.statusText, { color: getStatusStyle(item.status).color }]}>
            {item.status}
          </Text>
        </View>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderId}>طلب #{item.id.substring(0, 8)}</Text>
        <Text style={styles.orderDate}>
          {format(new Date(item.created_at), 'yyyy/MM/dd')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>طلباتي</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <Text style={styles.loadingText}>جاري تحميل الطلبات...</Text>
      ) : orders.length === 0 ? (
        <View style={styles.emptyView}>
          <ShoppingBag size={80} color="#ccc" />
          <Text style={styles.emptyTitle}>لا توجد طلبات بعد</Text>
          <Text style={styles.emptySubtitle}>ابدأ التسوق لترى طلباتك هنا</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  emptyView: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyTitle: { fontSize: 22, fontWeight: 'bold', color: '#333', marginTop: 20, fontFamily: 'Inter_700Bold' },
  emptySubtitle: { fontSize: 16, color: '#666', marginTop: 10, textAlign: 'center', fontFamily: 'Inter_400Regular' },
  listContainer: { padding: 15 },
  orderItem: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLeft: { alignItems: 'flex-start' },
  orderRight: { alignItems: 'flex-end' },
  orderId: { fontSize: 16, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  orderDate: { fontSize: 14, color: '#666', marginTop: 5, fontFamily: 'Inter_400Regular' },
  orderTotal: { fontSize: 18, fontWeight: 'bold', color: '#4ECDC4', fontFamily: 'Inter_700Bold' },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 8,
  },
  statusText: { fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter_600SemiBold' },
});
