import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

import { appRadius } from '@/constants/theme';
import { formatDisplayDate } from '@/utils/calculations';
import type { DailyLog } from '@/types';

type LogItemProps = {
  log: DailyLog;
  onPress?: () => void;
};

export function LogItem({ log, onPress }: LogItemProps) {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="contained" onPress={onPress}>
      <Card.Content style={styles.content}>
        <View style={styles.leading}>
          <Text variant="titleMedium" style={styles.dayText}>
            {formatDisplayDate(log.date)}
          </Text>
          <Text numberOfLines={1} variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            {log.notes || 'No notes added.'}
          </Text>
        </View>
        <View style={styles.trailing}>
          <Text variant="headlineSmall" style={{ color: theme.colors.onSurface, fontWeight: '800' }}>
            {log.netHours.toFixed(1)}h
          </Text>
          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
            Break {log.breakMinutes}m
          </Text>
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leading: {
    flex: 1,
    gap: 4,
  },
  trailing: {
    alignItems: 'flex-end',
    gap: 2,
  },
  dayText: {
    fontWeight: '700',
  },
});
