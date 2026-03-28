import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { router } from 'expo-router';
import { FAB, Surface, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Chart } from '@/components/Chart';
import { EmptyState } from '@/components/EmptyState';
import { ProgressCard } from '@/components/ProgressCard';
import { StatsCard } from '@/components/StatsCard';
import { appPalette, appRadius } from '@/constants/theme';
import { useAppState } from '@/hooks/useAppState';
import { calculateDashboard, formatDisplayDate, getLastNDaysChartData } from '@/utils/calculations';

export default function DashboardScreen() {
  const { profile, logs, refreshData } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const stackedCards = width < 390;

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const summary = calculateDashboard(profile, logs);
  const chart = getLastNDaysChartData(logs, 30);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 110,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
      >
        <Surface style={[styles.hero, { backgroundColor: theme.colors.surface }]} elevation={0}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text variant="labelLarge" style={[styles.kicker, { color: appPalette.inkSoft }]}>
                Dashboard
              </Text>
              <Text variant="headlineLarge" style={[styles.heroTitle, { color: theme.colors.onSurface }]}>
                Good day, {profile?.name ?? 'Student'}
              </Text>
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                Stay on top of your rendered hours with a clearer progress snapshot and recent pace insights.
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.colors.secondaryContainer }]}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSecondaryContainer }}>
                {summary.daysUntilDeadline} days left
              </Text>
            </View>
          </View>

          <View style={[styles.heroFooter, stackedCards && styles.heroFooterStacked]}>
            <View style={styles.heroMetric}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Deadline
              </Text>
              <Text variant="titleMedium" style={styles.heroMetricValue}>
                {profile?.endDate ? formatDisplayDate(profile.endDate) : 'Not set'}
              </Text>
            </View>
            <View style={[styles.heroMetric, styles.heroMetricHighlight]}>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Daily average needed
              </Text>
              <Text variant="titleMedium" style={styles.heroMetricValue}>
                {summary.requiredDailyAverage.toFixed(2)} hrs
              </Text>
            </View>
          </View>
        </Surface>

        <ProgressCard
          completed={summary.totalHours}
          target={profile?.targetHours ?? 240}
          remaining={summary.remainingHours}
          percentage={summary.completionPercentage}
          status={summary.status}
        />

        <View style={[styles.grid, stackedCards && styles.gridStacked]}>
          <StatsCard
            label="Estimated Days Remaining"
            value={summary.estimatedDaysRemaining === null ? '--' : `${summary.estimatedDaysRemaining}`}
            helper="Based on your last 14 days"
          />
          <StatsCard
            label="Required Daily Average"
            value={`${summary.requiredDailyAverage.toFixed(2)} hrs`}
            helper={`${summary.daysUntilDeadline} days until deadline`}
          />
        </View>

        <View style={[styles.grid, stackedCards && styles.gridStacked]}>
          <StatsCard
            label="Projected Finish Date"
            value={summary.projectedFinishDate ? formatDisplayDate(summary.projectedFinishDate) : '--'}
            helper="At your current pace"
          />
          <StatsCard
            label="Remaining Hours"
            value={`${summary.remainingHours.toFixed(2)} hrs`}
            helper={`${summary.averageDailyHours.toFixed(2)} avg/day lately`}
          />
        </View>

        {logs.length ? (
          <Chart labels={chart.labels} values={chart.values} />
        ) : (
          <EmptyState
            title="No logs yet"
            description="Start by adding your first rendered hours. Your dashboard stats and chart will appear here."
            actionLabel="Log Hours"
            onAction={() => router.push('/(tabs)/log')}
          />
        )}
      </ScrollView>

      <FAB
        icon="plus"
        style={[styles.fab, { bottom: tabBarHeight + insets.bottom + 12 }]}
        onPress={() => router.push('/(tabs)/log')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  hero: {
    borderRadius: appRadius.xl,
    padding: 22,
  },
  heroHeader: {
    gap: 18,
  },
  heroCopy: {
    gap: 10,
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  heroTitle: {
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    borderRadius: appRadius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  heroFooter: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  heroFooterStacked: {
    flexDirection: 'column',
  },
  grid: {
    flexDirection: 'row',
    gap: 12,
  },
  gridStacked: {
    flexDirection: 'column',
  },
  heroMetric: {
    flex: 1,
    borderRadius: appRadius.lg,
    backgroundColor: appPalette.surfaceMuted,
    padding: 14,
  },
  heroMetricHighlight: {
    backgroundColor: '#FFF7E8',
  },
  heroMetricValue: {
    marginTop: 6,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: 20,
    backgroundColor: appPalette.info,
  },
});
