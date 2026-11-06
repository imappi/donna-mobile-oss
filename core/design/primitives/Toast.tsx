import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { color, radius, shadow, space } from '../tokens';
import { Txt } from './Txt';

/**
 * One quiet toast: ink card, paper text, bottom of screen, self-dismisses.
 * For receipts and errors in transit — never celebration.
 */
const ToastContext = createContext<{ show: (message: string) => void }>({ show: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastHost = ({ children }: { children: React.ReactNode }) => {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const show = useCallback((next: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(next);
    timer.current = setTimeout(() => setMessage(null), 3200);
  }, []);
  const value = useMemo(() => ({ show }), [show]);
  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: space.screenX,
            right: space.screenX,
            bottom: insets.bottom + space.lg,
            backgroundColor: color.ink,
            borderRadius: radius.sheet,
            paddingHorizontal: space.rowX,
            paddingVertical: space.md,
            ...shadow.sheet
          }}
        >
          <Txt v="sm" tone="paper">
            {message}
          </Txt>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
};
