'use client';

import { useState } from 'react';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { makeStore, type AppStore } from './index';

export default function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState<AppStore>(() => makeStore());
  return <Provider store={store}>{children}</Provider>;
}
