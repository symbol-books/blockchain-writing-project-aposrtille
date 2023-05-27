import { useState, useEffect } from 'react';
import { SSSWindow } from 'sss-module';

declare const window: SSSWindow;

const useSssInit = () => {
  const [sssState, setSssState] = useState<'ACTIVE' | 'INACTIVE' | 'NONE' | 'LOADING'>('LOADING');
  const [clientPublicKey, setClientPublicKey] = useState<string>('');

  useEffect(() => {
    try {
      if (window.isAllowedSSS()) {
        setSssState('ACTIVE');
        const publicKey = window.SSS.activePublicKey;
        setClientPublicKey(publicKey);
      } else {
        setSssState('INACTIVE');
      }
    } catch (e) {
      console.error(e);
      setSssState('NONE');
    }
  }, []);

  return { clientPublicKey, sssState };
};

export default useSssInit;
