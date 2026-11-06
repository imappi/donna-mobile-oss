import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, View, type ImageSourcePropType, type ViewStyle } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { color, onboarding, orb, radius, shadow } from '../tokens';
import { gradientPoints } from '../gradientGeometry';

/**
 * The mascot on her sunset orb (shell v1) — the round identity mark used
 * wherever Donna appears in person (the chat identity row; the dock builds
 * its own lifted variant). Image comes from the shell; absent, a neutral
 * icon keeps forks honest.
 */
export const MascotOrb = ({
  size,
  image,
  imageSize = size,
  imageShift = size * 0.08,
  framed = false,
  working = false,
  lifted = false
}: {
  size: number;
  image?: ImageSourcePropType;
  imageSize?: number;
  imageShift?: number;
  framed?: boolean;
  lifted?: boolean;
  working?: boolean;
}) => (
  <View
    accessible={false}
    accessibilityElementsHidden
    style={[
      { width: size, height: size, borderRadius: radius.pill },
      lifted ? size === onboarding.processingOrbSize ? onboarding.processingOrbShadow : onboarding.mascotShadow : null,
      framed
        ? ({ borderWidth: onboarding.mascotBorder, borderColor: color.card, ...shadow.orb } satisfies ViewStyle)
        : null
    ]}
  >
    <View style={{ flex: 1, borderRadius: radius.pill, overflow: 'hidden' }}>
      <LinearGradient
        colors={[...orb.gradient]}
        locations={lifted || working ? [0, 0.55, 1] : undefined}
        start={lifted || working ? gradientPoints(145, size, size).start : orb.start}
        end={lifted || working ? gradientPoints(145, size, size).end : orb.end}
        style={{ flex: 1, alignItems: 'center', justifyContent: (lifted || working) && image ? 'flex-end' : 'center' }}
      >
        {image ? (
          <Image
            accessible={false}
            source={image}
            resizeMode="contain"
            style={{ width: imageSize, height: imageSize, transform: [{ translateY: imageShift }] }}
          />
        ) : (
          <Feather name="message-circle" size={Math.round(size * 0.45)} color={color.paper} />
        )}
      </LinearGradient>
    </View>
  </View>
);
