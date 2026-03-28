import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Pressable } from 'react-native';
import { Button, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { LogItem } from '@/components/LogItem';
import { ProgressCard } from '@/components/ProgressCard';
import { StatsCard } from '@/components/StatsCard';
import { useAppState } from '@/hooks/useAppState';
import { triggerSelectionHaptic } from '@/utils/haptics';
import { calculateDashboard, formatDisplayDate } from '@/utils/calculations';

export default function DashboardScreen() {
  const { profile, logs, refreshData } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const summary = calculateDashboard(profile, logs);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const openLogScreen = async () => {
    await triggerSelectionHaptic();
    router.push('/(tabs)/log');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 10,
            paddingBottom: insets.bottom + 100,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text variant="headlineLarge" style={styles.greeting}>
              Hello, {profile?.name ?? 'Alex'}
            </Text>
          </View>
          <Pressable onPress={() => void openLogScreen()} hitSlop={10} style={styles.plusButton}>
            <Text style={styles.plusSymbol}>+</Text>
          </Pressable>
        </View>

        <ProgressCard
          completed={summary.totalHours}
          target={profile?.targetHours ?? 240}
          remaining={summary.remainingHours}
          percentage={summary.completionPercentage}
          status={summary.status}
        />

        <View style={styles.statsGrid}>
          <StatsCard label="Current Streak" value="3d" />
          <StatsCard label="Avg Daily" value={`${summary.averageDailyHours.toFixed(1)}h`} />
          <StatsCard label="Days Left" value={`${summary.daysUntilDeadline}d`} />
        </View>

        <Surface style={[styles.motivationCard, { backgroundColor: 'rgba(255,255,255,0.72)' }]} elevation={0}>
          <Text variant="titleMedium" style={styles.motivationTitle}>
            You're on track to finish by {summary.projectedFinishDate ? formatDisplayDate(summary.projectedFinishDate) : 'your goal date'}.
          </Text>
          <Text variant="bodySmall" style={styles.motivationBody}>
            Stay consistent and the app will keep refining your pace.
          </Text>
        </Surface>

        <View style={styles.sectionHeader}>
          <Text variant="titleLarge" style={styles.sectionTitle}>
            Recent Logs
          </Text>
          <Button mode="text" compact onPress={() => router.push('/(tabs)/history')}>
            View All
          </Button>
        </View>

        {logs.length ? (
          logs.slice(0, 3).map((log) => <LogItem key={log.id} log={log} onPress={() => router.push('/(tabs)/history')} />)
        ) : (
          <EmptyState
            title="No logs yet"
            description="Start your first entry to see recent logs and progress updates here."
            actionLabel="Log Hours"
            onAction={() => void openLogScreen()}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 6,
  },
  greeting: {
    fontWeight: '800',
  },
  plusButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  plusSymbol: {
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '400',
    color: '#000000',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  motivationCard: {
    borderRadius: 16,
    padding: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.8)',
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  motivationTitle: {
    fontWeight: '700',
  },
  motivationBody: {
    color: '#636366',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontWeight: '800',
  },
});
