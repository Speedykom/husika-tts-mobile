import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  LayoutAnimation,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  UIManager,
  View,
} from "react-native";
import CountryFlag from "react-native-country-flag";
import { Surface, Text, TextInput, useTheme } from "react-native-paper";

import { ALL_LANGUAGES, type Engine, type Language } from "@/data/languages";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { usePiperDownload } from "@/hooks/use-piper-download";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FilterValue = "all" | Engine;

export default function LanguagesScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { status, refresh } = useNetworkStatus();
  const isOffline = status === "offline";
  const isOnline = status === "online";

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");
  const [refreshing, setRefreshing] = useState(false);

  // When connection drops, ensure user isn't stuck on the Cloud filter
  useEffect(() => {
    if (isOffline && filter === "cloud") {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setFilter("all");
    }
  }, [isOffline, filter]);

  // The "available" pool depends on connectivity — Piper always shows (offline-capable once downloaded)
  const availableLanguages = useMemo(
    () =>
      isOffline
        ? ALL_LANGUAGES.filter(
            (l) => l.engine === "offline" || l.engine === "piper",
          )
        : ALL_LANGUAGES,
    [isOffline],
  );

  // Filter pills shown — hide "Cloud" when offline
  const filterPills = useMemo<{ value: FilterValue; label: string }[]>(
    () =>
      isOffline
        ? [
            { value: "all", label: "All" },
            { value: "offline", label: "Offline" },
            { value: "piper", label: "Piper" },
          ]
        : [
            { value: "all", label: "All" },
            { value: "cloud", label: "Cloud" },
            { value: "offline", label: "Offline" },
            { value: "piper", label: "Piper" },
          ],
    [isOffline],
  );

  const counts = useMemo(
    () => ({
      all: availableLanguages.length,
      cloud: availableLanguages.filter((l) => l.engine === "cloud").length,
      offline: availableLanguages.filter((l) => l.engine === "offline").length,
      piper: availableLanguages.filter((l) => l.engine === "piper").length,
    }),
    [availableLanguages],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return availableLanguages.filter((l) => {
      const byEngine = filter === "all" || l.engine === filter;
      const byQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.nativeName.toLowerCase().includes(q);
      return byEngine && byQuery;
    });
  }, [query, filter, availableLanguages]);

  const changeFilter = (f: FilterValue) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(f);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refresh();
    setTimeout(() => setRefreshing(false), 400);
  }, [refresh]);

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        {isOffline && <OfflineBanner onRetry={onRefresh} />}
        {isOnline && <OnlineIndicator />}

        <Text variant="bodyMedium" style={styles.subtitle}>
          {filtered.length} {filtered.length === 1 ? "voice" : "voices"} ready
          {" · "}
          <Text style={{ opacity: 0.5 }}>tap to listen</Text>
        </Text>

        <TextInput
          mode="outlined"
          placeholder="Search languages"
          value={query}
          onChangeText={setQuery}
          left={<TextInput.Icon icon="magnify" />}
          right={
            query ? (
              <TextInput.Icon icon="close" onPress={() => setQuery("")} />
            ) : null
          }
          outlineStyle={styles.searchOutline}
          style={styles.search}
          dense
        />

        <View style={styles.filters}>
          {filterPills.map((f) => {
            const active = filter === f.value;
            return (
              <Pressable
                key={f.value}
                onPress={() => changeFilter(f.value)}
                style={[
                  styles.pill,
                  {
                    backgroundColor: active ? theme.colors.primary : "#fff",
                    borderColor: active
                      ? theme.colors.primary
                      : theme.colors.outline,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pillLabel,
                    { color: active ? "#fff" : theme.colors.onSurface },
                  ]}
                >
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.pillBadge,
                    {
                      backgroundColor: active
                        ? "rgba(255,255,255,0.22)"
                        : theme.colors.surfaceVariant,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.pillBadgeText,
                      {
                        color: active ? "#fff" : theme.colors.onSurfaceVariant,
                      },
                    ]}
                  >
                    {counts[f.value]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(l) => l.code}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        renderItem={({ item }) =>
          item.engine === "piper" ? (
            <PiperRow
              language={item}
              onPress={() => router.push(`/language/${item.code}`)}
            />
          ) : (
            <LanguageRow
              language={item}
              onPress={() => router.push(`/language/${item.code}`)}
            />
          )
        }
        ListEmptyComponent={<EmptyState query={query} />}
      />
    </View>
  );
}

/* ─── Connectivity components ─── */

function OfflineBanner({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineIcon}>
        <MaterialCommunityIcons
          name="cloud-off-outline"
          size={20}
          color="#92400E"
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.offlineTitle}>You&apos;re offline</Text>
        <Text style={styles.offlineText}>
          Showing on-device voices only. Cloud voices will return when you
          reconnect.
        </Text>
      </View>
      <Pressable
        onPress={onRetry}
        hitSlop={8}
        style={({ pressed }) => [
          styles.retryBtn,
          { opacity: pressed ? 0.7 : 1 },
        ]}
      >
        <MaterialCommunityIcons name="refresh" size={18} color="#92400E" />
      </Pressable>
    </View>
  );
}

