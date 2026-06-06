import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import { colors, spacing, typography, radius, shadows } from "@/constants/theme";

interface ScreenHeaderProps {
  greeting?: string;
  userName: string;
  emoji?: string;
  showLogo?: boolean;
  onActionPress?: () => void;
  actionIcon?: React.ReactNode;
}

export function ScreenHeader({
  greeting,
  userName,
  emoji,
  showLogo = false,
  onActionPress,
  actionIcon,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {showLogo && (
        <Image
          source={require("@/assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      )}
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
  logo: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
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
