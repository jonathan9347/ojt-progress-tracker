import { StyleSheet } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

import { appRadius } from '@/constants/theme';

type StatsCardProps = {
  label: string;
  value: string;
};

export function StatsCard({ label, value }: StatsCardProps) {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="headlineSmall" style={styles.value}>
          {value}
        </Text>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 12,
    elevation: 0,
  },
  content: {
    minHeight: 92,
    justifyContent: 'center',
    gap: 6,
  },
  value: {
    fontWeight: '800',
  },
});
