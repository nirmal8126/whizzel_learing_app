import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { Fonts, Type } from '@/constants/theme';

type Variant = keyof typeof Type;

export type TextProps = RNTextProps & {
  variant?: Variant;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
};

const WEIGHT_FONT: Record<NonNullable<TextProps['weight']>, string> = {
  regular: Fonts.regular,
  medium: Fonts.medium,
  semibold: Fonts.semibold,
  bold: Fonts.bold,
};

/**
 * Drop-in replacement for RN's Text that defaults to the Fredoka font.
 * Use `variant` for our type scale (h1/h2/body/etc.) or `weight` for ad-hoc.
 */
export function Text({ variant, weight, style, ...rest }: TextProps) {
  const variantStyle = variant ? Type[variant] : undefined;
  const weightStyle: TextStyle | undefined = weight ? { fontFamily: WEIGHT_FONT[weight] } : undefined;
  // If neither variant nor weight is given, default to regular Fredoka
  const fallback: TextStyle | undefined =
    !variant && !weight ? { fontFamily: Fonts.regular } : undefined;

  return <RNText {...rest} style={[fallback, variantStyle, weightStyle, style]} />;
}
