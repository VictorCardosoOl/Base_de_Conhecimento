'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CONSENT_STORAGE_KEY,
  CONSENT_UPDATED_EVENT,
  type ConsentStatus,
} from './consent-storage';
import { RETIRED_KEYS } from './storage-inventory';

interface ConsentContextType {
  consent: ConsentStatus;
  hasConsented: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  resetConsent: () => void;
}

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [consent, setConsent] = useState<ConsentStatus>('pending');

  useEffect(() => {
    try {
      // Dados de recursos desativados: não ficam guardados sem uso (minimização).
      for (const key of RETIRED_KEYS) localStorage.removeItem(key);
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      if (stored === 'granted' || stored === 'denied') {
        setConsent(stored as ConsentStatus);
      }
    } catch {
      // armazenamento bloqueado: a escolha fica pendente
    }
  }, []);

  const acceptAll = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    setConsent('granted');
    window.dispatchEvent(
      new CustomEvent(CONSENT_UPDATED_EVENT, { detail: 'granted' })
    );
  };

  const rejectAll = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    setConsent('denied');
    window.dispatchEvent(
      new CustomEvent(CONSENT_UPDATED_EVENT, { detail: 'denied' })
    );
  };

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setConsent('pending');
    window.dispatchEvent(
      new CustomEvent(CONSENT_UPDATED_EVENT, { detail: 'pending' })
    );
  };

  const hasConsented = consent === 'granted';

  return (
    <ConsentContext.Provider
      value={{
        consent,
        hasConsented,
        acceptAll,
        rejectAll,
        resetConsent,
      }}
    >
      {children}
    </ConsentContext.Provider>
  );
};

export const useConsent = (): ConsentContextType => {
  const context = useContext(ConsentContext);
  if (!context) {
    throw new Error('useConsent must be used within a ConsentProvider');
  }
  return context;
};
