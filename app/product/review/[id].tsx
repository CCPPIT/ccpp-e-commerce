import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Star, Camera, Trash2 } from 'lucide-react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function AddReviewScreen() {
  const { id: productId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    if (images.length >= 3) {
      Alert.alert('حد أقصى', 'يمكنك إضافة 3 صور فقط.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 4],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const uploadImage = async (uri: string) => {
    const fileExt = uri.split('.').pop();
    const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user!.id}/${fileName}`;
    
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('review-images')
      .upload(filePath, blob, {
        contentType: `image/${fileExt}`,
      });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('review-images').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert('خطأ', 'يرجى تحديد تقييم (نجمة واحدة على الأقل).');
      return;
    }
    if (!user || !productId) return;

    setSubmitting(true);
    try {
      const uploadedImageUrls = await Promise.all(images.map(uri => uploadImage(uri)));

      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        user_id: user.id,
        rating,
        comment: comment || null,
        review_images: uploadedImageUrls.length > 0 ? uploadedImageUrls : null,
      });

      if (error) throw error;

      Alert.alert('شكراً لك!', 'تم إرسال تقييمك بنجاح.', [
        { text: 'موافق', onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إرسال التقييم.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><ArrowLeft size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>إضافة تقييم</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>تقييمك للمنتج</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <Star size={40} color={star <= rating ? '#FFA500' : '#ccc'} fill={star <= rating ? '#FFA500' : 'none'} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>أضف تعليقاً (اختياري)</Text>
        <TextInput
          style={styles.commentInput}
          placeholder="اكتب رأيك في المنتج هنا..."
          multiline
          value={comment}
          onChangeText={setComment}
          textAlign="right"
        />

        <Text style={styles.sectionTitle}>إضافة صور (اختياري)</Text>
        <View style={styles.imagesContainer}>
          {images.map((uri, index) => (
            <View key={index} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.previewImage} />
              <TouchableOpacity style={styles.deleteImageButton} onPress={() => setImages(images.filter((_, i) => i !== index))}>
                <Trash2 size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}
          {images.length < 3 && (
            <TouchableOpacity style={styles.addImageButton} onPress={pickImage}>
              <Camera size={24} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={[styles.submitButton, submitting && styles.disabledButton]} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? 'جاري الإرسال...' : 'إرسال التقييم'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  content: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#333', textAlign: 'right', marginBottom: 15, fontFamily: 'Inter_600SemiBold' },
  starsContainer: { flexDirection: 'row-reverse', justifyContent: 'center', marginBottom: 30, gap: 15 },
  commentInput: { backgroundColor: 'white', height: 120, borderRadius: 12, padding: 15, textAlignVertical: 'top', fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 30, fontFamily: 'Inter_400Regular' },
  imagesContainer: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 10, marginBottom: 30 },
  addImageButton: { width: 80, height: 80, borderRadius: 12, backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#e0e0e0', borderStyle: 'dashed' },
  imageWrapper: { position: 'relative' },
  previewImage: { width: 80, height: 80, borderRadius: 12 },
  deleteImageButton: { position: 'absolute', top: -5, left: -5, backgroundColor: '#ff4757', borderRadius: 12, padding: 4 },
  submitButton: { backgroundColor: '#4ECDC4', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  disabledButton: { backgroundColor: '#ccc' },
  submitButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
});
