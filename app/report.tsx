import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, Card, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/useAppState';
import { EmptyState } from '@/components/EmptyState';
import { appRadius } from '@/constants/theme';
import { buildSummaryText, copySummary, createPdfReport, shareFile } from '@/utils/export';
import { calculateDashboard, formatDisplayDate } from '@/utils/calculations';

export default function ReportScreen() {
  const { profile, logs } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const summary = calculateDashboard(profile, logs);
  const summaryText = buildSummaryText(profile, logs);

  const handlePdfShare = async () => {
    const uri = await createPdfReport(profile, logs);
    await shareFile(uri);
  };

  const handleCopy = async () => {
    await copySummary(profile, logs);
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.title}>
          Report Preview
        </Text>
        <Button mode="text" onPress={() => router.back()}>
          Close
        </Button>
      </View>

      {!logs.length ? (
        <EmptyState title="No logs yet" description="Add a few OJT entries first, then come back to generate a report." />
      ) : (
        <>
          <Card style={styles.card}>
            <Card.Content style={styles.gap}>
              <Text variant="titleLarge">{profile?.name ?? 'Student Profile'}</Text>
              <Text variant="bodyMedium">Target Hours: {profile?.targetHours ?? 240}</Text>
              <Text variant="bodyMedium">Start Date: {profile?.startDate ? formatDisplayDate(profile.startDate) : 'Not set'}</Text>
              <Text variant="bodyMedium">Deadline: {profile?.endDate ? formatDisplayDate(profile.endDate) : 'Not set'}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content style={styles.gap}>
              <Text variant="titleMedium">Summary</Text>
              <Text>Total Hours Rendered: {summary.totalHours.toFixed(2)}</Text>
              <Text>Remaining Hours: {summary.remainingHours.toFixed(2)}</Text>
              <Text>Completion Percentage: {summary.completionPercentage.toFixed(1)}%</Text>
              <Text>Status: {summary.status}</Text>
            </Card.Content>
          </Card>

          <Card style={styles.card}>
            <Card.Content style={styles.gap}>
              <Text variant="titleMedium">Daily Logs</Text>
              <Text selectable>{summaryText}</Text>
            </Card.Content>
          </Card>

          <View style={styles.actions}>
            <Button mode="contained" onPress={handlePdfShare}>
              Export PDF
            </Button>
            <Button mode="outlined" onPress={handleCopy}>
              Copy Summary
            </Button>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  card: {
    borderRadius: appRadius.lg,
  },
  gap: {
    gap: 8,
  },
  actions: {
    gap: 12,
  },
  title: {
    fontWeight: '800',
  },
});
