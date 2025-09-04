import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import useAppStore from '../stores/useAppStore';

export default function CartScreen() {
  const { user } = useAuth();
  const { 
    cartItems, 
    total, 
    isCartLoading, 
    updateQuantity, 
    removeFromCart,
    loadInitialData,
  } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadInitialData(user.id);
      }
    }, [user])
  );

  const renderCartItem = ({ item }: { item: typeof cartItems[0] }) => {
    const price = item.product.sale_price || item.product.price;
    const itemTotal = price * item.quantity;

    return (
      <View style={styles.cartItem}>
        <View style={styles.itemRight}>
          <View style={styles.quantityControls}>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus size={16} color="#4ECDC4" />
            </TouchableOpacity>
            <Text style={styles.quantity}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.quantityButton}
              onPress={() => updateQuantity(item.id, item.quantity - 1)}
            >
              <Minus size={16} color="#4ECDC4" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => removeFromCart(item.id)}
          >
            <Trash2 size={20} color="#ff4757" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.product.name_ar}</Text>
          <View style={styles.priceContainer}>
            {item.product.sale_price && (
              <Text style={styles.originalPrice}>${item.product.price.toFixed(2)}</Text>
            )}
            <Text style={styles.itemPrice}>${price.toFixed(2)}</Text>
          </View>
          <Text style={styles.itemTotal}>المجموع: ${itemTotal.toFixed(2)}</Text>
        </View>
        
        <Image
          source={{ 
            uri: item.product.image_urls[0] || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/80x80.png' 
          }}
          style={styles.itemImage}
        />
      </View>
    );
  };

  const EmptyOrLoggedOutView = () => (
    <View style={styles.emptyCart}>
      <ShoppingBag size={80} color="#ccc" />
      <Text style={styles.emptyCartTitle}>{user ? 'سلة التسوق فارغة' : 'يرجى تسجيل الدخول'}</Text>
      <Text style={styles.emptyCartSubtitle}>{user ? 'أضف منتجات لتبدأ التسوق' : 'سجل الدخول لعرض سلة التسوق الخاصة بك'}</Text>
      <TouchableOpacity 
        style={styles.shopButton}
        onPress={() => router.push(user ? '/(tabs)/' : '/auth/login')}
      >
        <Text style={styles.shopButtonText}>{user ? 'تسوق الآن' : 'تسجيل الدخول'}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>سلة التسوق ({cartItems.length})</Text>
      </View>

      {isCartLoading ? <Text>جاري التحميل...</Text> : (
        !user || cartItems.length === 0 ? (
          <EmptyOrLoggedOutView />
        ) : (
          <>
            <FlatList
              data={cartItems}
              renderItem={renderCartItem}
              keyExtractor={(item) => item.id}
              style={styles.cartList}
              showsVerticalScrollIndicator={false}
            />
            
            {/* Checkout Section */}
            <View style={styles.checkoutSection}>
              <View style={styles.totalContainer}>
                <Text style={styles.totalLabel}>المجموع الكلي:</Text>
                <Text style={styles.totalAmount}>${total.toFixed(2)}</Text>
              </View>
              <TouchableOpacity 
                style={styles.checkoutButton}
                onPress={() => router.push('/checkout')}
              >
                <Text style={styles.checkoutButtonText}>إتمام الشراء</Text>
              </TouchableOpacity>
            </View>
          </>
        )
      )}
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Inter_700Bold',
  },
  cartList: {
    flex: 1,
    paddingHorizontal: 15,
  },
  cartItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 15,
    marginVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  itemInfo: {
    flex: 1,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    textAlign: 'right',
    marginBottom: 5,
    fontFamily: 'Inter_600SemiBold',
  },
  priceContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4ECDC4',
    fontFamily: 'Inter_700Bold',
  },
  originalPrice: {
    fontSize: 14,
    color: '#999',
    textDecorationLine: 'line-through',
    marginLeft: 8,
    fontFamily: 'Inter_400Regular',
  },
  itemTotal: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    fontFamily: 'Inter_500Medium',
  },
  itemRight: {
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    paddingHorizontal: 5,
  },
  quantityButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 10,
    fontFamily: 'Inter_700Bold',
  },
  removeButton: {
    padding: 8,
    marginTop: 10,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyCartTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'Inter_700Bold',
  },
  emptyCartSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    fontFamily: 'Inter_400Regular',
  },
  shopButton: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  shopButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
  checkoutSection: {
    backgroundColor: 'white',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    fontFamily: 'Inter_600SemiBold',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4ECDC4',
    fontFamily: 'Inter_700Bold',
  },
  checkoutButton: {
    backgroundColor: '#4ECDC4',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  checkoutButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter_700Bold',
  },
});
