import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Mic } from 'lucide-react-native';
import { router } from 'expo-router';
import { Audio } from 'expo-av';

export default function VoiceSearchScreen() {
  const [recording, setRecording] = useState<Audio.Recording | undefined>();
  const [permissionResponse, requestPermission] = Audio.usePermissions();
  const [isRecording, setIsRecording] = useState(false);

  async function startRecording() {
    try {
      if (permissionResponse?.status !== 'granted') {
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
         Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('خطأ', 'فشل بدء التسجيل الصوتي.');
    }
  }

  async function stopRecording() {
    setIsRecording(false);
    if (!recording) return;

    await recording.stopAndUnloadAsync();
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
    const uri = recording.getURI();
    console.log('Recording stopped and stored at', uri);
    // Here you would typically send the audio file to a speech-to-text API
    Alert.alert('تم', 'تم تسجيل صوتك بنجاح. سيتم تحليل الصوت (ميزة قيد التطوير).');
    router.back();
  }

  const handlePress = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={30} color="#333" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>البحث الصوتي</Text>
        <Text style={styles.subtitle}>
          {isRecording ? 'جاري الاستماع...' : 'اضغط على المايكروفون لبدء التسجيل'}
        </Text>
        <TouchableOpacity 
          style={[styles.micButton, isRecording && styles.micButtonRecording]}
          onPress={handlePress}
        >
          <Mic size={60} color="white" />
        </TouchableOpacity>
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
    padding: 20,
    alignItems: 'flex-start',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 60,
    fontFamily: 'Inter_500Medium',
  },
  micButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  micButtonRecording: {
    backgroundColor: '#ff4757',
    shadowColor: '#ff4757',
  },
});
