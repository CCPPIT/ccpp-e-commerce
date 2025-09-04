import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  FlatList,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Heart, ShoppingCart, Share, Star, MessageSquare, Edit, ThumbsUp, Send } from 'lucide-react-native';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import useAppStore from '../../stores/useAppStore';
import { MotiPressable } from 'moti/interactions';

const { width } = Dimensions.get('window');

type Product = Database['public']['Tables']['products']['Row'];
type Review = Database['public']['Tables']['product_reviews']['Row'] & {
  profile: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name' | 'avatar_url'>;
};
type QnaItem = {
  id: string;
  question: string;
  answer: string | null;
  created_at: string;
  q_author: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'>;
  a_author: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name'> | null;
  likes: { count: number }[];
  is_liked: boolean;
};


const renderStars = (rating: number) => {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Star
        key={i}
        size={16}
        color="#FFA500"
        fill={i <= rating ? '#FFA500' : 'none'}
      />
    );
  }
  return <View style={styles.starRatingContainer}>{stars}</View>;
};

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [qna, setQna] = useState<QnaItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const favorites = useAppStore(state => state.favorites);
  const storeToggleFavorite = useAppStore(state => state.toggleFavorite);
  const storeAddToCart = useAppStore(state => state.addToCart);
  const isFavorite = favorites.some(fav => fav.product.id === id);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const [productRes, reviewsRes, qnaRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', id).single(),
        supabase.from('product_reviews').select('*, profile:profiles(full_name, avatar_url)').eq('product_id', id).order('created_at', { ascending: false }),
        supabase.rpc('get_product_qna_with_details', { p_product_id: id, p_user_id: user ? user.id : null })
      ]);

      if (productRes.error) throw productRes.error;
      setProduct(productRes.data);

      if (reviewsRes.error) throw reviewsRes.error;
      setReviews(reviewsRes.data as Review[]);

      if (qnaRes.error) throw qnaRes.error;
      setQna(qnaRes.data as QnaItem[]);

    } catch (error) {
      console.error('Error loading product data:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل المنتج');
    } finally {
      setLoading(false);
    }
  }, [id, user]);

  useFocusEffect(useCallback(() => {
    loadData();
    if (user) {
      logProductView();
    }
  }, [id, user]));

  const logProductView = async () => {
    if (!user || !id) return;
    try {
      await supabase.from('user_product_views').insert({ user_id: user.id, product_id: id });
    } catch (error) {
      console.log("Couldn't log product view:", error);
    }
  };
  
  const handleAskQuestion = async () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    if (newQuestion.trim() === '') {
      Alert.alert('خطأ', 'يرجى كتابة سؤالك.');
      return;
    }
    try {
      const { error } = await supabase.from('product_qna').insert({
        product_id: id,
        user_id: user.id,
        question: newQuestion,
      });
      if (error) throw error;
      setNewQuestion('');
      Alert.alert('تم', 'تم إرسال سؤالك بنجاح.');
      loadData(); // Refresh Q&A
    } catch (error) {
      console.error('Error asking question:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال سؤالك.');
    }
  };

  const toggleQnaLike = async (qnaId: string, isLiked: boolean) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    setQna(qna.map(q => q.id === qnaId ? {
      ...q,
      is_liked: !isLiked,
      likes: [{ count: q.likes[0].count + (!isLiked ? 1 : -1) }]
    } : q));

    try {
      if (isLiked) {
        await supabase.from('qna_likes').delete().match({ qna_id: qnaId, user_id: user.id });
      } else {
        await supabase.from('qna_likes').insert({ qna_id: qnaId, user_id: user.id });
      }
    } catch (error) {
      console.error("Error toggling Q&A like:", error);
      loadData(); // Re-fetch to correct state on error
    }
  };

  const handleToggleFavorite = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    storeToggleFavorite(product!, user.id);
  };

  const handleAddToCart = () => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    storeAddToCart(product!, quantity, user.id);
  };

  if (loading || !product) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}><Text style={styles.loadingText}>جاري التحميل...</Text></View>
      </SafeAreaView>
    );
  }

  const price = product.sale_price || product.price;
  const discount = product.sale_price ? Math.round(((product.price - product.sale_price) / product.price) * 100) : 0;
  const averageRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={handleToggleFavorite}>
          <Heart size={24} color={isFavorite ? "#ff4757" : "#333"} fill={isFavorite ? "#ff4757" : "none"} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.headerButton}><Share size={24} color="#333" /></TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><ArrowLeft size={24} color="#333" /></TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.imageSection}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setCurrentImageIndex(Math.round(e.nativeEvent.contentOffset.x / width))}>
            {product.image_urls.map((url, index) => <Image key={index} source={{ uri: url || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/400x400.png' }} style={styles.productImage} resizeMode="cover" />)}
          </ScrollView>
          {product.image_urls.length > 1 && (
            <View style={styles.imageIndicators}>
              {product.image_urls.map((_, index) => <View key={index} style={[styles.indicator, index === currentImageIndex && styles.activeIndicator]} />)}
            </View>
          )}
          {discount > 0 && <View style={styles.discountBadge}><Text style={styles.discountText}>-{discount}%</Text></View>}
        </View>

        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name_ar}</Text>
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>({averageRating.toFixed(1)})</Text>
            {renderStars(averageRating)}
          </View>
          <View style={styles.priceSection}>
            <View style={styles.priceContainer}>
              {product.sale_price && <Text style={styles.originalPrice}>${product.price.toFixed(2)}</Text>}
              <Text style={styles.currentPrice}>${price.toFixed(2)}</Text>
            </View>
            <Text style={styles.stockText}>{product.stock_quantity > 0 ? `متوفر (${product.stock_quantity} قطعة)` : 'غير متوفر'}</Text>
          </View>
          <View style={styles.descriptionSection}>
            <Text style={styles.sectionTitle}>وصف المنتج</Text>
            <Text style={styles.description}>{product.description_ar || 'لا يوجد وصف متاح.'}</Text>
          </View>
          <View style={styles.quantitySection}>
            <View style={styles.quantityControls}>
              <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(Math.max(1, quantity - 1))}><Text style={styles.quantityButtonText}>-</Text></TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={() => setQuantity(quantity + 1)}><Text style={styles.quantityButtonText}>+</Text></TouchableOpacity>
            </View>
            <Text style={styles.quantityLabel}>الكمية</Text>
          </View>
          
          <View style={styles.reviewsSection}>
            <View style={styles.reviewsHeader}>
              <TouchableOpacity style={styles.addReviewButton} onPress={() => router.push(`/product/review/${id}`)}>
                <Edit size={16} color="#4ECDC4" />
                <Text style={styles.addReviewText}>أضف تقييمك</Text>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>التقييمات ({reviews.length})</Text>
            </View>
            {reviews.length > 0 ? (
              reviews.map(review => (
                <View key={review.id} style={styles.reviewItem}>
                  <View style={styles.reviewItemHeader}>
                    <View style={styles.reviewAuthorInfo}>
                      <Text style={styles.reviewAuthor}>{review.profile?.full_name || 'مستخدم'}</Text>
                      <Text style={styles.reviewDate}>{formatDistanceToNow(new Date(review.created_at), { addSuffix: true, locale: ar })}</Text>
                    </View>
                    {renderStars(review.rating)}
                  </View>
                  {review.comment && <Text style={styles.reviewComment}>{review.comment}</Text>}
                  {review.review_images && review.review_images.length > 0 && (
                    <FlatList
                      data={review.review_images}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      renderItem={({ item }) => <Image source={{ uri: item }} style={styles.reviewImage} />}
                      keyExtractor={(item, index) => `${item}-${index}`}
                      style={{ marginTop: 10 }}
                    />
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.noReviewsText}>لا توجد تقييمات لهذا المنتج بعد. كن أول من يضيف تقييماً!</Text>
            )}
          </View>

          <View style={styles.qnaSection}>
            <Text style={styles.sectionTitle}>الأسئلة والأجوبة ({qna.length})</Text>
            <View style={styles.askQuestionContainer}>
              <TextInput style={styles.askQuestionInput} placeholder='اطرح سؤالاً عن المنتج...' value={newQuestion} onChangeText={setNewQuestion} textAlign="right" />
              <TouchableOpacity style={styles.askQuestionButton} onPress={handleAskQuestion}><Send size={20} color="white" /></TouchableOpacity>
            </View>
            {qna.length > 0 ? (
              qna.map(item => (
                <View key={item.id} style={styles.qnaItem}>
                  <View style={styles.questionContainer}>
                    <Text style={styles.qnaAuthor}>{item.q_author.full_name}: </Text>
                    <Text style={styles.qnaText}>{item.question}</Text>
                  </View>
                  {item.answer ? (
                    <View style={styles.answerContainer}>
                      <Text style={styles.qnaAuthor}>{item.a_author?.full_name || 'البائع'}: </Text>
                      <Text style={styles.qnaText}>{item.answer}</Text>
                    </View>
                  ) : (
                     <Text style={styles.noAnswerText}>لم تتم الإجابة على هذا السؤال بعد.</Text>
                  )}
                  <TouchableOpacity style={styles.likeButton} onPress={() => toggleQnaLike(item.id, item.is_liked)}>
                    <Text style={styles.likeCount}>{item.likes[0].count}</Text>
                    <ThumbsUp size={16} color={item.is_liked ? '#4ECDC4' : '#999'} fill={item.is_liked ? '#4ECDC4' : 'none'} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noReviewsText}>لا توجد أسئلة لهذا المنتج بعد. كن أول من يسأل!</Text>
            )}
          </View>

        </View>
      </ScrollView>

      <View style={styles.bottomActions}>
        <MotiPressable
          style={[styles.addToCartButton, product.stock_quantity === 0 && styles.disabledButton]}
          onPress={handleAddToCart}
          disabled={product.stock_quantity === 0}
          animate={({ pressed }) => {
            'worklet'
            return {
              scale: pressed ? 0.95 : 1,
            }
          }}
        >
          <ShoppingCart size={20} color="white" />
          <Text style={styles.addToCartText}>{product.stock_quantity === 0 ? 'غير متوفر' : 'أضف للسلة'}</Text>
        </MotiPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#666', fontFamily: 'Inter_500Medium' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 8 },
  headerButton: { padding: 8 },
  content: { flex: 1 },
  imageSection: { position: 'relative' },
  productImage: { width: width, height: 400 },
  imageIndicators: { flexDirection: 'row', justifyContent: 'center', position: 'absolute', bottom: 20, left: 0, right: 0 },
  indicator: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)', marginHorizontal: 4 },
  activeIndicator: { backgroundColor: 'white' },
  discountBadge: { position: 'absolute', top: 20, left: 20, backgroundColor: '#ff4757', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  discountText: { color: 'white', fontSize: 12, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  productInfo: { backgroundColor: 'white', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20, paddingTop: 20, paddingHorizontal: 20, paddingBottom: 100 },
  productName: { fontSize: 24, fontWeight: 'bold', color: '#333', textAlign: 'right', marginBottom: 10, fontFamily: 'Inter_700Bold' },
  ratingContainer: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 15 },
  starRatingContainer: { flexDirection: 'row-reverse' },
  ratingText: { fontSize: 14, color: '#666', marginLeft: 8, fontFamily: 'Inter_500Medium' },
  priceSection: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  priceContainer: { flexDirection: 'row-reverse', alignItems: 'center' },
  currentPrice: { fontSize: 24, fontWeight: 'bold', color: '#4ECDC4', fontFamily: 'Inter_700Bold' },
  originalPrice: { fontSize: 18, color: '#999', textDecorationLine: 'line-through', marginLeft: 10, fontFamily: 'Inter_400Regular' },
  stockText: { fontSize: 14, color: '#666', fontFamily: 'Inter_500Medium' },
  descriptionSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', textAlign: 'right', marginBottom: 10, fontFamily: 'Inter_700Bold' },
  description: { fontSize: 16, color: '#666', lineHeight: 24, textAlign: 'right', fontFamily: 'Inter_400Regular' },
  quantitySection: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  quantityLabel: { fontSize: 16, fontWeight: '600', color: '#333', fontFamily: 'Inter_600SemiBold' },
  quantityControls: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8f9fa', borderRadius: 25, paddingHorizontal: 5 },
  quantityButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'white', justifyContent: 'center', alignItems: 'center', margin: 2 },
  quantityButtonText: { fontSize: 18, fontWeight: 'bold', color: '#4ECDC4', fontFamily: 'Inter_700Bold' },
  quantity: { fontSize: 18, fontWeight: 'bold', color: '#333', marginHorizontal: 20, fontFamily: 'Inter_700Bold' },
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'white', padding: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0' },
  addToCartButton: { backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  disabledButton: { backgroundColor: '#ccc' },
  addToCartText: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 8, fontFamily: 'Inter_700Bold' },
  reviewsSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 20 },
  reviewsHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addReviewButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#e8f8f7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  addReviewText: { color: '#4ECDC4', fontWeight: 'bold', marginLeft: 5, fontFamily: 'Inter_700Bold' },
  noReviewsText: { textAlign: 'center', color: '#999', paddingVertical: 20, fontFamily: 'Inter_400Regular' },
  reviewItem: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, marginBottom: 10 },
  reviewItemHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  reviewAuthorInfo: { alignItems: 'flex-end' },
  reviewAuthor: { fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  reviewDate: { fontSize: 12, color: '#999', fontFamily: 'Inter_400Regular' },
  reviewComment: { color: '#666', textAlign: 'right', lineHeight: 20, fontFamily: 'Inter_400Regular' },
  reviewImage: { width: 80, height: 80, borderRadius: 8, marginRight: 10 },
  qnaSection: { marginTop: 20, borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingTop: 20 },
  askQuestionContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  askQuestionInput: { flex: 1, backgroundColor: '#f0f2f5', borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10, marginRight: 10, fontFamily: 'Inter_400Regular' },
  askQuestionButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4ECDC4', justifyContent: 'center', alignItems: 'center' },
  qnaItem: { backgroundColor: '#f8f9fa', padding: 15, borderRadius: 12, marginBottom: 10 },
  questionContainer: { flexDirection: 'row-reverse', marginBottom: 8 },
  answerContainer: { flexDirection: 'row-reverse', marginTop: 8, paddingRight: 15, borderRightWidth: 2, borderRightColor: '#4ECDC4' },
  qnaAuthor: { fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  qnaText: { color: '#666', flex: 1, textAlign: 'right', fontFamily: 'Inter_400Regular' },
  noAnswerText: { fontSize: 14, color: '#999', fontStyle: 'italic', textAlign: 'right', marginTop: 5, paddingRight: 15 },
  likeButton: { flexDirection: 'row-reverse', alignItems: 'center', alignSelf: 'flex-start', marginTop: 10, gap: 5 },
  likeCount: { color: '#666', fontFamily: 'Inter_500Medium' },
});
