import { Pressable, Text, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { getSportMeta } from "@/constants/sports";
import { Sport } from "@/types";

interface SportChipProps {
  sport?: Sport;
  emoji?: string;
  label?: string;
  selected?: boolean;
  onPress?: () => void;
  gradientStart?: string;
  gradientEnd?: string;
  size?: "sm" | "md";
}

export function SportChip({
  sport,
  emoji: emojiProp,
  label: labelProp,
  selected = false,
  onPress,
  gradientStart,
  gradientEnd,
  size = "md",
}: SportChipProps) {
  // If sport prop is provided, get metadata
  const sportMeta = sport ? getSportMeta(sport) : null;
  const emoji = emojiProp ?? sportMeta?.emoji ?? "";
  const label = labelProp ?? sportMeta?.label ?? "";
  const isSmall = size === "sm";
  if (selected && gradientStart && gradientEnd) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityState={{ selected }}
        style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.8 : 1 }]}
      >
        <LinearGradient
          colors={[gradientStart, gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.gradient, isSmall && styles.gradientSmall]}
        >
          <Text style={[styles.emoji, isSmall && styles.emojiSmall]}>{emoji}</Text>
          <Text style={[styles.labelSelected, isSmall && styles.labelSelectedSmall]}>{label}</Text>
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        styles.chipDefault,
        isSmall && styles.chipSmall,
        selected && styles.chipSelected,
        { opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.emoji, isSmall && styles.emojiSmall]}>{emoji}</Text>
      <Text style={[styles.label, isSmall && styles.labelSmall, selected && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  chipDefault: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.cardSurface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  labelActive: {
    color: colors.accentInk,
    fontWeight: "700",
  },
  labelSelected: {
    ...typography.caption,
    color: colors.textInverse,
    fontWeight: "700",
  },
});
