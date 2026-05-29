import React, { useEffect, useRef } from "react";
import { Animated, View, ViewProps, StyleSheet } from "react-native";
import { colors, spacing, radius, shadows } from "@/constants/theme";

interface SkeletonProps extends ViewProps {
  width?: number | string;
  height?: number;
  rounded?: boolean;
  circle?: boolean;
}

export function Skeleton({
  width = "100%",
  height = 16,
  rounded = false,
  circle = false,
  style,
  ...props
}: SkeletonProps) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const borderRadius = circle ? 9999 : rounded ? radius.md : radius.sm;

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height: circle ? width as number : height,
          backgroundColor: colors.inputFill,
          borderRadius,
          opacity: anim,
        },
        style,
      ]}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={[styles.card, shadows.card]}>
      <Skeleton height={20} width="60%" rounded />
      <View style={{ height: spacing.sm }} />
      <Skeleton height={14} width="40%" rounded />
      <View style={{ height: spacing.md }} />
      <Skeleton height={12} width="80%" rounded />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSurface,
    borderRadius: radius.xxl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
});
