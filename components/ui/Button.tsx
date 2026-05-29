import React from "react";
import { Pressable, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  onPress?: () => void;
  label: string;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  size?: Size;
  /** Optional accent override (e.g. a sport color) for primary fills. */
  color?: string;
  icon?: React.ReactNode;
}

const HEIGHTS: Record<Size, number> = { sm: 40, md: 48, lg: 54 };
const FONT_SIZES: Record<Size, number> = { sm: 14, md: 15, lg: 16 };

export function Button({
  onPress,
  label,
  variant = "primary",
  loading = false,
  disabled = false,
  fullWidth = false,
  size = "md",
  color,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const palette = getPalette(variant, color);
  const height = HEIGHTS[size];
  const fontSize = FONT_SIZES[size];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        {
          height,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: palette.border === "transparent" ? 0 : 1,
          width: fullWidth ? "100%" : undefined,
          opacity: isDisabled ? 0.45 : 1,
          transform: [{ scale: pressed && !isDisabled ? 0.97 : 1 }],
        },
        variant === "primary" && !isDisabled && shadows.card,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.text, { color: palette.text, fontSize }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

function getPalette(variant: Variant, color?: string) {
  switch (variant) {
    case "secondary":
      return { bg: colors.cardSurface, border: colors.borderStrong, text: colors.textPrimary };
    case "ghost":
      return { bg: "transparent", border: "transparent", text: colors.accent };
    case "danger":
      return { bg: colors.status.cancelled.bg, border: "transparent", text: colors.danger };
    case "primary":
    default:
      return {
        bg: color ?? colors.primary,
        border: "transparent",
        text: color ? "#FFFFFF" : colors.onPrimary,
      };
  }
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  text: {
    ...typography.bodyBold,
    fontWeight: "700",
  },
});
