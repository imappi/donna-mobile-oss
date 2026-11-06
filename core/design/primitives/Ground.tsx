import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { brandGround, refinement } from '../tokens';

/** Brand and working grounds are separate: the refinement's quiet, vertical sunset has no diagonal glow. */
export const Ground = ({ variant = 'shell' }: { variant?: 'shell' | 'brand' }) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <LinearGradient colors={variant === 'brand' ? [...brandGround.colors] : [...refinement.groundColors]}
      locations={variant === 'brand' ? [...brandGround.locations] : [...refinement.groundLocations]}
      start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
  </View>
);
