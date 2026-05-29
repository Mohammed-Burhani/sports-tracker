import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { colors, spacing, typography } from "@/constants/theme";

interface SectionHeaderProps {
  label: string;
  emoji?: string;
  onActionPress?: () => void;
  actionLabel?: string;
}

export function SectionHeader({
  label,
  emoji,
  onActionPress,
  actionLabel = "See all",
}: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {emoji && `${emoji} `}
        {label}
      </Text>
      {onActionPress && (
        <TouchableOpacity
          onPress={onActionPress}
          style={styles.action}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <ChevronRight color={colors.accent} size={14} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.md,
  },
  label: {
    ...typography.heading,
    color: colors.textPrimary,
  },
  action: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  actionText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: "700",
  },
});
