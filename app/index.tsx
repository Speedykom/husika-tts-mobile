import { useRouter } from 'expo-router';
import { Image, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Surface, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();

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

            <View
              style={[
                styles.badge,
                { backgroundColor: 'rgba(255,255,255,0.18)' },
              ]}
            >
              <Text style={[styles.badgeText, { color: '#fff' }]}>
                v0.1 · Early Access
              </Text>
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

      <ScrollView
        contentContainerStyle={styles.body}
        showsVerticalScrollIndicator={false}
      >
        <Text variant="bodyLarge" style={styles.intro}>
          Listen to text in multiple languages, powered by two complementary
          engines — part of the{' '}
          <Text style={{ fontWeight: '700' }}>Husika TTS project</Text>.
        </Text>

        <Text variant="labelLarge" style={styles.sectionLabel}>
          ENGINES
        </Text>

        <Surface style={styles.card} elevation={1}>
          <View
            style={[
              styles.cardIcon,
              { backgroundColor: theme.colors.primaryContainer },
            ]}
          >
            <Text style={styles.cardIconEmoji}>☁️</Text>
          </View>
          <View style={styles.cardBody}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              Speedykom Cloud
            </Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Fine-tuned TTS models served from the cloud. Higher quality, used
              when network is available.
            </Text>
          </View>
        </Surface>

        <Surface style={styles.card} elevation={1}>
          <View
            style={[
              styles.cardIcon,
              { backgroundColor: theme.colors.secondaryContainer },
            ]}
          >
            <Text style={styles.cardIconEmoji}>📡</Text>
          </View>
          <View style={styles.cardBody}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              eSpeak NG · Offline
            </Text>
            <Text variant="bodyMedium" style={styles.cardText}>
              Lightweight on-device synthesizer used as a fallback for
              low-resource languages and offline scenarios.
            </Text>
          </View>
        </Surface>

        <Text variant="bodySmall" style={styles.note}>
          Compare voices, phrasing, and language coverage across both engines —
          right from your phone.
        </Text>
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
  card: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIconEmoji: { fontSize: 22 },
  cardBody: { flex: 1 },
  cardTitle: { fontWeight: '700', marginBottom: 4 },
  cardText: { lineHeight: 20, opacity: 0.75 },
  note: {
    marginTop: 16,
    opacity: 0.55,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  cta: { paddingHorizontal: 20, paddingTop: 8 },
  ctaButton: { borderRadius: 14, paddingVertical: 4 },
});