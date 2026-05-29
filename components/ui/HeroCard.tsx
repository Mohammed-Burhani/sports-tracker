import React from 'react';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, radius, shadows } from '@/constants/theme';

interface HeroCardProps {
  title: string;
  gradientStart: string;
  gradientEnd: string;
  onPress?: () => void;
  metadata?: string;
  emoji?: string;
}

export function HeroCard({
  title,
  gradientStart,
  gradientEnd,
  onPress,
  metadata,
  emoji,
}: HeroCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.container,
        shadows.cardElevated,
        { transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={[gradientStart, gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Scrim keeps white text legible across all sport colors */}
        <LinearGradient
          colors={['rgba(20,16,12,0.05)', 'rgba(20,16,12,0.55)']}
          style={StyleSheet.absoluteFill}
        />
        {metadata && (
          <View style={styles.metadataContainer}>
            <View style={styles.metadataPill}>
              <Text style={styles.metadataText}>{metadata}</Text>
            </View>
          </View>
        )}
        <View style={styles.titleContainer}>
          {emoji && <Text style={styles.emoji}>{emoji}</Text>}
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: radius.xxl,
    overflow: 'hidden',
    height: 160,
  },
  gradient: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  metadataContainer: {
    alignItems: 'flex-start',
  },
  metadataPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  metadataText: {
    ...typography.small,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  titleContainer: {
    gap: spacing.xs,
  },
  emoji: {
    fontSize: 30,
  },
  title: {
    ...typography.heading,
    color: '#FFFFFF',
  },
});
