import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, Frown } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/supabase';
import useAppStore from '../../stores/useAppStore';
import { MotiView, MotiPressable } from 'moti';

const { width } = Dimensions.get('window');
const PRODUCT_CARD_WIDTH = (width - 45) / 2;

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function CategoryScreen() {
  const { id: categoryId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const favorites = useAppStore(state => state.favorites);
  const toggleFavorite = useAppStore(state => state.toggleFavorite);

  const loadData = useCallback(async () => {
    if (!categoryId) return;
    setLoading(true);
    try {
      const [categoryRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('id', categoryId).single(),
        supabase.from('products').select('*').eq('category_id', categoryId).eq('is_active', true)
      ]);

      if (categoryRes.error) throw categoryRes.error;
      setCategory(categoryRes.data);

      if (productsRes.error) throw productsRes.error;
      setProducts(productsRes.data);

    } catch (error) {
      console.error('Error loading category data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل بيانات الفئة');
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useFocusEffect(loadData);

  const renderProduct = ({ item, index }: { item: Product, index: number }) => {
    const isFavorite = favorites.some(fav => fav.product.id === item.id);
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: index * 100 }}
      >
        <TouchableOpacity 
          style={styles.productCard}
          onPress={() => router.push(`/product/${item.id}`)}
        >
          <Image
            source={{ uri: item.image_urls[0] || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/300x300.png' }}
            style={styles.productImage}
          />
          <MotiPressable 
            style={styles.favoriteButton}
            onPress={() => user ? toggleFavorite(item, user.id) : router.push('/auth/login')}
            animate={({ pressed }) => {
              'worklet'
              return { scale: pressed ? 1.2 : 1 }
            }}
          >
            <Heart 
              size={18} 
              color={isFavorite ? "#ff4757" : "#ccc"} 
              fill={isFavorite ? "#ff4757" : "none"} 
            />
          </MotiPressable>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{item.name_ar}</Text>
            <View style={styles.priceContainer}>
              {item.sale_price && (
                <Text style={styles.originalPrice}>${item.price.toFixed(2)}</Text>
              )}
              <Text style={styles.currentPrice}>
                ${(item.sale_price || item.price).toFixed(2)}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </MotiView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><Text>جاري التحميل...</Text></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category?.name_ar || 'الفئة'}</Text>
        <View style={{ width: 40 }} />
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Frown size={80} color="#ccc" />
          <Text style={styles.emptyText}>لا توجد منتجات في هذه الفئة حالياً</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsList}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  productsList: {
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  row: {
    justifyContent: 'space-between',
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 15,
    width: PRODUCT_CARD_WIDTH,
  },
  productImage: {
    width: '100%',
    height: 180,
  },
  favoriteButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 20,
    padding: 8,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    textAlign: 'right',
    fontFamily: 'Inter_600SemiBold',
    height: 40,
  },
  priceContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
  },
  currentPrice: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    fontFamily: 'Inter_500Medium',
  },
});
