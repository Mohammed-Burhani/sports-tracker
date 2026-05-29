import React, { forwardRef, useState } from "react";
import { View, TextInput, Text, TextInputProps, StyleSheet } from "react-native";
import { colors, spacing, typography, radius } from "@/constants/theme";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<TextInput, InputProps>(
  ({ label, error, hint, style, onFocus, onBlur, ...props }, ref) => {
    const [focused, setFocused] = useState(false);

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            focused && styles.inputFocused,
            error && styles.inputError,
            style,
          ]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hint}>{hint}</Text>
        ) : null}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputFill,
    borderColor: colors.inputBorder,
    borderWidth: 1.5,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: colors.inputFocusBorder,
    backgroundColor: colors.cardSurface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  error: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  hint: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
