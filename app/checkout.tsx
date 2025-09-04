import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';

type CartItem = {
  id: string;
  quantity: number;
  product: Database['public']['Tables']['products']['Row'];
};
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function CheckoutScreen() {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [placingOrder, setPlacingOrder] = useState(false);

  // Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    } else {
      router.replace('/auth/login');
    }
  }, [user]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
    }
  }, [profile]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load cart items
      const { data: cartData, error: cartError } = await supabase
        .from('cart_items')
        .select('id, quantity, product:products(*)')
        .eq('user_id', user.id);
      if (cartError) throw cartError;
      setCartItems(cartData || []);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (profileError && profileError.code !== 'PGRST116') throw profileError;
      setProfile(profileData);

      // Calculate total
      const totalAmount = (cartData || []).reduce((sum, item) => {
        const price = item.product.sale_price || item.product.price;
        return sum + price * item.quantity;
      }, 0);
      setTotal(totalAmount);
    } catch (error) {
      console.error('Error loading checkout data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!fullName || !phone || !address || !city) {
      Alert.alert('خطأ', 'يرجى ملء جميع حقول الشحن');
      return;
    }
    if (!user) return;

    setPlacingOrder(true);
    try {
      const shippingAddress = { fullName, phone, address, city };

      // 1. Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          total_amount: total,
          shipping_address: shippingAddress,
          status: 'pending',
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      const orderId = orderData.id;

      // 2. Create order items
      const orderItems = cartItems.map(item => ({
        order_id: orderId,
        product_id: item.product.id,
        quantity: item.quantity,
        price: item.product.sale_price || item.product.price,
      }));
      const { error: orderItemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (orderItemsError) throw orderItemsError;

      // 3. Clear cart
      const cartItemIds = cartItems.map(item => item.id);
      await supabase.from('cart_items').delete().in('id', cartItemIds);

      Alert.alert('تم الطلب بنجاح', 'شكراً لك! تم استلام طلبك.', [
        { text: 'موافق', onPress: () => router.replace('/orders') },
      ]);
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إتمام الطلب');
    } finally {
      setPlacingOrder(false);
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
        <Text style={styles.headerTitle}>إتمام الشراء</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ملخص الطلب</Text>
          {cartItems.map(item => (
            <View key={item.id} style={styles.summaryItem}>
              <Text style={styles.itemQuantity}>{item.quantity}x</Text>
              <Text style={styles.itemName}>{item.product.name_ar}</Text>
              <Text style={styles.itemPrice}>
                ${((item.product.sale_price || item.product.price) * item.quantity).toFixed(2)}
              </Text>
            </View>
          ))}
          <View style={styles.totalSummary}>
            <Text style={styles.totalLabel}>المجموع</Text>
            <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>عنوان الشحن</Text>
          <TextInput style={styles.input} placeholder="الاسم الكامل" value={fullName} onChangeText={setFullName} textAlign="right" />
          <TextInput style={styles.input} placeholder="رقم الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" textAlign="right" />
          <TextInput style={styles.input} placeholder="العنوان بالتفصيل" value={address} onChangeText={setAddress} textAlign="right" />
          <TextInput style={styles.input} placeholder="المدينة" value={city} onChangeText={setCity} textAlign="right" />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.placeOrderButton, placingOrder && styles.disabledButton]}
          onPress={handlePlaceOrder}
          disabled={placingOrder}
        >
          <Text style={styles.placeOrderText}>
            {placingOrder ? 'جاري إتمام الطلب...' : `تأكيد الطلب ($${total.toFixed(2)})`}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: { flex: 1, padding: 15 },
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
  summaryItem: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  itemName: { flex: 1, fontSize: 16, color: '#666', textAlign: 'right', fontFamily: 'Inter_500Medium' },
  itemQuantity: { fontSize: 16, color: '#333', fontFamily: 'Inter_600SemiBold', marginLeft: 10 },
  itemPrice: { fontSize: 16, color: '#333', fontFamily: 'Inter_600SemiBold' },
  totalSummary: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: { fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  totalAmount: { fontSize: 18, fontWeight: 'bold', color: '#4ECDC4', fontFamily: 'Inter_700Bold' },
  input: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    fontFamily: 'Inter_400Regular',
  },
  footer: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  placeOrderButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: { backgroundColor: '#ccc' },
  placeOrderText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
});
