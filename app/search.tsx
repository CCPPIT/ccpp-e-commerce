import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Search, Camera, X, Mic } from 'lucide-react-native';
import { router } from 'expo-router';

export default function SearchScreen() {
  const [searchText, setSearchText] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Search size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="ابحث عن منتجات..."
            placeholderTextColor="#999"
            value={searchText}
            onChangeText={setSearchText}
            textAlign="right"
            autoFocus
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <X size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/voice-search')}>
          <Mic size={24} color="#4ECDC4" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/visual-search')}>
          <Camera size={24} color="#4ECDC4" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.placeholderText}>ابدأ الكتابة للبحث عن منتجات</Text>
      </View>
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
    paddingHorizontal: 15,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    marginHorizontal: 10,
  },
  searchIcon: {
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  iconButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    fontFamily: 'Inter_500Medium',
  },
});
