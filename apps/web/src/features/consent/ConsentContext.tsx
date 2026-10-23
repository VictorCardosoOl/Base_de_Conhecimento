'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  ConsentStatus,
  CONSENT_STORAGE_KEY,
  CONSENT_UPDATED_EVENT,
} from './consent-storage';
import { RETIRED_KEYS } from './storage-inventory';
import { safeStorage } from '@/lib/storage';

interface ConsentContextType {
  consent: ConsentStatus;
  acceptAll: () => void;
  rejectAll: () => void;
  resetConsent: () => void;
  hasConsented: boolean;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

function getInitialConsent(): ConsentStatus {
  if (typeof window === 'undefined') return 'pending';
  const stored = safeStorage.getString(CONSENT_STORAGE_KEY, '');
  if (stored === 'granted' || stored === 'denied') {
    return stored as ConsentStatus;
  }
  return 'pending';
}

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [consent, setConsent] = useState<ConsentStatus>(getInitialConsent);

  useEffect(() => {
    // Dados de recursos desativados: não ficam guardados sem uso (minimização)
    for (const key of RETIRED_KEYS) safeStorage.removeItem(key);
  }, []);

  const acceptAll = () => {
    safeStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    setConsent('granted');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CONSENT_UPDATED_EVENT, { detail: 'granted' })
      );
    }
  };

  const rejectAll = () => {
    safeStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    setConsent('denied');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CONSENT_UPDATED_EVENT, { detail: 'denied' })
      );
    }
  };

  const resetConsent = () => {
    safeStorage.removeItem(CONSENT_STORAGE_KEY);
    setConsent('pending');
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(CONSENT_UPDATED_EVENT, { detail: 'pending' })
      );
    }
  };

  const hasConsented = consent === 'granted';

  return (
    <ConsentContext.Provider
      value={{ consent, acceptAll, rejectAll, resetConsent, hasConsented }}
    >
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = () => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};
