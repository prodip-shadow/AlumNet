import { useState, useCallback, useEffect } from 'react';

/**
 * Custom hook to synchronize tab / filter state with URL parameters & sessionStorage
 * so that page refreshes remain on the exact same active tab.
 */
export function useSyncedTab(paramName = 'tab', defaultTab = '', keyPrefix = '') {
  const [tab, setTabState] = useState(defaultTab);

  // Sync state after initial mount/hydration to avoid SSR hydration mismatch
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const urlTab = urlParams.get(paramName);
      const storageKey = keyPrefix ? `${keyPrefix}_${paramName}` : paramName;
      const storedTab = sessionStorage.getItem(storageKey);

      const targetTab = urlTab || storedTab;
      if (targetTab && targetTab !== tab) {
        setTabState(targetTab);
      }
    }
  }, [paramName, keyPrefix]);

  const setTab = useCallback(
    (newTab) => {
      setTabState(newTab);
      if (typeof window !== 'undefined') {
        const url = new URL(window.location.href);
        url.searchParams.set(paramName, newTab);
        window.history.replaceState(null, '', url.toString());

        const storageKey = keyPrefix ? `${keyPrefix}_${paramName}` : paramName;
        sessionStorage.setItem(storageKey, newTab);
      }
    },
    [paramName, keyPrefix]
  );

  return [tab, setTab];
}
