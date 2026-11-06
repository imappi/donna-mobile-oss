import React, { createContext, useContext, useEffect, useState } from "react";
import { setLocale } from "@core/i18n";
import { shell } from "@/shell";
import {
  readDevicePreferences,
  writeDevicePreferences,
  type DevicePreferences,
} from "./devicePreferences";

const Context = createContext<{
  value: DevicePreferences;
  update: (patch: Partial<DevicePreferences>) => Promise<void>;
} | null>(null);
export const useDeviceSettings = () => {
  const context = useContext(Context);
  if (!context) throw new Error("DeviceSettingsProvider missing");
  return context;
};
export const DeviceSettingsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [value, setValue] = useState<DevicePreferences | null>(null);
  useEffect(() => {
    let mounted = true;
    readDevicePreferences().then((stored) => {
      if (!mounted) return;
      setLocale(stored.locale ?? shell.defaultLocale);
      setValue(stored);
    });
    return () => {
      mounted = false;
    };
  }, []);
  if (!value) return null;
  return (
    <Context.Provider
      value={{
        value,
        update: async (patch) => {
          const next = { ...value, ...patch };
          await writeDevicePreferences(next);
          setLocale(next.locale ?? shell.defaultLocale);
          setValue(next);
        },
      }}
    >
      {children}
    </Context.Provider>
  );
};
