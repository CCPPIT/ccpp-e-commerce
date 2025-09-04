import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Menu, Tag, Heart, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/supabase';
import useAppStore from '../../stores/useAppStore';
import CartIconWithBadge from '../../components/CartIconWithBadge';
import { MotiView, MotiPressable } from 'moti';

const { width } = Dimensions.get('window');

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

export default function HomeScreen() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const favorites = useAppStore(state => state.favorites);
  const toggleFavorite = useAppStore(state => state.toggleFavorite);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, productsRes] = await Promise.all([
        supabase.from('categories').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('products').select('*').eq('is_active', true).eq('is_featured', true).order('created_at', { ascending: false }).limit(10)
      ]);

      if (categoriesRes.data) setCategories(categoriesRes.data);
      if (productsRes.data) setProducts(productsRes.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommended = async () => {
    if (!user) {
      setRecommendedProducts([]);
      return;
    }
    try {
      const { data } = await supabase.rpc('get_recommended_products', { p_user_id: user.id });
      if (data) {
        setRecommendedProducts(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecommended();
    }, [user])
  );

  const renderProduct = ({ item, index, isRecommendation }: { item: Product, index: number, isRecommendation?: boolean }) => {
    const isFavorite = favorites.some(fav => fav.product.id === item.id);
    return (
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 500, delay: index * 100 }}
      >
        <TouchableOpacity 
          style={[styles.productCard, isRecommendation && styles.recommendedProductCard]}
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
              size={20} 
              color={isFavorite ? "#ff4757" : "#ccc"} 
              fill={isFavorite ? "#ff4757" : "none"} 
            />
          </MotiPressable>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={1}>{item.name_ar}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerIcon} onPress={() => router.push('/search')}>
          <Search size={24} color="#333" />
        </TouchableOpacity>
        
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>iN</Text>
          <View style={styles.logoSubContainer}>
            <View style={styles.lightbulb}>
              <Text style={styles.lightbulbIcon}>💡</Text>
            </View>
            <Text style={styles.logoSubText}>IDEA NEW</Text>
          </View>
        </View>
        
        <CartIconWithBadge />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Promo Banner */}
        <View style={styles.promoBanner}>
          <Text style={styles.promoText}>خصم 50% حصري على طلبك الأول!</Text>
          <Tag size={24} color="white" />
        </View>

        {/* Hero Section */}
        <LinearGradient
          colors={['#4ECDC4', '#44A08D']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <View style={styles.logoInHero}>
                <Text style={styles.heroLogoText}>iN</Text>
                <Text style={styles.heroLogoSubText}>EA NEW</Text>
              </View>
              <Text style={styles.heroMainText}>
                كل فكرة عندنا تتحول{'\n'}لتصميم يلفت الأنظار
              </Text>
            </View>
            <View style={styles.heroRight}>
              <Image
                source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=400&fit=crop&crop=face' }}
                style={styles.heroImage}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Recommended For You */}
        {user && recommendedProducts.length > 0 && (
          <View style={styles.newSection}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>عرض الكل</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>مقترح لك</Text>
            </View>
            <FlatList
              data={recommendedProducts}
              renderItem={(props) => renderProduct({...props, isRecommendation: true})}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
            />
          </View>
        )}

        {/* Shop by Category */}
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>تسوق حسب الفئة</Text>
          <View style={styles.categoryGrid}>
            {categories.map((category) => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryButton}
                onPress={() => router.push(`/category/${category.id}`)}
              >
                <Text style={styles.categoryText}>{category.name_ar}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.newSection}>
          <View style={styles.sectionHeader}>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>عرض الكل</Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>المنتجات المميزة</Text>
          </View>
          
          <FlatList
            data={products}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.productsList}
          />
        </View>
      </ScrollView>

      {/* WhatsApp FAB */}
      <TouchableOpacity style={styles.whatsappFab}>
        <MessageCircle size={28} color="white" />
      </TouchableOpacity>
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
  headerIcon: {
    padding: 8,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4ECDC4',
    fontFamily: 'Inter_700Bold',
  },
  logoSubContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -5,
  },
  lightbulb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFA500',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  lightbulbIcon: {
    fontSize: 12,
  },
  logoSubText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFA500',
    letterSpacing: 1,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    flex: 1,
  },
  promoBanner: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 15,
    marginVertical: 15,
    borderRadius: 12,
  },
  promoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
  },
  heroSection: {
    marginHorizontal: 15,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 25,
  },
  heroContent: {
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    paddingRight: 20,
  },
  logoInHero: {
    marginBottom: 10,
  },
  heroLogoText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'Inter_700Bold',
  },
  heroLogoSubText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginTop: -5,
    fontFamily: 'Inter_600SemiBold',
  },
  heroMainText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'right',
    lineHeight: 32,
    fontFamily: 'Inter_700Bold',
  },
  heroRight: {
    width: 120,
    height: 150,
  },
  heroImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  categorySection: {
    paddingHorizontal: 15,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
    fontFamily: 'Inter_700Bold',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  categoryButton: {
    width: '48%',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  newSection: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#4ECDC4',
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  productsList: {
    paddingHorizontal: 15,
  },
  productCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginRight: 15,
    width: 200,
  },
  recommendedProductCard: {
    width: 160,
  },
  productImage: {
    width: '100%',
    height: 150,
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
  whatsappFab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
