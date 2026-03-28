import { StyleSheet, View } from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';

import { appPalette, appRadius } from '@/constants/theme';

type ProgressCardProps = {
  completed: number;
  target: number;
  remaining: number;
  percentage: number;
  status: string;
};

export function ProgressCard({ completed, target, remaining, percentage, status }: ProgressCardProps) {
  const theme = useTheme();
  const statusColor =
    status === 'Completed'
      ? appPalette.success
      : status === 'On Track'
      ? appPalette.warning
      : appPalette.danger;

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.headingRow}>
          <View>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              Progress Overview
            </Text>
            <Text variant="headlineLarge" style={[styles.primaryValue, { color: theme.colors.onSurface }]}>
              {percentage.toFixed(1)}%
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusColor }]}>
            <Text variant="labelMedium" style={styles.statusText}>
              {status}
            </Text>
          </View>
        </View>

        <View style={[styles.meterCard, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {completed.toFixed(2)} of {target.toFixed(2)} hours completed
          </Text>
          <ProgressBar progress={Math.min(percentage / 100, 1)} color={theme.colors.primary} style={styles.progress} />
        </View>

        <View style={styles.row}>
          <View style={styles.metricTile}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Logged
            </Text>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {completed.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.metricTile, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Remaining
            </Text>
            <Text variant="titleLarge" style={{ color: theme.colors.onSurface }}>
              {remaining.toFixed(2)}
            </Text>
          </View>
        </View>

        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Keep a steady rhythm and the dashboard will keep projecting your finish date for you.
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: appRadius.xl,
  },
  content: {
    gap: 16,
  },
  headingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  primaryValue: {
    marginTop: 6,
    fontWeight: '800',
  },
  meterCard: {
    borderRadius: appRadius.lg,
    padding: 16,
  },
  progress: {
    marginTop: 12,
    height: 12,
    borderRadius: appRadius.pill,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricTile: {
    flex: 1,
    minWidth: 120,
    borderRadius: appRadius.lg,
    padding: 16,
    backgroundColor: '#F8FBF6',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderRadius: appRadius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusText: {
    color: '#fff',
    fontWeight: '700',
  },
});
