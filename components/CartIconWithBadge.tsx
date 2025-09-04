import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ShoppingBag } from 'lucide-react-native';
import { router } from 'expo-router';
import { MotiView } from 'moti';
import useAppStore from '../stores/useAppStore';

export default function CartIconWithBadge() {
  const cartCount = useAppStore(state => state.cartCount);

  return (
    <TouchableOpacity style={styles.container} onPress={() => router.push('/cart')}>
      <ShoppingBag size={24} color="#333" />
      {cartCount > 0 && (
        <MotiView
          style={styles.badge}
          from={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring' }}
        >
          <Text style={styles.badgeText}>{cartCount}</Text>
        </MotiView>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
