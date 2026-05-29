import React from "react";
import { View, Text } from "react-native";
import { colors, spacing, radius, typography } from "@/constants/theme";

interface BadgeProps {
  label: string;
  color?: string;
  size?: "sm" | "md";
}

export function Badge({ label, color, size = "md" }: BadgeProps) {
  const isSmall = size === "sm";

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        backgroundColor: colors.inputFill,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius.pill,
        paddingHorizontal: isSmall ? spacing.sm : spacing.md,
        paddingVertical: isSmall ? 4 : 5,
      }}
    >
      {color && (
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
      )}
      <Text
        style={{
          ...typography.small,
          color: colors.textSecondary,
          fontSize: isSmall ? 10 : 11,
          fontWeight: "700",
          letterSpacing: 0.4,
        }}
      >
        {label.toUpperCase()}
      </Text>
    </View>
  );
}