function OnlineIndicator() {
  return (
    <View style={styles.onlineRow}>
      <View style={styles.onlineDot} />
      <Text style={styles.onlineText}>Online · All voices available</Text>
    </View>
  );
}

function PiperRow({
  language,
  onPress,
}: {
  language: Language;
  onPress: () => void;
}) {
  const { state, progress, startDownload, error } = usePiperDownload(
    language.code,
  );
  return (
    <LanguageRow
      language={language}
      onPress={onPress}
      isDownloading={state === "downloading"}
      isDownloaded={state === "downloaded"}
      downloadProgress={progress}
      onDownload={startDownload}
      downloadError={error}
    />
  );
}

/* ─── Row ─── */

function LanguageRow({
  language,
  onPress,
  isDownloading = false,
  isDownloaded = false,
  downloadProgress = 0,
  onDownload,
  downloadError,
}: {
  language: Language;
  onPress: () => void;
  isDownloading?: boolean;
  isDownloaded?: boolean;
  downloadProgress?: number;
  onDownload?: () => void;
  downloadError?: string | null;
}) {
  const theme = useTheme();
  const isCloud = language.engine === "cloud";
  const isPiper = language.engine === "piper";

  const tintFg = isCloud
    ? theme.colors.onPrimaryContainer
    : isPiper
      ? theme.colors.onTertiaryContainer
      : theme.colors.onSecondaryContainer;

  const engineIcon = isCloud
    ? "cloud-outline"
    : isPiper
      ? "download-circle-outline"
      : "download-outline";

  const engineLabel = isCloud ? "Cloud" : isPiper ? "Piper" : "Offline";

  const handlePress = () => {
    if (isPiper && !isDownloaded) onDownload?.();
    else onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: theme.colors.surfaceVariant, borderless: false }}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      <Surface style={[styles.row, { overflow: "hidden" }]} elevation={0}>
        <View style={styles.flagWrap}>
          <CountryFlag isoCode={language.iso} size={22} style={styles.flag} />
        </View>

        <View style={styles.rowBody}>
          <Text variant="titleMedium" style={styles.rowNative}>
            {language.nativeName}
          </Text>
          <View style={styles.rowMeta}>
            <Text variant="bodySmall" style={styles.rowName}>
              {language.name}
            </Text>
            <Text style={styles.dot}>·</Text>
            <MaterialCommunityIcons
              name={engineIcon}
              size={13}
              color={tintFg}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.rowEngine, { color: tintFg }]}>
              {engineLabel}
            </Text>
          </View>
        </View>

        {isPiper && !isDownloaded && !isDownloading && (
          <MaterialCommunityIcons
            name="cloud-download-outline"
            size={22}
            color={tintFg}
          />
        )}
        {isPiper && isDownloading && (
          <View style={[styles.pctBadge, { borderColor: tintFg }]}>
            <MaterialCommunityIcons
              name="arrow-down"
              size={10}
              color={tintFg}
            />
            <Text style={[styles.pctText, { color: tintFg }]}>
              {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
        )}
        {(!isPiper || isDownloaded) && (
          <View style={styles.rowRight}>
            {isPiper && isDownloaded && (
              <MaterialCommunityIcons
                name="check-circle"
                size={16}
                color="#22C55E"
                style={{ marginRight: 2 }}
              />
            )}
            <MaterialCommunityIcons
              name="chevron-right"
              size={22}
              color={theme.colors.onSurfaceVariant}
            />
          </View>
        )}

        {isPiper && isDownloading && (
          <ProgressBar progress={downloadProgress} color={tintFg} />
        )}

        {isPiper && downloadError && !isDownloading && !isDownloaded && (
          <View style={styles.errorStripe} />
        )}
      </Surface>
    </Pressable>
  );
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: progress,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [progress, anim]);

  const widthPct = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          { width: widthPct, backgroundColor: color },
        ]}
      />
    </View>
  );
}

