import { StyleSheet, View } from 'react-native';
import { Card, Text, useTheme } from 'react-native-paper';

import { appRadius } from '@/constants/theme';

type StatsCardProps = {
  label: string;
  value: string;
  helper?: string;
};

export function StatsCard({ label, value, helper }: StatsCardProps) {
  const theme = useTheme();

  return (
    <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
      <Card.Content style={styles.content}>
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text variant="headlineSmall" style={styles.value}>
          {value}
        </Text>
        {helper ? (
          <View style={styles.helperWrap}>
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {helper}
            </Text>
          </View>
        ) : null}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: appRadius.lg,
  },
  content: {
    minHeight: 132,
  },
  value: {
    marginTop: 8,
    fontWeight: '800',
  },
  helperWrap: {
    marginTop: 10,
  },
});
