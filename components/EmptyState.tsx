import { StyleSheet, View } from 'react-native';
import { Button, Text, useTheme } from 'react-native-paper';

import { appRadius } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
};

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]}>
      <Text variant="titleMedium" style={styles.title}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <Button mode="contained" onPress={onAction} contentStyle={styles.buttonContent}>
          {actionLabel}
        </Button>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: appRadius.lg,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
  },
  description: {
    textAlign: 'center',
  },
  buttonContent: {
    paddingHorizontal: 8,
  },
});
