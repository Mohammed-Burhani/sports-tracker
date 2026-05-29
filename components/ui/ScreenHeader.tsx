import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

interface ScreenHeaderProps {
  greeting?: string;
  userName: string;
  emoji?: string;
  onActionPress?: () => void;
  actionIcon?: React.ReactNode;
}

export function ScreenHeader({
  greeting,
  userName,
  emoji,
  onActionPress,
  actionIcon,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        {greeting && (
          <Text style={styles.greeting}>
            {greeting} {emoji}
          </Text>
        )}
        <Text style={styles.userName}>{userName}</Text>
      </View>
      {onActionPress && actionIcon && (
        <TouchableOpacity
          style={[styles.actionButton, shadows.card]}
          onPress={onActionPress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Create new"
        >
          {actionIcon}
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
    marginBottom: spacing.xl,
  },
  textContainer: {
    flex: 1,
  },
  greeting: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  userName: {
    ...typography.title,
    color: colors.textPrimary,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.cardSurface,
    alignItems: "center",
    justifyContent: "center",
  },
});
