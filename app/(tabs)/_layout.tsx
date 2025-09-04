import React from 'react';
import { Tabs } from 'expo-router';
import { Home, Compass, MessageCircle, Trophy, User, ShoppingBag } from 'lucide-react-native';
import { View, Text, StyleSheet } from 'react-native';
import useAppStore from '../../stores/useAppStore';
import { MotiView } from 'moti';

const TabIcon = ({ icon: Icon, color, size, focused, label, badgeCount }: { icon: React.ElementType, color: string, size: number, focused: boolean, label: string, badgeCount?: number }) => (
  <View style={styles.tabContainer}>
    <Icon color={color} size={size} />
    <Text style={[styles.tabLabel, { color: color, fontFamily: focused ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
      {label}
    </Text>
    {badgeCount && badgeCount > 0 && (
      <MotiView
        style={styles.badge}
        from={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring' }}
      >
        <Text style={styles.badgeText}>{badgeCount}</Text>
      </MotiView>
    )}
  </View>
);

const CartTabIcon = (props: { color: string, size: number, focused: boolean }) => {
  const cartCount = useAppStore(state => state.cartCount);
  return <TabIcon {...props} icon={ShoppingBag} label="السلة" badgeCount={cartCount} />
};

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4ECDC4',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: 'white',
          borderTopWidth: 1,
          borderTopColor: '#f0f0f0',
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Home} color={color} size={size} focused={focused} label="الرئيسية" />
          ),
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          title: 'الموجز',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={Compass} color={color} size={size} focused={focused} label="الموجز" />
          ),
        }}
      />
      <Tabs.Screen
        name="stylist"
        options={{
          title: 'المساعد',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={MessageCircle} color={color} size={size} focused={focused} label="المساعد" />
          ),
        }}
      />
       <Tabs.Screen
        name="cart"
        options={{
          title: 'السلة',
          tabBarIcon: (props) => <CartTabIcon {...props} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'ملفي',
          tabBarIcon: ({ color, size, focused }) => (
            <TabIcon icon={User} color={color} size={size} focused={focused} label="ملفي" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  tabLabel: {
    fontSize: 12,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -10,
    backgroundColor: '#ff4757',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'white',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
