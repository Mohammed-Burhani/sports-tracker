import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        { paddingBottom: insets.bottom + spacing.sm, paddingHorizontal: spacing.lg },
      ]}
    >
      <View style={[styles.tabBar, shadows.floating]}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = (options.title || route.name) as string;
          const tint = isFocused ? colors.accent : colors.textTertiary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          const icon = options.tabBarIcon?.({ focused: isFocused, color: tint, size: 22 });

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={label}
              style={({ pressed }) => [
                styles.tab,
                isFocused && styles.tabActive,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              {icon}
              {isFocused && <Text style={styles.label}>{label}</Text>}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.cardSurface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tabActive: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.md,
    flex: 1.6,
  },
  label: {
    ...typography.small,
    color: colors.accentInk,
    fontWeight: '700',
  },
});
