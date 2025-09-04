import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/supabase';
import { Alert } from 'react-native';

type Product = Database['public']['Tables']['products']['Row'];
type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};
type Favorite = {
  id: string;
  product: Product;
};

interface AppState {
  cartItems: CartItem[];
  favorites: Favorite[];
  cartCount: number;
  total: number;
  isCartLoading: boolean;
  isFavoritesLoading: boolean;
  
  // Actions
  loadInitialData: (userId: string) => Promise<void>;
  addToCart: (product: Product, quantity: number, userId: string) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  toggleFavorite: (product: Product, userId: string) => Promise<void>;
  clearLocalState: () => void;
}

const useAppStore = create<AppState>((set, get) => ({
  cartItems: [],
  favorites: [],
  cartCount: 0,
  total: 0,
  isCartLoading: true,
  isFavoritesLoading: true,

  loadInitialData: async (userId) => {
    try {
      set({ isCartLoading: true, isFavoritesLoading: true });
      const [cartRes, favRes] = await Promise.all([
        supabase.from('cart_items').select('id, quantity, product:products(*)').eq('user_id', userId),
        supabase.from('favorites').select('id, product:products(*)').eq('user_id', userId)
      ]);

      if (cartRes.error) throw cartRes.error;
      if (favRes.error) throw favRes.error;

      const cartItems = (cartRes.data as CartItem[]) || [];
      const favorites = (favRes.data as Favorite[]) || [];

      set({ 
        cartItems, 
        favorites,
        cartCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total: cartItems.reduce((sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity, 0),
        isCartLoading: false,
        isFavoritesLoading: false,
      });
    } catch (error) {
      console.error("Error loading initial data:", error);
      set({ isCartLoading: false, isFavoritesLoading: false });
    }
  },

  addToCart: async (product, quantity, userId) => {
    const existingItem = get().cartItems.find(item => item.product.id === product.id);

    try {
      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        await get().updateQuantity(existingItem.id, newQuantity);
      } else {
        const { data, error } = await supabase
          .from('cart_items')
          .insert({ user_id: userId, product_id: product.id, quantity })
          .select('id, quantity, product:products(*)')
          .single();
        
        if (error) throw error;
        
        set(state => {
          const newCartItems = [...state.cartItems, data as CartItem];
          return {
            cartItems: newCartItems,
            cartCount: newCartItems.reduce((sum, item) => sum + item.quantity, 0),
            total: newCartItems.reduce((sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity, 0),
          }
        });
      }
      Alert.alert('تم الإضافة', `تم إضافة المنتج للسلة`);
    } catch (error) {
      console.error("Error adding to cart:", error);
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة المنتج للسلة');
    }
  },

  updateQuantity: async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await get().removeFromCart(itemId);
      return;
    }
    
    set(state => ({
      cartItems: state.cartItems.map(item => item.id === itemId ? { ...item, quantity: newQuantity } : item)
    }));
    
    try {
      await supabase.from('cart_items').update({ quantity: newQuantity }).eq('id', itemId);
    } catch (error) {
      console.error("Error updating quantity:", error);
      Alert.alert('خطأ', 'حدث خطأ أثناء تحديث الكمية');
      // Revert state on error if needed
    } finally {
      // Recalculate totals after any change
      set(state => ({
        cartCount: state.cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total: state.cartItems.reduce((sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity, 0),
      }));
    }
  },

  removeFromCart: async (itemId) => {
    set(state => ({
      cartItems: state.cartItems.filter(item => item.id !== itemId)
    }));

    try {
      await supabase.from('cart_items').delete().eq('id', itemId);
      Alert.alert('تم الحذف', 'تم حذف المنتج من السلة');
    } catch (error) {
      console.error("Error removing from cart:", error);
      Alert.alert('خطأ', 'حدث خطأ أثناء حذف المنتج');
    } finally {
       // Recalculate totals after any change
       set(state => ({
        cartCount: state.cartItems.reduce((sum, item) => sum + item.quantity, 0),
        total: state.cartItems.reduce((sum, item) => sum + (item.product.sale_price || item.product.price) * item.quantity, 0),
      }));
    }
  },

  toggleFavorite: async (product, userId) => {
    const isFavorite = get().favorites.some(fav => fav.product.id === product.id);
    
    if (isFavorite) {
      const favId = get().favorites.find(fav => fav.product.id === product.id)?.id;
      set(state => ({
        favorites: state.favorites.filter(fav => fav.product.id !== product.id)
      }));
      if (favId) {
        await supabase.from('favorites').delete().eq('id', favId);
      }
    } else {
      const { data, error } = await supabase
        .from('favorites')
        .insert({ user_id: userId, product_id: product.id })
        .select('id, product:products(*)')
        .single();
      
      if (error) throw error;
      set(state => ({ favorites: [...state.favorites, data as Favorite] }));
    }
  },

  clearLocalState: () => {
    set({
      cartItems: [],
      favorites: [],
      cartCount: 0,
      total: 0,
      isCartLoading: false,
      isFavoritesLoading: false,
    });
  },
}));

export default useAppStore;
