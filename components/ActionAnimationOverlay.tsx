import { Modal, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { Surface, Text, useTheme } from 'react-native-paper';

type ActionAnimationOverlayProps = {
  visible: boolean;
  title?: string;
  description?: string;
};

export function ActionAnimationOverlay({
  visible,
  title = 'Working on it',
  description = 'Please wait a moment...',
}: ActionAnimationOverlayProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={2}>
          <LottieView
            source={require('../assets/animations/sync-data.json')}
            autoPlay
            loop
            style={styles.animation}
          />
          <Text variant="titleMedium" style={styles.title}>
            {title}
          </Text>
          <Text variant="bodyMedium" style={[styles.description, { color: theme.colors.onSurfaceVariant }]}>
            {description}
          </Text>
        </Surface>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 280,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  animation: {
    width: 120,
    height: 120,
  },
  title: {
    fontWeight: '700',
    marginTop: 6,
  },
  description: {
    textAlign: 'center',
    marginTop: 6,
  },
});
