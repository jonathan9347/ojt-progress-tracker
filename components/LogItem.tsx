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
        <View style={styles.row}>
          <View style={styles.dateBadge}>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              Logged
            </Text>
            <Text variant="titleMedium" style={styles.dateText}>
              {formatDisplayDate(log.date)}
            </Text>
          </View>
          <Text variant="titleMedium" style={{ color: theme.colors.primary, fontWeight: '800' }}>
            {log.netHours.toFixed(2)} hrs
          </Text>
        </View>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          Raw {log.hours.toFixed(2)} hrs • Break {log.breakMinutes} min
        </Text>
        <Text numberOfLines={2} variant="bodyMedium" style={styles.notes}>
          {log.notes || 'No notes added.'}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: appRadius.lg,
  },
  content: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  dateBadge: {
    flexShrink: 1,
  },
  dateText: {
    fontWeight: '700',
  },
  notes: {
    marginTop: 4,
  },
});
