import { Pressable, Text, ActivityIndicator, type PressableProps } from 'react-native';

interface ButtonProps extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  loading?: boolean;
  disabled?: boolean;
}

const VARIANT_STYLES: Record<NonNullable<ButtonProps['variant']>, { bg: string; text: string }> = {
  primary: { bg: 'bg-primary-600 active:bg-primary-700', text: 'text-white' },
  secondary: { bg: 'bg-secondary-500 active:bg-secondary-600', text: 'text-neutral-900' },
  outline: { bg: 'bg-transparent border border-primary-600 active:bg-primary-50', text: 'text-primary-600' },
  ghost: { bg: 'bg-transparent active:bg-neutral-100', text: 'text-primary-600' },
  danger: { bg: 'bg-error active:bg-red-700', text: 'text-white' },
};

export function Button({ label, variant = 'primary', loading, disabled, ...props }: ButtonProps) {
  const styles = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      disabled={isDisabled}
      className={`min-h-[52px] flex-row items-center justify-center rounded-lg px-6 ${styles.bg} ${isDisabled ? 'opacity-50' : ''}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#FFFFFF' : '#0E6E4E'} />
      ) : (
        <Text className={`font-body-semibold text-base ${styles.text}`}>{label}</Text>
      )}
    </Pressable>
  );
}
