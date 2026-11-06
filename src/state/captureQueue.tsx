import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { CaptureQueue, type CaptureAddResult, type QueuedCapture } from '@core/capture/queue';
import type { PickedFile } from '@core/capture/upload';
import { useToast } from '@core/design';
import { t } from '@core/i18n';
import { useSession } from './session';

/**
 * App wiring around the capture outbox (core/capture/queue.ts): one queue
 * for the app, drained when a capture lands, when the app foregrounds,
 * and on a slow tick while anything is waiting. Uploads invalidate the
 * queries they change — the terminal then re-renders backend truth.
 */
type CaptureQueueValue = {
  entries: QueuedCapture[];
  add: (file: PickedFile, opts?: { answersCardId?: string | null }) => Promise<CaptureAddResult>;
  retry: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

const CaptureQueueContext = createContext<CaptureQueueValue | null>(null);

export const useCaptureQueue = () => {
  const value = useContext(CaptureQueueContext);
  if (!value) throw new Error('useCaptureQueue outside CaptureQueueProvider');
  return value;
};

const DRAIN_TICK_MS = 20000;

export const CaptureQueueProvider = ({ children }: { children: React.ReactNode }) => {
  const { state, api } = useSession();
  const queryClient = useQueryClient();
  const toast = useToast();
  const queue = useMemo(() => new CaptureQueue(api), [api]);
  const [entries, setEntries] = useState<QueuedCapture[]>([]);
  const signedIn = state.phase === 'signedIn';
  const activeEntityId = state.phase === 'signedIn' ? state.entityId : null;

  useEffect(() => {
    const unsubscribe = queue.subscribe((event) => {
      setEntries(queue.getEntries());
      if (event.type === 'uploaded') {
        queryClient.invalidateQueries({ queryKey: ['business-setup', event.entry.entityId] });
        queryClient.invalidateQueries({ queryKey: ['documents', event.entry.entityId] });
        if (event.entry.answersCardId) {
          queryClient.invalidateQueries({ queryKey: ['card', event.entry.entityId, event.entry.answersCardId] });
          queryClient.invalidateQueries({ queryKey: ['queue', event.entry.entityId] });
        }
      }
      if (event.type === 'lost') {
        toast.show(t('materials.queuedLost', { name: event.entry.file.filename }));
      }
    });
    return unsubscribe;
  }, [queue, queryClient, toast]);

  // Restore + first drain once signed in (drains need a bearer token).
  useEffect(() => {
    if (!signedIn) return;
    let cancelled = false;
    (async () => {
      await queue.load();
      if (!cancelled) {
        setEntries(queue.getEntries());
        queue.drain();
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [queue, signedIn]);

  // Foregrounding is the closest dependency-free "connection is back" signal.
  useEffect(() => {
    if (!signedIn) return;
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') queue.drain();
    });
    return () => sub.remove();
  }, [queue, signedIn]);

  // Slow retry tick, only while something is actually waiting.
  useEffect(() => {
    if (!signedIn || !entries.some((e) => e.state === 'waiting')) return;
    const tick = setInterval(() => queue.drain(), DRAIN_TICK_MS);
    return () => clearInterval(tick);
  }, [queue, signedIn, entries]);

  const value = useMemo<CaptureQueueValue>(
    () => ({
      entries,
      add: (file, opts) => {
        if (!activeEntityId) throw new Error('capture add while signed out');
        return queue.add(activeEntityId, file, opts);
      },
      retry: (id) => queue.retry(id),
      remove: (id) => queue.remove(id)
    }),
    [entries, queue, activeEntityId]
  );

  return <CaptureQueueContext.Provider value={value}>{children}</CaptureQueueContext.Provider>;
};
