import React from 'react';
import { useRouter } from 'expo-router';
import { ActivityScreen } from '@core/screens/ActivityScreen';
import { hrefForDeepLink } from '@/state/deepLink';
import { EntityRoute } from '@/state/EntityRoute';
import { useActivity } from '@/state/hooks';

const SignedInActivity = () => {
  const activity = useActivity();
  const router = useRouter();
  return (
    <ActivityScreen
      events={activity.data?.events ?? []}
      onBack={() => (router.canGoBack() ? router.back() : router.replace('/actions'))}
      onOpen={(event) => {
        const href = hrefForDeepLink(event.deep_link);
        if (href) router.push(href);
      }}
    />
  );
};

export default function ActivityRoute() {
  return <EntityRoute><SignedInActivity /></EntityRoute>;
}
