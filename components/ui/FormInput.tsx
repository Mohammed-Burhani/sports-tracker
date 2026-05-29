import React, { forwardRef, useState } from 'react';
import { View, TextInput, Text, TextInputProps, StyleSheet } from 'react-native';
import { colors, spacing, typography, radius } from '@/constants/theme';

interface FormInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
}

export const FormInput = forwardRef<TextInput, FormInputProps>(
  ({ label, error, hint, style, onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
      <View style={styles.container}>
        {label && <Text style={styles.label}>{label}</Text>}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          style={[
            styles.input,
            isFocused && styles.inputFocused,
            error && styles.inputError,
            style,
          ]}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : hint ? (
          <Text style={styles.hintText}>{hint}</Text>
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
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.inputFill,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1.5,
    borderColor: colors.inputBorder,
  },
  inputFocused: {
    borderColor: colors.inputFocusBorder,
    backgroundColor: colors.cardSurface,
  },
  inputError: {
    borderColor: colors.danger,
  },
  errorText: {
    ...typography.small,
    color: colors.danger,
    marginTop: spacing.xs,
  },
  hintText: {
    ...typography.small,
    color: colors.textTertiary,
    marginTop: spacing.xs,
  },
});
