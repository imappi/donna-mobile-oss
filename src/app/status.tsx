import React from 'react';
import { Redirect } from 'expo-router';
// Native compatibility. The web app uses /books-status because Metro owns /status.
export default function StatusCompatibilityRoute() { return <Redirect href="/books-status" />; }
