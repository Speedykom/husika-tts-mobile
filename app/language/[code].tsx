import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import CountryFlag from 'react-native-country-flag';
import {
    Button,
    IconButton,
    Snackbar,
    Surface,
    Text,
    TextInput,
    useTheme,
} from 'react-native-paper';

import { getLanguage } from '@/data/languages';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useTTS } from '@/hooks/use-tts';

export default function LanguageDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const language = getLanguage(code ?? '');

  const { status } = useNetworkStatus();
  const blockedOffline =
    status === 'offline' && language?.engine === 'cloud';


  const [text, setText] = useState('');
  const { speak, status: ttsStatus, error: ttsError, activeText } = useTTS({ languageCode: code ?? '' });

  if (!language) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <Text variant="titleMedium">Language not found</Text>
        <Button onPress={() => router.back()} style={{ marginTop: 16 }}>
          Go back
        </Button>
      </View>
    );
  }

  const isCloud = language.engine === 'cloud';
  const isPiper = language.engine === 'piper';
  const engineLabel = isCloud
    ? 'Speedykom · Cloud'
    : isPiper
    ? 'Piper · On-device'
    : 'eSpeak NG · Offline';
  const isBusy = ttsStatus === 'loading' || ttsStatus === 'playing';

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <Stack.Screen options={{ title: language.name }} />

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Surface style={styles.heroCard} elevation={2}>
          <View style={styles.heroFlagWrap}>
            <CountryFlag
              isoCode={language.iso}
              size={56}
              style={{ borderRadius: 8 }}
            />
          </View>
          <Text variant="headlineMedium" style={styles.heroNative}>
            {language.nativeName}
          </Text>
          <Text variant="bodyMedium" style={styles.heroName}>
            {language.name}
          </Text>
          <View
            style={[
              styles.engineChip,
              {
                backgroundColor: isCloud
                  ? theme.colors.primaryContainer
                  : isPiper
                  ? theme.colors.tertiaryContainer
                  : theme.colors.secondaryContainer,
              },
            ]}
          >
            <Text
              style={[
                styles.engineChipText,
                {
                  color: isCloud
                    ? theme.colors.onPrimaryContainer
                    : isPiper
                    ? theme.colors.onTertiaryContainer
                    : theme.colors.onSecondaryContainer,
                },
              ]}
            >
              {engineLabel}
            </Text>
          </View>
          <Text variant="bodySmall" style={styles.voiceTag}>
            voice: {language.voice}
          </Text>
        </Surface>

        {/* Offline-blocked notice for cloud voices */}
        {blockedOffline && (
          <Surface style={styles.blockedCard} elevation={0}>
            <MaterialCommunityIcons
              name="cloud-off-outline"
              size={22}
              color="#92400E"
            />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.blockedTitle}>Cloud voice unavailable</Text>
              <Text style={styles.blockedText}>
                This voice runs on the Speedykom cloud. Reconnect to use it.
              </Text>
            </View>
          </Surface>
        )}

        {/* Samples */}
        <Text variant="labelLarge" style={styles.sectionLabel}>
          SAMPLE PHRASES
        </Text>

        {language.samples.map((sample, i) => (
          <Pressable
            key={i}
            onPress={() => !blockedOffline && !isBusy && speak(sample)}
            disabled={blockedOffline || isBusy}
          >
            <Surface
              style={[
                styles.sampleCard,
                blockedOffline && { opacity: 0.5 },
              ]}
              elevation={1}
            >
              <View style={styles.sampleBody}>
                <Text style={styles.sampleIndex}>{i + 1}</Text>
                <Text variant="bodyLarge" style={styles.sampleText}>
                  {sample}
                </Text>
              </View>
              {ttsStatus === 'loading' && activeText === sample ? (
                <ActivityIndicator
                  size={24}
                  color={theme.colors.primary}
                  style={{ margin: 8 }}
                />
              ) : (
                <IconButton
                  icon={ttsStatus === 'playing' && activeText === sample ? 'volume-high' : 'play-circle'}
                  iconColor={theme.colors.primary}
                  size={32}
                  disabled={blockedOffline || isBusy}
                  onPress={() => speak(sample)}
                  style={{ margin: 0 }}
                />
              )}
            </Surface>
          </Pressable>
        ))}

        {/* Input */}
        <Text
          variant="labelLarge"
          style={[styles.sectionLabel, { marginTop: 24 }]}
        >
          TYPE YOUR OWN
        </Text>

        <Surface style={styles.inputCard} elevation={1}>
          <TextInput
            mode="outlined"
            multiline
            numberOfLines={4}
            placeholder={`Write something in ${language.name}…`}
            value={text}
            onChangeText={setText}
            editable={!blockedOffline}
            style={styles.input}
            outlineStyle={{ borderRadius: 12 }}
          />
          <View style={styles.inputActions}>
            <Text variant="bodySmall" style={styles.charCount}>
              {text.length} chars
            </Text>
            <Button
              mode="contained"
              icon={ttsStatus === 'loading' && activeText === text ? undefined : 'play'}
              disabled={!text.trim() || blockedOffline || isBusy}
              onPress={() => speak(text)}
              style={styles.speakBtn}
              loading={ttsStatus === 'loading' && activeText === text}
            >
              {ttsStatus === 'playing' && activeText === text ? 'Playing…' : 'Speak'}
            </Button>
          </View>
        </Surface>

        <Text variant="bodySmall" style={styles.footnote}>
          {blockedOffline
            ? 'Reconnect to enable this voice'
            : 'Tap any phrase to preview · pull-to-refresh for new samples'}
        </Text>
      </ScrollView>
      <Snackbar
        visible={ttsStatus === 'error' && !!ttsError}
        onDismiss={() => {}}
        duration={4000}
      >
        {ttsError ?? 'TTS error'}
      </Snackbar>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 20, paddingBottom: 40 },

  heroCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  heroFlagWrap: {
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E5E8DE',
  },
  heroNative: { fontWeight: '800' },
  heroName: { opacity: 0.6, marginTop: 4 },
  engineChip: {
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
  },
  engineChipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  voiceTag: { marginTop: 10, opacity: 0.45, fontFamily: 'monospace' },

  blockedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  blockedTitle: { fontWeight: '700', color: '#78350F', fontSize: 14 },
  blockedText: { color: '#92400E', fontSize: 12, marginTop: 2, lineHeight: 16 },

  sectionLabel: { letterSpacing: 1.2, opacity: 0.6, marginBottom: 10 },

  sampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
  },
  sampleBody: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  sampleIndex: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F1F4EC',
    textAlign: 'center',
    lineHeight: 24,
    fontSize: 12,
    fontWeight: '700',
    color: '#547742',
    marginRight: 12,
  },
  sampleText: { flex: 1, lineHeight: 22 },

  inputCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  input: { backgroundColor: '#fff', minHeight: 100 },
  inputActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  charCount: { opacity: 0.5 },
  speakBtn: { borderRadius: 12 },

  footnote: {
    textAlign: 'center',
    marginTop: 20,
    opacity: 0.5,
    fontStyle: 'italic',
  },
});