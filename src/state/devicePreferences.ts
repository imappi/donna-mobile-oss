import AsyncStorage from "@react-native-async-storage/async-storage";
export type DevicePreferences = {
  locale: "fi" | "en" | null;
  biometrics: boolean;
  notifications: boolean;
};
const key = "donna.device-preferences.v1";
export const readDevicePreferences = async (): Promise<DevicePreferences> => {
  try {
    const raw = JSON.parse((await AsyncStorage.getItem(key)) ?? "{}");
    return {
      locale: raw.locale === "fi" || raw.locale === "en" ? raw.locale : null,
      biometrics: raw.biometrics !== false,
      notifications: raw.notifications !== false,
    };
  } catch {
    return { locale: null, biometrics: true, notifications: true };
  }
};
export const writeDevicePreferences = (value: DevicePreferences) =>
  AsyncStorage.setItem(key, JSON.stringify(value));
