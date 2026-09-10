// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

/** The string form of an SF Symbol name, which is what this file maps from. */
type SFSymbolName = Extract<SymbolViewProps['name'], string>;
type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 *
 * `satisfies` rather than `as`, and the difference is not cosmetic. This was
 * `as Record<SymbolViewProps['name'], ...>`, which asserted the object held
 * every SF Symbol in existence. `IconSymbolName` is `keyof typeof MAPPING`, so
 * that assertion widened the accepted names from the four actually listed here
 * to the entire symbol set, and the type checker then had no opinion about a
 * name nobody had mapped.
 *
 * It was already wrong: `app/(tabs)/_layout.tsx` asks for `person.2.fill` for
 * the PartyCrew tab. The lookup returned `undefined`, and `MaterialIcons`
 * given `name={undefined}` renders nothing, so that tab had no icon on Android
 * and web while iOS was fine, because `icon-symbol.ios.tsx` goes to SF Symbols
 * and never consults this table.
 *
 * `satisfies` keeps the keys literal, so `IconSymbolName` is exactly these five
 * names, while still checking each key is a real SF Symbol and each value a
 * real Material icon. The next unmapped name fails the build instead of
 * shipping a blank space.
 */
const MAPPING = {
  'house.fill': 'home',
  'person.2.fill': 'group',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} satisfies Partial<Record<SFSymbolName, MaterialIconName>>;

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