function EmptyState({ query }: { query: string }) {
  const theme = useTheme();
  return (
    <View style={styles.empty}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: theme.colors.surfaceVariant },
        ]}
      >
        <MaterialCommunityIcons
          name="magnify"
          size={28}
          color={theme.colors.onSurfaceVariant}
        />
      </View>
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No matches
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {query ? `Nothing found for “${query}”` : "Try another filter"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  subtitle: { opacity: 0.75, marginBottom: 12 },

  /* Offline banner */
  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  offlineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(245, 158, 11, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  offlineTitle: { fontWeight: "700", color: "#78350F", fontSize: 14 },
  offlineText: { color: "#92400E", fontSize: 12, marginTop: 2, lineHeight: 16 },
  retryBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },

  /* Online indicator */
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 6,
  },
  onlineText: { fontSize: 12, opacity: 0.55, fontWeight: "500" },

  /* Search */
  search: { backgroundColor: "#fff" },
  searchOutline: { borderRadius: 14, borderColor: "#E5E8DE" },

  /* Filters */
  filters: { flexDirection: "row", marginTop: 14, marginBottom: 6, gap: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillLabel: { fontSize: 13, fontWeight: "600" },
  pillBadge: {
    marginLeft: 8,
    minWidth: 22,
    paddingHorizontal: 6,
    height: 20,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pillBadgeText: { fontSize: 11, fontWeight: "700" },

  /* List */
  list: { padding: 20, paddingTop: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EEF1E8",
  },
  flagWrap: {
    width: 40,
    height: 30,
    borderRadius: 6,
    overflow: "hidden",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#E5E8DE",
    alignItems: "center",
    justifyContent: "center",
  },
  flag: { borderRadius: 4 },
  rowBody: { flex: 1 },
  rowNative: { fontWeight: "700" },
  rowMeta: { flexDirection: "row", alignItems: "center", marginTop: 3 },
  rowName: { opacity: 0.6 },
  dot: { marginHorizontal: 6, opacity: 0.4 },
  rowEngine: { fontSize: 12, fontWeight: "600" },

  /* Downloaded ready state */
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  /* Percentage badge shown during download */
  pctBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pctText: { fontSize: 12, fontWeight: "700", letterSpacing: 0.2 },

  /* Animated progress bar */
  progressTrack: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 5,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 999,
  },

  /* Download error stripe */
  errorStripe: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: "#EF4444",
    opacity: 0.55,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  /* Empty state */
  empty: { alignItems: "center", paddingTop: 60 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: { fontWeight: "700" },
  emptyText: { opacity: 0.6, marginTop: 4, textAlign: "center" },
});
