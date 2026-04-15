import { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

const COLORS = [
  '#FFD700', // gold
  '#FF6B6B', // coral
  '#4ECDC4', // teal
  '#45B7D1', // sky
  '#96CEB4', // mint
  '#FFEAA7', // pale yellow
  '#DDA0DD', // plum
  '#FF8C42', // orange
];

type Props = {
  trigger: number;     // change to fire a new burst
  count?: number;      // # particles (default 14)
  size?: number;       // canvas size (default 240)
  origin?: 'center' | 'top';
};

/**
 * Pure-Reanimated confetti burst. Fires whenever `trigger` changes.
 * No external assets required — particles are colored circles + emoji stars.
 */
export function StarBurst({ trigger, count = 14, size = 240, origin = 'center' }: Props) {
  const particles = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const distance = size * 0.4 + Math.random() * size * 0.15;
    return {
      id: i,
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance - (origin === 'top' ? size * 0.2 : 0),
      color: COLORS[i % COLORS.length],
      delay: Math.random() * 120,
      isStar: i % 3 === 0,
      sizePx: 10 + Math.random() * 12,
      rotateEnd: (Math.random() - 0.5) * 720,
    };
  });

  const containerStyle: ViewStyle = {
    position: 'absolute',
    width: size,
    height: size,
    top: origin === 'top' ? 60 : '50%',
    left: '50%',
    marginLeft: -size / 2,
    marginTop: origin === 'top' ? 0 : -size / 2,
    pointerEvents: 'none',
    overflow: 'visible',
    alignItems: 'center',
    justifyContent: 'center',
  };

  return (
    <View style={containerStyle} pointerEvents="none">
      {particles.map((p) => (
        <Particle key={`${trigger}-${p.id}`} {...p} />
      ))}
    </View>
  );
}

type ParticleProps = {
  tx: number;
  ty: number;
  color: string;
  delay: number;
  isStar: boolean;
  sizePx: number;
  rotateEnd: number;
};

function Particle({ tx, ty, color, delay, isStar, sizePx, rotateEnd }: ParticleProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(
      delay,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) })
    );
  }, [progress, delay]);

  const animStyle = useAnimatedStyle(() => {
    const p = progress.value;
    // Two-stage opacity: rise to 1 quickly, fade in last 30%
    const opacity = p < 0.7 ? p / 0.4 : 1 - (p - 0.7) / 0.3;
    return {
      opacity: Math.min(1, Math.max(0, opacity)),
      transform: [
        { translateX: tx * p },
        { translateY: ty * p + 60 * p * p }, // small gravity drop
        { rotate: `${rotateEnd * p}deg` },
        { scale: p < 0.2 ? p * 5 : 1 },
      ],
    };
  });

  if (isStar) {
    return (
      <Animated.Text style={[styles.star, { fontSize: sizePx + 4, color }, animStyle]}>
        ★
      </Animated.Text>
    );
  }

  return (
    <Animated.View
      style={[
        styles.dot,
        { width: sizePx, height: sizePx, borderRadius: sizePx / 2, backgroundColor: color },
        animStyle,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { position: 'absolute' },
  star: { position: 'absolute', textShadowColor: 'rgba(0,0,0,0.15)', textShadowRadius: 2 },
});
