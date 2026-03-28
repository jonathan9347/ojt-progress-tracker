import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { Button, HelperText, Surface, Text, TextInput, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAppState } from '@/hooks/useAppState';
import { appPalette, appRadius } from '@/constants/theme';
import { formatDisplayDate, validateProfileDates } from '@/utils/calculations';
import type { UserProfile } from '@/types';

type DateField = 'startDate' | 'endDate' | null;

export default function OnboardingScreen() {
  const { profile, saveUserProfile } = useAppState();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [name, setName] = useState(profile?.name ?? '');
  const [targetHours, setTargetHours] = useState(String(profile?.targetHours ?? 240));
  const [startDate, setStartDate] = useState(profile?.startDate ?? new Date().toISOString());
  const [endDate, setEndDate] = useState(profile?.endDate ?? new Date().toISOString());
  const [dateField, setDateField] = useState<DateField>(null);
  const [error, setError] = useState('');
  const isEditing = Boolean(profile);
  const compact = width < 390;

  const onDateChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setDateField(null);
    }

    if (!selectedDate || !dateField) {
      return;
    }

    const iso = selectedDate.toISOString();
    if (dateField === 'startDate') {
      setStartDate(iso);
    } else {
      setEndDate(iso);
    }
  };

  const handleSave = async () => {
    const parsedTargetHours = Number(targetHours);
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!parsedTargetHours || parsedTargetHours <= 0) {
      setError('Target hours must be greater than zero.');
      return;
    }

    const dateError = validateProfileDates(startDate, endDate);
    if (dateError) {
      setError(dateError);
      return;
    }

    const nextProfile: UserProfile = {
      name: name.trim(),
      targetHours: parsedTargetHours,
      startDate,
      endDate,
      notificationsEnabled: profile?.notificationsEnabled ?? false,
      darkMode: profile?.darkMode ?? false,
    };

    await saveUserProfile(nextProfile);
    router.replace('/(tabs)/dashboard');
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + 40,
        },
      ]}
    >
      <Surface style={styles.hero} elevation={0}>
        <Text variant="labelLarge" style={styles.eyebrow}>
          OJT Progress Tracker
        </Text>
        <Text variant="displaySmall" style={styles.title}>
          Set up your journey
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Follow the cleaner dashboard style from your template and start with a profile that fits your internship timeline.
        </Text>

        <View style={[styles.heroHighlights, compact && styles.heroHighlightsCompact]}>
          <View style={styles.heroChip}>
            <Text variant="labelMedium">Target hours</Text>
            <Text variant="titleMedium" style={styles.heroChipValue}>
              {targetHours || '240'}
            </Text>
          </View>
          <View style={[styles.heroChip, styles.heroChipAccent]}>
            <Text variant="labelMedium">End goal</Text>
            <Text variant="titleMedium" style={styles.heroChipValue}>
              Graduate on track
            </Text>
          </View>
        </View>
      </Surface>

      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text variant="titleLarge" style={styles.cardTitle}>
          {isEditing ? 'Edit Profile' : 'Welcome'}
        </Text>
        <TextInput label="Student name" mode="outlined" value={name} onChangeText={setName} style={styles.input} />
        <TextInput
          label="Target total hours"
          mode="outlined"
          keyboardType="numeric"
          value={targetHours}
          onChangeText={setTargetHours}
          style={styles.input}
        />
        <Button mode="outlined" style={styles.input} onPress={() => setDateField('startDate')} contentStyle={styles.buttonContent}>
          Start date: {formatDisplayDate(startDate)}
        </Button>
        <Button mode="outlined" style={styles.input} onPress={() => setDateField('endDate')} contentStyle={styles.buttonContent}>
          End date: {formatDisplayDate(endDate)}
        </Button>
        <HelperText type="error" visible={Boolean(error)}>
          {error}
        </HelperText>
        <Button mode="contained" onPress={handleSave} style={styles.button}>
          {isEditing ? 'Save Profile' : 'Start Tracking'}
        </Button>
      </Surface>

      {dateField ? (
        <DateTimePicker
          mode="date"
          display={Platform.OS === 'android' ? 'default' : 'inline'}
          value={new Date(dateField === 'startDate' ? startDate : endDate)}
          onChange={onDateChange}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  hero: {
    borderRadius: appRadius.xl,
    padding: 24,
    backgroundColor: appPalette.primarySoft,
  },
  eyebrow: {
    color: appPalette.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  title: {
    marginTop: 8,
    color: appPalette.ink,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 10,
    color: appPalette.ink,
    lineHeight: 24,
  },
  heroHighlights: {
    marginTop: 20,
    flexDirection: 'row',
    gap: 12,
  },
  heroHighlightsCompact: {
    flexDirection: 'column',
  },
  heroChip: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: appRadius.lg,
    padding: 14,
  },
  heroChipAccent: {
    backgroundColor: '#FFF5DF',
  },
  heroChipValue: {
    marginTop: 6,
    fontWeight: '700',
  },
  card: {
    borderRadius: appRadius.xl,
    padding: 20,
  },
  cardTitle: {
    fontWeight: '700',
  },
  input: {
    marginTop: 14,
  },
  button: {
    marginTop: 12,
  },
  buttonContent: {
    minHeight: 48,
  },
});
