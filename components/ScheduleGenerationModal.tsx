import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { colors, spacing, typography, radius } from "@/constants/theme";
import { CheckCircle, XCircle } from "lucide-react-native";

interface ScheduleGenerationModalProps {
  visible: boolean;
  sportEmoji: string;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error?: string;
  result?: {
    teams_created: number;
    courts_created: number;
    matches_created: number;
    rounds_created: number;
  };
  onRetry: () => void;
  onClose: () => void;
}

const PROGRESS_MESSAGES = [
  "Creating your event…",
  "Setting up teams…",
  "Assigning courts…",
  "Generating match schedule…",
  "Preparing standings…",
  "Almost ready…",
];

export function ScheduleGenerationModal({
  visible,
  sportEmoji,
  isLoading,
  isSuccess,
  isError,
  error,
  result,
  onRetry,
  onClose,
}: ScheduleGenerationModalProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  // Rotate messages while loading
  useEffect(() => {
    if (!isLoading) return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % PROGRESS_MESSAGES.length);
    }, 1500);

    return () => clearInterval(interval);
  }, [isLoading]);

  // Animate progress bar
  useEffect(() => {
    if (!isLoading) return;

    Animated.timing(progress, {
      toValue: 1,
      duration: 6000,
      useNativeDriver: false,
    }).start();

    return () => {
      progress.setValue(0);
    };
  }, [isLoading, progress]);

  // Pulse animation for emoji
  useEffect(() => {
    if (!isLoading) return;

    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
      pulseAnim.setValue(1);
    };
  }, [isLoading, pulseAnim]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Loading State */}
          {isLoading && (
            <>
              <Animated.Text
                style={[
                  styles.emoji,
                  { transform: [{ scale: pulseAnim }] },
                ]}
              >
                {sportEmoji}
              </Animated.Text>

              <Text style={styles.message}>
                {PROGRESS_MESSAGES[messageIndex]}
              </Text>

              <View style={styles.progressBarContainer}>
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    { width: progressWidth },
                  ]}
                />
              </View>
            </>
          )}

          {/* Success State */}
          {isSuccess && result && (
            <>
              <View style={styles.iconContainer}>
                <CheckCircle
                  size={64}
                  color={colors.success}
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.successTitle}>Schedule ready ✓</Text>

              <View style={styles.resultStats}>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Teams:</Text>
                  <Text style={styles.resultValue}>{result.teams_created}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Courts:</Text>
                  <Text style={styles.resultValue}>{result.courts_created}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Matches:</Text>
                  <Text style={styles.resultValue}>{result.matches_created}</Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={styles.resultLabel}>Rounds:</Text>
                  <Text style={styles.resultValue}>{result.rounds_created}</Text>
                </View>
              </View>
            </>
          )}

          {/* Error State */}
          {isError && (
            <>
              <View style={styles.iconContainer}>
                <XCircle
                  size={64}
                  color={colors.danger}
                  strokeWidth={2}
                />
              </View>

              <Text style={styles.errorTitle}>Generation Failed</Text>
              <Text style={styles.errorMessage}>
                {error || "An error occurred while generating the schedule"}
              </Text>

              <View style={styles.errorActions}>
                <Pressable
                  onPress={onRetry}
                  style={({ pressed }) => [
                    styles.retryButton,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </Pressable>

                <Pressable
                  onPress={onClose}
                  style={({ pressed }) => [
                    styles.closeButton,
                    { opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <Text style={styles.closeButtonText}>Go to Event</Text>
                </Pressable>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  content: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    alignItems: "center",
    width: "100%",
    maxWidth: 400,
  },
  emoji: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  message: {
    ...typography.heading,
    color: colors.textPrimary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  progressBarContainer: {
    width: "100%",
    height: 6,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  successTitle: {
    ...typography.title,
    color: colors.success,
    marginBottom: spacing.lg,
  },
  resultStats: {
    width: "100%",
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  resultValue: {
    ...typography.bodyBold,
    color: colors.textPrimary,
    fontSize: 16,
  },
  errorTitle: {
    ...typography.title,
    color: colors.danger,
    marginBottom: spacing.md,
  },
  errorMessage: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  errorActions: {
    width: "100%",
    gap: spacing.md,
  },
  retryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
  },
  retryButtonText: {
    ...typography.bodyBold,
    color: colors.textInverse,
  },
  closeButton: {
    backgroundColor: colors.base,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    ...typography.bodyBold,
    color: colors.textSecondary,
  },
});
