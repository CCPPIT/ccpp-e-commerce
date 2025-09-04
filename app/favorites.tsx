import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, ShoppingCart } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import useAppStore from '../stores/useAppStore';

export default function FavoritesScreen() {
  const { user } = useAuth();
  const { 
    favorites, 
    isFavoritesLoading, 
    toggleFavorite, 
    addToCart,
    loadInitialData,
  } = useAppStore();

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadInitialData(user.id);
      } else {
        router.replace('/auth/login');
      }
    }, [user])
  );

  const renderFavoriteItem = ({ item }: { item: typeof favorites[0] }) => {
    const price = item.product.sale_price || item.product.price;

    return (
      <TouchableOpacity 
        style={styles.favoriteItem}
        onPress={() => router.push(`/product/${item.product.id}`)}
      >
        <View style={styles.itemActions}>
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => user && addToCart(item.product, 1, user.id)}
          >
            <ShoppingCart size={20} color="#4ECDC4" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => user && toggleFavorite(item.product, user.id)}
          >
            <Heart size={20} color="#ff4757" fill="#ff4757" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.product.name_ar}</Text>
          <Text style={styles.itemDescription} numberOfLines={2}>
            {item.product.description_ar}
          </Text>
          <View style={styles.priceContainer}>
            {item.product.sale_price && (
              <Text style={styles.originalPrice}>${item.product.price.toFixed(2)}</Text>
            )}
            <Text style={styles.itemPrice}>${price.toFixed(2)}</Text>
          </View>
        </View>
        
        <Image
          source={{ 
            uri: item.product.image_urls[0] || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/100x100.png' 
          }}
          style={styles.itemImage}
        />
      </TouchableOpacity>
    );
  };

  if (!user) {
    return null;
  }

  if (isFavoritesLoading) {
    return <SafeAreaView style={styles.container}><Text>جاري التحميل...</Text></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المفضلة ({favorites.length})</Text>
        <View style={styles.placeholder} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyFavorites}>
          <Heart size={80} color="#ccc" />
          <Text style={styles.emptyFavoritesTitle}>لا توجد منتجات مفضلة</Text>
          <Text style={styles.emptyFavoritesSubtitle}>
            أضف منتجات للمفضلة لتجدها هنا
          </Text>
          <TouchableOpacity 
            style={styles.shopButton}
            onPress={() => router.replace('/(tabs)/')}
          >
            <Text style={styles.shopButtonText}>تسوق الآن</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          renderItem={renderFavoriteItem}
          keyExtractor={(item) => item.id}
          style={styles.favoritesList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
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
  favoritesList: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  favoriteItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    padding: 15,
    marginVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  itemImage: {
    width: 100,
    height: 100,
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
  itemDescription: {
    fontSize: 14,
    color: '#666',
    textAlign: 'right',
    marginBottom: 8,
    fontFamily: 'Inter_400Regular',
  },
  priceContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
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
  itemActions: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  favoriteButton: {
    padding: 8,
    backgroundColor: '#ffebee',
    borderRadius: 20,
    marginBottom: 10,
  },
  cartButton: {
    padding: 8,
    backgroundColor: '#e8f8f7',
    borderRadius: 20,
  },
  emptyFavorites: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyFavoritesTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
    fontFamily: 'Inter_700Bold',
  },
  emptyFavoritesSubtitle: {
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
});
