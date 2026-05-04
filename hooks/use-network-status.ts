import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useCallback, useEffect, useState } from 'react';

export type NetworkStatus = 'online' | 'offline' | 'unknown';

export function useNetworkStatus() {
  const [status, setStatus] = useState<NetworkStatus>('unknown');

  const evaluate = useCallback((state: NetInfoState) => {
    const connected = state.isConnected ?? false;
    const reachable = state.isInternetReachable;
    // Treat as online only if connected AND internet is reachable
    const online = reachable === null ? connected : connected && reachable;
    setStatus(online ? 'online' : 'offline');
  }, []);

  const refresh = useCallback(async () => {
    const state = await NetInfo.fetch();
    evaluate(state);
  }, [evaluate]);

  useEffect(() => {
    NetInfo.fetch().then(evaluate);
    const unsubscribe = NetInfo.addEventListener(evaluate);
    return unsubscribe;
  }, [evaluate]);

  return { status, refresh };
}