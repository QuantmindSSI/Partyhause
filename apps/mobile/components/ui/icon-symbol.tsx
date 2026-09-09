// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/**
 * SF Symbol names in their plain string form.
 *
 * expo-symbols 57 widened `SymbolViewProps['name']` to
 * `SFSymbols7_0 | { ios?; android?; web? }`, so a caller can now pass a
 * per-platform object instead of a single name. That union cannot be a
 * `Record` key, and it cannot index one either.
 *
 * `Extract<..., string>` takes only the string half, which is the half this
 * fallback can translate: the mapping below is SF Symbol name to Material
 * Icon name, and a platform-keyed object has no single name to look up. A
 * caller wanting per-platform icons should pick the name before calling this.
 */
type SymbolName = Extract<SymbolViewProps['name'], string>;

type IconMapping = Record<SymbolName, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
