import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useMemo, useState } from 'react';
import { Alert, Platform, RefreshControl, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { Button, Dialog, Portal, SegmentedButtons, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { LogItem } from '@/components/LogItem';
import { appRadius } from '@/constants/theme';
import { useAppState } from '@/hooks/useAppState';
import { formatDisplayDate, getFilteredLogs, validateLogDate } from '@/utils/calculations';
import type { DailyLog, HistoryFilter } from '@/types';

export default function HistoryScreen() {
  const { logs, deleteLog, updateLog, refreshData } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [date, setDate] = useState('');
  const [hours, setHours] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const compactDialog = width < 390;

  const visibleLogs = useMemo(() => getFilteredLogs(logs, filter), [logs, filter]);

  const startEdit = (log: DailyLog) => {
    setEditingLog(log);
    setDate(log.date);
    setHours(String(log.hours));
    setBreakMinutes(String(log.breakMinutes));
    setNotes(log.notes);
    setError('');
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete log?', 'This entry will be removed permanently.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void deleteLog(id) },
    ]);
  };

  const handleUpdate = async () => {
    if (!editingLog) {
      return;
    }
    const parsedHours = Number(hours || 0);
    const parsedBreak = Number(breakMinutes || 0);

    if (parsedHours <= 0 || parsedHours > 24) {
      setError('Hours must be greater than zero and not more than 24.');
      return;
    }
    if (parsedBreak < 0 || parsedBreak > 1440) {
      setError('Break minutes must be between 0 and 1440.');
      return;
    }
    const dateError = validateLogDate(date);
    if (dateError) {
      setError(dateError);
      return;
    }

    await updateLog(editingLog.id, {
      date,
      hours: parsedHours,
      breakMinutes: parsedBreak,
      notes,
    });
    setEditingLog(null);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const renderRightActions = (id: string) => (
    <View style={styles.deleteAction}>
      <Button mode="contained" buttonColor={theme.colors.error} onPress={() => handleDelete(id)}>
        Delete
      </Button>
    </View>
  );

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate.toISOString());
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + 12,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.colors.primary} />}
      >
        <View style={[styles.hero, { backgroundColor: theme.colors.surface }]}>
          <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
            History
          </Text>
          <Text variant="headlineLarge" style={styles.heroTitle}>
            Review every entry
          </Text>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
            Filter your logs, tap any card to edit it, or swipe to delete entries you no longer need.
          </Text>
        </View>

        <SegmentedButtons
          value={filter}
          onValueChange={(value) => setFilter(value as HistoryFilter)}
          buttons={[
            { value: 'all', label: 'All' },
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
          ]}
        />

        {visibleLogs.length ? (
          visibleLogs.map((log) => (
            <Swipeable key={log.id} renderRightActions={() => renderRightActions(log.id)}>
              <LogItem log={log} onPress={() => startEdit(log)} />
            </Swipeable>
          ))
        ) : (
          <EmptyState title="No matching logs" description="Try another filter or add a fresh OJT entry." />
        )}
      </ScrollView>

      <Portal>
        <Dialog visible={Boolean(editingLog)} onDismiss={() => setEditingLog(null)} style={compactDialog ? styles.dialogCompact : undefined}>
          <Dialog.Title>Edit Entry</Dialog.Title>
          <Dialog.Content style={styles.dialogContent}>
            <Button mode="outlined" onPress={() => setShowDatePicker(true)} contentStyle={styles.dialogButtonContent}>
              Date: {date ? formatDisplayDate(date) : 'Select date'}
            </Button>
            <TextInput mode="outlined" label="Hours" keyboardType="decimal-pad" value={hours} onChangeText={setHours} />
            <TextInput
              mode="outlined"
              label="Break deduction (minutes)"
              keyboardType="number-pad"
              value={breakMinutes}
              onChangeText={setBreakMinutes}
            />
            <TextInput mode="outlined" label="Notes" multiline numberOfLines={4} value={notes} onChangeText={setNotes} />
            <Text style={{ color: theme.colors.error }}>{error}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditingLog(null)}>Cancel</Button>
            <Button onPress={() => void handleUpdate()}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {showDatePicker ? (
        <DateTimePicker
          mode="date"
          value={date ? new Date(date) : new Date()}
          display={Platform.OS === 'android' ? 'default' : 'inline'}
          onChange={onDateChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 14,
  },
  hero: {
    borderRadius: appRadius.xl,
    padding: 22,
    gap: 8,
  },
  heroTitle: {
    fontWeight: '800',
  },
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 12,
  },
  dialogContent: {
    gap: 12,
  },
  dialogCompact: {
    marginHorizontal: 16,
  },
  dialogButtonContent: {
    minHeight: 48,
  },
});
