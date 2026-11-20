'use client';

import { useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { makeStore, type AppStore } from './index';
import { bootstrapApp, selectPersistedDemoData } from './bootstrap';
import { savePersistedState } from '@/lib/persistence';

function Bootstrapper({ store }: { store: AppStore }) {
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    void store.dispatch(bootstrapApp());
  }, [store]);

  // allow retry by re-dispatching bootstrapApp from UI; bootstrapped ref only prevents duplicate auto-run.

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = store.subscribe(() => {
      const state = store.getState();
      if (!state.ui.initialized) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          savePersistedState(selectPersistedDemoData(state));
        } catch {
          // ignore
        }
      }, 300);
    });
    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [store]);

  return null;
}

export default function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());
  return (
    <Provider store={store}>
      <Bootstrapper store={store} />
      {children}
    </Provider>
  );
}
