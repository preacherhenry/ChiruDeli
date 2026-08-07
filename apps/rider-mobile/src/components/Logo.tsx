import { View, Text } from 'react-native';
import Svg, { Circle, Polygon } from 'react-native-svg';
import { brandMark } from '@chirudeli/design-tokens';

export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox={brandMark.viewBox}>
      <Circle cx={brandMark.circle.cx} cy={brandMark.circle.cy} r={brandMark.circle.r} fill="#0E6E4E" />
      {brandMark.chevrons.map((c) => (
        <Polygon key={c.points} points={c.points} fill="#FFFFFF" opacity={c.opacity} />
      ))}
    </Svg>
  );
}

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <LogoMark size={size} />
      <Text style={{ fontSize: size * 0.42 }} className="font-heading-extra text-neutral-900">
        Chiru<Text className="text-secondary-500">Deli</Text>
      </Text>
      <View className="rounded-pill bg-neutral-900 px-2 py-0.5">
        <Text className="font-body-semibold text-xs text-white">RIDER</Text>
      </View>
    </View>
  );
}
