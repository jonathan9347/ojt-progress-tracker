import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

import { appPalette, appRadius } from '@/constants/theme';

type ProgressCardProps = {
  completed: number;
  target: number;
  remaining: number;
  percentage: number;
  status: string;
};

const RING_SIZE = 176;
const STROKE_WIDTH = 16;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressCard({ completed, target, remaining, percentage, status }: ProgressCardProps) {
  const theme = useTheme();
  const progress = Math.min(Math.max(percentage / 100, 0), 1);
  const dashOffset = CIRCUMFERENCE - CIRCUMFERENCE * progress;
  const statusColor =
    status === 'Completed' ? appPalette.success : status === 'On Track' ? appPalette.warning : appPalette.danger;

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <View style={styles.header}>
          <View>
            <Text variant="titleLarge" style={styles.title}>
              Progress
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {status}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${statusColor}22` }]}>
            <Text variant="labelLarge" style={{ color: statusColor }}>
              {status}
            </Text>
          </View>
        </View>

        <View style={styles.ringWrap}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ring}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={theme.colors.surfaceVariant}
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RADIUS}
              stroke={theme.colors.tertiary}
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              rotation="-90"
              originX={RING_SIZE / 2}
              originY={RING_SIZE / 2}
            />
          </Svg>

          <View style={styles.ringCenter}>
            <Text variant="displaySmall" style={styles.percentage}>
              {percentage.toFixed(0)}%
            </Text>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Completed
            </Text>
            <Text variant="titleSmall" style={styles.hoursText}>
              {completed.toFixed(1)} / {target.toFixed(0)} hrs
            </Text>
          </View>
        </View>

        <View style={styles.metrics}>
          <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Current
            </Text>
            <Text variant="headlineSmall" style={styles.metricValue}>
              {completed.toFixed(1)}
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Remaining
            </Text>
            <Text variant="headlineSmall" style={styles.metricValue}>
              {remaining.toFixed(1)}
            </Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Goal
            </Text>
            <Text variant="headlineSmall" style={styles.metricValue}>
              {target.toFixed(0)}
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    elevation: 0,
  },
  content: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontWeight: '800',
  },
  badge: {
    borderRadius: appRadius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    transform: [{ rotate: '0deg' }],
  },
  ringCenter: {
    position: 'absolute',
    alignItems: 'center',
    gap: 2,
  },
  percentage: {
    fontWeight: '800',
  },
  hoursText: {
    fontWeight: '700',
  },
  metrics: {
    flexDirection: 'row',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  metricValue: {
    fontWeight: '800',
  },
});
