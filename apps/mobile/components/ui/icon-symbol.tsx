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
