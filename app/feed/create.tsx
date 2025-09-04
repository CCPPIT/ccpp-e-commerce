import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Camera, Image as ImageIcon } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

export default function CreatePostScreen() {
  const { user } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.7,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const fileExt = uri.split('.').pop();
    const fileName = `${user!.id}-${Date.now()}.${fileExt}`;
    const filePath = `${user!.id}/${fileName}`;
    
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('feed-posts')
      .upload(filePath, blob, { contentType: `image/${fileExt}` });

    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage.from('feed-posts').getPublicUrl(data.path);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!image) {
      Alert.alert('خطأ', 'يرجى اختيار صورة للمنشور.');
      return;
    }
    if (!user) return;

    setSubmitting(true);
    try {
      const imageUrl = await uploadImage(image);
      const { error } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: imageUrl,
        caption: caption || null,
      });

      if (error) throw error;

      Alert.alert('تم النشر', 'تم نشر إطلالتك بنجاح!', [
        { text: 'موافق', onPress: () => router.replace('/(tabs)/feed') },
      ]);
    } catch (error) {
      console.error('Error creating post:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء نشر الصورة.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><ArrowLeft size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>إنشاء منشور جديد</Text>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={submitting}>
          <Text style={styles.submitButtonText}>{submitting ? 'جاري النشر...' : 'نشر'}</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePickerPlaceholder}>
              <ImageIcon size={48} color="#ccc" />
              <Text style={styles.imagePickerText}>اختر صورة</Text>
            </View>
          )}
        </TouchableOpacity>
        <TextInput
          style={styles.captionInput}
          placeholder="اكتب تعليقاً..."
          multiline
          value={caption}
          onChangeText={setCaption}
          textAlign="right"
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  submitButton: {},
  submitButtonText: { fontSize: 16, color: '#4ECDC4', fontWeight: 'bold', fontFamily: 'Inter_700Bold' },
  content: { padding: 20 },
  imagePicker: { width: '100%', height: 450, backgroundColor: '#f0f0f0', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  previewImage: { width: '100%', height: '100%' },
  imagePickerPlaceholder: { alignItems: 'center' },
  imagePickerText: { marginTop: 10, color: '#999', fontFamily: 'Inter_500Medium' },
  captionInput: { backgroundColor: 'white', minHeight: 100, borderRadius: 12, padding: 15, textAlignVertical: 'top', fontSize: 16, borderWidth: 1, borderColor: '#e0e0e0', fontFamily: 'Inter_400Regular' },
});
