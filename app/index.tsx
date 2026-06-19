import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PIPER_LANGUAGES } from '@/data/languages';

const PIPER_TOTAL = PIPER_LANGUAGES.length;

const ENGINES = [
  {
    logo: require('@/assets/logos/speedykom-logo.png') as number,
    bg: '#EEF2FF',
    name: 'Speedykom',
    tag: 'Cloud · Streaming',
    desc: 'Best voice quality when you have a connection.',
  },
  {
    logo: require('@/assets/logos/espeakng-logo.webp') as number,
    bg: '#F0FDF4',
    name: 'eSpeak NG',
    tag: 'Offline · Built-in',
    desc: 'Always works, no internet needed.',
  },
  {
    logo: require('@/assets/logos/piper-logo.png') as number,
    bg: '#FFF7ED',
    name: 'Piper',
    tag: 'Offline · Download',
    desc: 'Download a model once, use it forever.',
  },
] as const;

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [piperReady, setPiperReady] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const keys = PIPER_LANGUAGES.map((l) => `@piper_model_${l.code}`);
      AsyncStorage.multiGet(keys).then((pairs) => {
        setPiperReady(pairs.filter(([, v]) => v === 'downloaded').length);
      });
    }, []),
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {/* Hero */}
      <View style={[styles.hero, { backgroundColor: theme.colors.primary }]}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroContent}>
            <View style={styles.logoWrap}>
              <Image
                source={require('@/assets/images/husika-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <View style={[styles.badge, { backgroundColor: 'rgba(255,255,255,0.18)' }]}>
              <Text style={[styles.badgeText, { color: '#fff' }]}>v0.2 · Early Access</Text>
            </View>
            <Text variant="displaySmall" style={styles.heroTitle}>
              Husika TTS
            </Text>
            <Text variant="titleMedium" style={styles.heroSubtitle}>
              Voices for every language you speak
            </Text>
          </View>
        </SafeAreaView>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text variant="bodyLarge" style={styles.intro}>
          Three ways to hear your language. Pick the one that fits your moment.
        </Text>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          ENGINES
        </Text>

        <View style={styles.engineGrid}>
          {ENGINES.map((e) => {
            const isPiper = e.name === 'Piper';
            return (
              <Surface key={e.name} style={styles.engineCard} elevation={1}>
                <View style={[styles.engineIcon, { backgroundColor: e.bg }]}>
                  <Image source={e.logo} style={styles.engineLogo} resizeMode="contain" />
                </View>
                <Text style={styles.engineName}>{e.name}</Text>
                <Text style={styles.engineTag}>{e.tag}</Text>
                <Text style={styles.engineDesc}>{e.desc}</Text>
                {isPiper && piperReady > 0 && (
                  <Text style={styles.piperCount}>
                    {piperReady} / {PIPER_TOTAL} ready
                  </Text>
                )}
              </Surface>
            );
          })}
        </View>
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.cta}>
        <Button
          mode="contained"
          icon="arrow-right"
          contentStyle={{ flexDirection: 'row-reverse', paddingVertical: 6 }}
          onPress={() => router.push('/languages')}
          style={styles.ctaButton}
        >
          Explore Languages
        </Button>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 24, paddingBottom: 32 },
  heroContent: { paddingTop: 16, alignItems: 'flex-start' },

  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  logo: { width: 52, height: 52 },

  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 12,
  },
  badgeText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  heroTitle: { color: '#fff', fontWeight: '800' },
  heroSubtitle: { color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  body: { padding: 20, paddingBottom: 24 },
  intro: { lineHeight: 24, marginTop: 8, marginBottom: 24 },
  sectionLabel: { letterSpacing: 1.2, opacity: 0.6, marginBottom: 10 },

  engineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  engineCard: {
    width: '47.5%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    gap: 4,
  },
  engineIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  engineLogo: { width: 30, height: 30 },
  engineName: { fontSize: 13, fontWeight: '700' },
  engineTag: { fontSize: 11, fontWeight: '600', opacity: 0.45 },
  engineDesc: { fontSize: 12, opacity: 0.65, lineHeight: 17, marginTop: 2 },
  piperCount: { fontSize: 11, fontWeight: '600', opacity: 0.55, marginTop: 2 },

  cta: { paddingHorizontal: 20, paddingTop: 8 },
  ctaButton: { borderRadius: 14, paddingVertical: 4 },
});
