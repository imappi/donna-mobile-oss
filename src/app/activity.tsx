import React from 'react';
import { useRouter } from 'expo-router';
import { ActivityScreen } from '@core/screens/ActivityScreen';
import { hrefForDeepLink } from '@/state/deepLink';
import { useActivity } from '@/state/hooks';

export default function ActivityRoute() {
  const activity = useActivity();
  const router = useRouter();
  return (
    <ActivityScreen
      events={activity.data?.events ?? []}
      onBack={() => router.back()}
      onOpen={(event) => {
        const href = hrefForDeepLink(event.deep_link);
        if (href) router.push(href);
      }}
    />
  );
}
