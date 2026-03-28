import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, HelperText, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EmptyState } from '@/components/EmptyState';
import { LogItem } from '@/components/LogItem';
import { appRadius } from '@/constants/theme';
import { useAppState } from '@/hooks/useAppState';
import { formatDisplayDate, validateLogDate } from '@/utils/calculations';

export default function LogScreen() {
  const { logs, addLog } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [date, setDate] = useState(new Date().toISOString());
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [breakMinutes, setBreakMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [error, setError] = useState('');
  const stackedInputs = width < 400;

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowDatePicker(false);
    }
    if (selectedDate) {
      setDate(selectedDate.toISOString());
    }
  };

  const handleSave = async () => {
    const rawHours = Number(hours || 0);
    const rawMinutes = Number(minutes || 0);
    const parsedBreak = Number(breakMinutes || 0);
    const combinedHours = rawHours + rawMinutes / 60;

    if (combinedHours <= 0) {
      setError('Enter hours or minutes greater than zero.');
      return;
    }
    if (combinedHours > 24) {
      setError('Rendered hours cannot exceed 24 hours in a day.');
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

    await addLog({
      date,
      hours: combinedHours,
      breakMinutes: parsedBreak,
      notes,
    });

    setHours('');
    setMinutes('');
    setBreakMinutes('');
    setNotes('');
    setError('');
  };

  return (
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 120,
        },
      ]}
    >
      <Surface style={[styles.hero, { backgroundColor: theme.colors.surface }]} elevation={0}>
        <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
          Log Hours
        </Text>
        <Text variant="headlineLarge" style={styles.heroTitle}>
          Add today’s progress
        </Text>
        <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          Record your rendered time, deduct breaks, and keep short notes for each duty day.
        </Text>
      </Surface>

      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Button mode="outlined" onPress={() => setShowDatePicker(true)} contentStyle={styles.buttonContent}>
          Date: {formatDisplayDate(date)}
        </Button>
        <View style={[styles.row, stackedInputs && styles.rowStacked]}>
          <TextInput
            mode="outlined"
            label="Hours"
            keyboardType="decimal-pad"
            value={hours}
            onChangeText={setHours}
            style={styles.flex}
          />
          <TextInput
            mode="outlined"
            label="Minutes"
            keyboardType="number-pad"
            value={minutes}
            onChangeText={setMinutes}
            style={styles.flex}
          />
        </View>
        <TextInput
          mode="outlined"
          label="Break deduction (minutes)"
          keyboardType="number-pad"
          value={breakMinutes}
          onChangeText={setBreakMinutes}
        />
        <TextInput
          mode="outlined"
          label="Notes"
          multiline
          numberOfLines={4}
          value={notes}
          onChangeText={setNotes}
          style={styles.notes}
        />
        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>
        <Button mode="contained" onPress={handleSave}>
          Save Entry
        </Button>
      </Surface>

      <View style={styles.sectionHeader}>
        <Text variant="titleLarge" style={styles.sectionTitle}>
          Today’s recent logs
        </Text>
      </View>

      {logs.length ? (
        logs.slice(0, 5).map((log) => <LogItem key={log.id} log={log} />)
      ) : (
        <EmptyState title="Nothing logged yet" description="Your latest OJT entries will show up here after you save them." />
      )}

      {showDatePicker ? (
        <DateTimePicker
          mode="date"
          value={new Date(date)}
          display={Platform.OS === 'android' ? 'default' : 'inline'}
          onChange={onDateChange}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  card: {
    padding: 18,
    borderRadius: appRadius.xl,
    gap: 14,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowStacked: {
    flexDirection: 'column',
  },
  flex: {
    flex: 1,
  },
  notes: {
    minHeight: 120,
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontWeight: '700',
  },
  buttonContent: {
    minHeight: 48,
  },
});
