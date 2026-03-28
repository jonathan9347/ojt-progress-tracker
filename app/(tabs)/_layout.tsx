import { FontAwesome5 } from '@expo/vector-icons';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { Tabs } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabName = 'dashboard' | 'log' | 'history' | 'settings';

const TAB_ICONS: Record<TabName, React.ComponentProps<typeof FontAwesome5>['name']> = {
  dashboard: 'chart-line',
  log: 'clock',
  history: 'history',
  settings: 'cog',
};

function AnimatedTabIcon({
  name,
  color,
  size,
  isAnimating,
}: {
  name: TabName;
  color: string;
  size: number;
  isAnimating: boolean;
}) {
  if (isAnimating) {
    return (
      <LottieView
        source={require('../../assets/animations/circle_animation.json')}
        autoPlay
        loop={false}
        style={styles.lottieIcon}
      />
    );
  }

  return <FontAwesome5 name={TAB_ICONS[name]} color={color} size={size} />;
}

export default function TabsLayout() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [animatedTab, setAnimatedTab] = useState<TabName | null>(null);

  useEffect(() => {
    if (!animatedTab) {
      return;
    }

    const timeout = setTimeout(() => setAnimatedTab(null), 900);
    return () => clearTimeout(timeout);
  }, [animatedTab]);

  const createTabButton =
    (tabName: TabName) =>
    ({ onPress, onLongPress, accessibilityState, accessibilityLabel, testID, children }: BottomTabBarButtonProps) => (
      <Pressable
        onPress={(event) => {
          setAnimatedTab(tabName);
          onPress?.(event);
        }}
        onLongPress={onLongPress}
        style={styles.tabButton}
        accessibilityState={accessibilityState}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
      >
        {children}
      </Pressable>
    );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          height: 74 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 12),
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000000',
          shadowOpacity: 0.08,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: -6 },
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          position: 'absolute',
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Dashboard',
          tabBarButton: createTabButton('dashboard'),
          tabBarIcon: ({ color, size }) => (
            <AnimatedTabIcon name="dashboard" color={color} size={size} isAnimating={animatedTab === 'dashboard'} />
          ),
        }}
      />
      <Tabs.Screen
        name="log"
        options={{
          title: 'Log',
          tabBarButton: createTabButton('log'),
          tabBarIcon: ({ color, size }) => <AnimatedTabIcon name="log" color={color} size={size} isAnimating={animatedTab === 'log'} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarButton: createTabButton('history'),
          tabBarIcon: ({ color, size }) => (
            <AnimatedTabIcon name="history" color={color} size={size} isAnimating={animatedTab === 'history'} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarButton: createTabButton('settings'),
          tabBarIcon: ({ color, size }) => (
            <AnimatedTabIcon name="settings" color={color} size={size} isAnimating={animatedTab === 'settings'} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottieIcon: {
    width: 28,
    height: 28,
  },
});
