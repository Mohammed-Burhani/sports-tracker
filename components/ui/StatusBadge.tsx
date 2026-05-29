import { View, Text, StyleSheet } from "react-native";
import { EventStatus, SessionStatus } from "@/types";
import { colors, spacing, typography, radius } from "@/constants/theme";

interface StatusBadgeProps {
  status: EventStatus | SessionStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: StatusBadgeProps) {
  const palette = colors.status[status as keyof typeof colors.status];
  const isSmall = size === "sm";

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: palette.bg },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: palette.text },
          isSmall && styles.labelSmall,
        ]}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeSmall: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  label: {
    ...typography.small,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  labelSmall: {
    fontSize: 10,
  },
});
