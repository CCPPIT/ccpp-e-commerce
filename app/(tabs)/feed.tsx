import React, { useState, useCallback } from 'react';
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
import { Plus, Heart, MessageCircle } from 'lucide-react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { supabase, Database } from '../../lib/supabase';

type Post = {
  id: string;
  caption: string | null;
  image_url: string;
  created_at: string;
  profile: Pick<Database['public']['Tables']['profiles']['Row'], 'full_name' | 'avatar_url'>;
  likes: { count: number }[];
  comments: { count: number }[];
  is_liked: boolean;
};

export default function FeedScreen() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFeed = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .rpc('get_posts_with_details', { p_user_id: user ? user.id : null });

      if (error) throw error;
      setPosts(data as Post[]);
    } catch (error) {
      console.error('Error loading feed:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحميل الموجز');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadFeed();
    }, [user])
  );

  const toggleLike = async (postId: string, isLiked: boolean) => {
    if (!user) {
      router.push('/auth/login');
      return;
    }
    
    setPosts(posts.map(p => p.id === postId ? {
      ...p,
      is_liked: !isLiked,
      likes: [{ count: p.likes[0].count + (!isLiked ? 1 : -1) }]
    } : p));

    try {
      if (isLiked) {
        await supabase.from('post_likes').delete().match({ post_id: postId, user_id: user.id });
      } else {
        await supabase.from('post_likes').insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      console.error("Error toggling like:", error);
      loadFeed(); // Re-fetch to correct state on error
    }
  };

  const renderPost = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{item.profile.full_name}</Text>
        </View>
        <Image source={{ uri: item.profile.avatar_url || 'https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://img-wrapper.vercel.app/image?url=https://placehold.co/50x50.png' }} style={styles.avatar} />
      </View>
      <Image source={{ uri: item.image_url }} style={styles.postImage} />
      <View style={styles.postActions}>
        <View style={styles.actionGroup}>
          <TouchableOpacity style={styles.actionButton}>
            <MessageCircle size={24} color="#333" />
            <Text style={styles.actionText}>{item.comments[0].count}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => toggleLike(item.id, item.is_liked)}>
            <Heart size={24} color={item.is_liked ? '#ff4757' : '#333'} fill={item.is_liked ? '#ff4757' : 'none'} />
            <Text style={styles.actionText}>{item.likes[0].count}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {item.caption && <Text style={styles.caption}>{item.caption}</Text>}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.createButton} onPress={() => router.push('/feed/create')}>
          <Plus size={24} color="#4ECDC4" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>موجز الأزياء</Text>
        <View style={{ width: 40 }} />
      </View>
      {loading ? <Text style={styles.loadingText}>جاري التحميل...</Text> :
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', fontFamily: 'Inter_700Bold' },
  createButton: { padding: 8 },
  loadingText: { textAlign: 'center', marginTop: 20, fontFamily: 'Inter_500Medium' },
  listContainer: { paddingVertical: 10 },
  postCard: { backgroundColor: 'white', marginHorizontal: 15, marginBottom: 15, borderRadius: 12, padding: 15 },
  postHeader: { flexDirection: 'row-reverse', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  userInfo: { flex: 1, marginRight: 10 },
  userName: { fontSize: 16, fontWeight: 'bold', color: '#333', textAlign: 'right', fontFamily: 'Inter_700Bold' },
  postImage: { width: '100%', height: 400, borderRadius: 12, marginBottom: 10 },
  postActions: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 8 },
  actionGroup: { flexDirection: 'row-reverse', gap: 15 },
  actionButton: { flexDirection: 'row-reverse', alignItems: 'center', gap: 5 },
  actionText: { fontSize: 14, color: '#666', fontFamily: 'Inter_500Medium' },
  caption: { fontSize: 14, color: '#333', textAlign: 'right', lineHeight: 20, fontFamily: 'Inter_400Regular' },
});
