import React from 'react';
import { Redirect } from 'expo-router';
/** Preserve earlier account deep links. */
export default function AccountRoute() { return <Redirect href="/settings"/>; }
