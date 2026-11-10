import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { IconName } from '@/lib/theme';
import { colors, radius, shadows, STATUS_META } from '@/lib/theme';
import type { OSStatus } from '@/lib/types';

type ButtonVariant =
  | 'primary'
  | 'soft'
  | 'outline'
  | 'danger'
  | 'dangerSoft'
  | 'ghost'
  | 'inverse'
  | 'inverseGhost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  iconRight?: IconName;
  disabled?: boolean;
  loading?: boolean;
  size?: ButtonSize;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

const BUTTON_PALETTE: Record<
  ButtonVariant,
  { background: string; text: string; border: string }
> = {
  primary: { background: colors.primary, text: colors.white, border: colors.primary },
  soft: { background: colors.primarySoft, text: colors.primary, border: colors.primarySoft },
  outline: { background: colors.surface, text: colors.textSecondary, border: colors.borderStrong },
  danger: { background: colors.dangerSolid, text: colors.white, border: colors.dangerSolid },
  dangerSoft: { background: colors.dangerSoft, text: colors.danger, border: colors.dangerSoft },
  ghost: { background: 'transparent', text: colors.textSecondary, border: 'transparent' },
  inverse: { background: colors.white, text: colors.primary, border: colors.white },
  inverseGhost: {
    background: 'transparent',
    text: colors.white,
    border: 'rgba(255, 255, 255, 0.5)',
  },
};

const BUTTON_HEIGHT: Record<ButtonSize, number> = { sm: 38, md: 46, lg: 52 };

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  iconRight,
  disabled = false,
  loading = false,
  size = 'md',
  fullWidth = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const palette = BUTTON_PALETTE[variant];
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          height: BUTTON_HEIGHT[size],
          backgroundColor: palette.background,
          borderColor: palette.border,
        },
        fullWidth && styles.fullWidth,
        pressed && !inactive && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.text} size="small" />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 16 : 18} color={palette.text} /> : null}
          <Text
            style={[
              styles.buttonLabel,
              { color: palette.text, fontSize: size === 'sm' ? 13 : 15 },
            ]}
          >
            {label}
          </Text>
          {iconRight ? (
            <Ionicons name={iconRight} size={size === 'sm' ? 16 : 18} color={palette.text} />
          ) : null}
        </>
      )}
    </Pressable>
  );
}

interface IconButtonProps {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  backgroundColor?: string;
  size?: number;
  accessibilityLabel: string;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}

export function IconButton({
  icon,
  onPress,
  color = colors.textSecondary,
  backgroundColor = colors.surface,
  size = 20,
  accessibilityLabel,
  style,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { backgroundColor },
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}

export function Card({ children, style, padded = true }: CardProps) {
  return <View style={[styles.card, padded && styles.cardPadded, style]}>{children}</View>;
}

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  icon?: IconName;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function SectionTitle({ title, subtitle, icon, right, style }: SectionTitleProps) {
  return (
    <View style={[styles.sectionTitleRow, style]}>
      <View style={styles.sectionTitleLeft}>
        {icon ? (
          <View style={styles.sectionIcon}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
        ) : null}
        <View style={styles.flex}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
        </View>
      </View>
      {right}
    </View>
  );
}

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
}

export function Field({
  label,
  hint,
  error,
  required,
  containerStyle,
  multiline,
  onFocus,
  onBlur,
  ...inputProps
}: FieldProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.field, containerStyle]}>
      <Text style={styles.fieldLabel}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      <TextInput
        {...inputProps}
        multiline={multiline}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          multiline && styles.textArea,
          focused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      />
      {error ? (
        <Text style={styles.fieldError}>{error}</Text>
      ) : hint ? (
        <Text style={styles.fieldHint}>{hint}</Text>
      ) : null}
    </View>
  );
}

interface FormAlertProps {
  errors: string[];
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function FormAlert({
  errors,
  title = 'Corrija os dados destacados',
  style,
}: FormAlertProps) {
  if (errors.length === 0) return null;

  return (
    <View
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      style={[styles.formAlert, style]}
    >
      <Ionicons name="alert-circle" size={18} color={colors.danger} />
      <View style={styles.flex}>
        <Text style={styles.formAlertTitle}>{title}</Text>
        {errors.map((error, index) => (
          <Text key={`${error}-${index}`} style={styles.formAlertText}>
            • {error}
          </Text>
        ))}
      </View>
    </View>
  );
}

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  color?: string;
  backgroundColor?: string;
  selectedColor?: string;
  selectedBackgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

export function Chip({
  label,
  selected = false,
  onPress,
  icon,
  color = colors.textMuted,
  backgroundColor = colors.surface,
  selectedColor = colors.white,
  selectedBackgroundColor = colors.primary,
  style,
}: ChipProps) {
  const textColor = selected ? selectedColor : color;
  const borderColor = selected ? selectedBackgroundColor : colors.border;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? selectedBackgroundColor : backgroundColor, borderColor },
        pressed && styles.pressed,
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={textColor} /> : null}
      <Text style={[styles.chipLabel, { color: textColor }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

export function StatusBadge({ status, compact = false }: { status: OSStatus; compact?: boolean }) {
  const meta = STATUS_META[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: meta.bg }, compact && styles.statusBadgeCompact]}>
      <Ionicons name={meta.icon} size={compact ? 12 : 13} color={meta.color} />
      <Text
        style={[styles.statusLabel, { color: meta.color, fontSize: compact ? 11 : 12 }]}
        numberOfLines={1}
      >
        {compact ? meta.shortLabel : meta.label}
      </Text>
    </View>
  );
}

