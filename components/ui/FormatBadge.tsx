import { View, Text, StyleSheet } from "react-native";
import { colors, spacing, typography, radius } from "@/constants/theme";

interface FormatBadgeProps {
  label: string;
  color?: string;
  icon?: string;
  size?: "sm" | "md";
}

export function FormatBadge({ label, color, icon, size = "md" }: FormatBadgeProps) {
  const isSmall = size === "sm";

  return (
    <View style={[styles.badge, isSmall && styles.badgeSmall]}>
      {(color || icon) && (
        <View style={styles.indicator}>
          {icon ? (
            <Text style={[styles.icon, isSmall && styles.iconSmall]}>{icon}</Text>
          ) : (
            <View
              style={[
                styles.dot,
                { backgroundColor: color || colors.textTertiary },
                isSmall && styles.dotSmall,
              ]}
            />
          )}
        </View>
      )}
      <Text style={[styles.label, isSmall && styles.labelSmall]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.inputFill,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  indicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  icon: {
    fontSize: 12,
  },
  iconSmall: {
    fontSize: 10,
  },
  label: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  labelSmall: {
    fontSize: 10,
  },
});
