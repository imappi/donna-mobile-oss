import React from 'react';
import { Redirect } from 'expo-router';

/** The recorder itself owns voice, typing and skip. */
export default function BusinessOnboardingRoute() {
  return <Redirect href="/onboarding/voice" />;
}