export function Tag({
  label,
  color = colors.textMuted,
  backgroundColor = colors.surfaceMuted,
}: {
  label: string;
  color?: string;
  backgroundColor?: string;
}) {
  return (
    <View style={[styles.tag, { backgroundColor }]}>
      <Text style={[styles.tagLabel, { color }]}>{label}</Text>
    </View>
  );
}

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
  left?: React.ReactNode;
}

export function ScreenHeader({ title, subtitle, onBack, right, left }: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      <View style={styles.headerRow}>
        {onBack ? (
          <IconButton
            icon="arrow-back"
            onPress={onBack}
            accessibilityLabel="Voltar"
            backgroundColor={colors.surface}
            style={styles.headerBack}
          />
        ) : null}
        {left}
        <View style={styles.flex}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right}
      </View>
    </View>
  );
}

interface EmptyStateProps {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.empty, compact && styles.emptyCompact]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={28} color={colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      {description ? <Text style={styles.emptyDescription}>{description}</Text> : null}
      {actionLabel && onAction ? (
        <Button
          label={actionLabel}
          onPress={onAction}
          variant="soft"
          size="sm"
          style={styles.emptyButton}
        />
      ) : null}
    </View>
  );
}

interface StatCardProps {
  icon: IconName;
  value: number;
  label: string;
  color: string;
  backgroundColor: string;
  onPress?: () => void;
}

export function StatCard({
  icon,
  value,
  label,
  color,
  backgroundColor,
  onPress,
}: StatCardProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.statCard, pressed && onPress && styles.pressed]}
    >
      <View style={[styles.statIcon, { backgroundColor }]}>
        <Ionicons name={icon} size={16} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={2}>
        {label}
      </Text>
    </Pressable>
  );
}

interface InfoRowProps {
  icon: IconName;
  label: string;
  value: string;
  valueColor?: string;
  onPress?: () => void;
  right?: React.ReactNode;
}

export function InfoRow({ icon, label, value, valueColor, onPress, right }: InfoRowProps) {
  return (
    <Pressable
      accessibilityRole={onPress ? 'button' : undefined}
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [styles.infoRow, pressed && onPress && styles.pressed]}
    >
      <View style={styles.infoIcon}>
        <Ionicons name={icon} size={16} color={colors.textMuted} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, valueColor ? { color: valueColor } : null]}>
          {value}
        </Text>
      </View>
      {right ??
        (onPress ? (
          <Ionicons name="chevron-forward" size={16} color={colors.borderStrong} />
        ) : null)}
    </Pressable>
  );
}

export function Divider({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.divider, style]} />;
}

interface SearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}

export function SearchBar({ value, onChangeText, placeholder }: SearchBarProps) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={18} color={colors.textMuted} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        style={styles.searchInput}
        returnKeyType="search"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Limpar busca"
          onPress={() => onChangeText('')}
          hitSlop={10}
        >
          <Ionicons name="close-circle" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.45 },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  fullWidth: { width: '100%' },
  buttonLabel: {
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  cardPadded: { padding: 16 },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  field: { marginBottom: 14 },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 7,
  },
  required: { color: colors.dangerSolid },
  input: {
    minHeight: 46,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  inputFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.white,
  },
  inputError: {
    borderColor: colors.dangerSolid,
    backgroundColor: '#FFF8F8',
  },
  fieldHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 5,
    lineHeight: 16,
  },
  fieldError: {
    fontSize: 12,
    color: colors.danger,
    marginTop: 5,
    fontWeight: '600',
  },
  formAlert: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 11,
  },
  formAlertTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: colors.danger,
    marginBottom: 3,
  },
  formAlertText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.danger,
    lineHeight: 17,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 36,
  },
  chipLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
    maxWidth: 160,
  },
  statusBadgeCompact: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusLabel: {
    fontWeight: '800',
  },
  tag: {
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  tagLabel: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: colors.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 42,
  },
  headerBack: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: colors.textMuted,
    marginTop: 1,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyCompact: { paddingVertical: 22 },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 6,
    maxWidth: 300,
  },
  emptyButton: { marginTop: 14 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    minHeight: 108,
  },
  statIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 23,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11.5,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    paddingVertical: 9,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 13,
    minHeight: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 14.5,
    color: colors.text,
    paddingVertical: 10,
  },
});
