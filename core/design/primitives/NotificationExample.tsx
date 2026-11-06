import React from 'react';
import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';
import { onboarding, space } from '../tokens';
import { Txt } from './Txt';

export const NotificationExample = ({ image, brand, now, title, body }: {
  image?: ImageSourcePropType; brand: string; now: string; title: string; body: string;
}) => <View style={styles.banner}>
  {image ? <Image source={image} style={styles.icon} accessible={false} /> : null}
  <View style={styles.copy}>
    <View style={styles.header}><Txt v="onboardingMeta" tone="mute" style={styles.brand}>{brand.toLocaleUpperCase()}</Txt><Txt v="onboardingMeta" tone="mute">{now}</Txt></View>
    <Txt v="onboardingSmall" style={styles.title}>{title}</Txt><Txt v="onboardingSmall" tone="soft">{body}</Txt>
  </View>
</View>;
const styles = StyleSheet.create({
  banner: { backgroundColor: onboarding.notificationSurface, borderRadius: onboarding.notificationRadius,
    paddingVertical: onboarding.notificationPaddingY, paddingHorizontal: space.rowX,
    flexDirection: 'row', alignItems: 'flex-start', gap: space.md, borderWidth: 1,
    borderColor: onboarding.notificationBorder, ...onboarding.notificationShadow },
  icon: { width: onboarding.notificationIconSize, height: onboarding.notificationIconSize, borderRadius: onboarding.notificationIconRadius },
  copy: { flex: 1, gap: 2 },
  header: { flexDirection: 'row', justifyContent: 'space-between', gap: space.sm },
  brand: { fontWeight: '600', letterSpacing: 0.2 },
  title: { fontWeight: '600' }
});
