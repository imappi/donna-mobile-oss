import React from "react";
import { useLocalSearchParams } from "expo-router";
import { SettingsRoute } from "@/state/SettingsRoute";
export default function SettingsPage() {
  const { page } = useLocalSearchParams<{ page: string }>();
  return <SettingsRoute page={page} />;
}
