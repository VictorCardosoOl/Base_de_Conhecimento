"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';

export type ConsentStatus = 'granted' | 'denied' | 'pending';

interface ConsentContextType {
  consent: ConsentStatus;
  hasConsented: boolean;
  acceptAll: () => void;
  rejectAll: () => void;
  resetConsent: () => void;
  openLegalModal: boolean;
  setOpenLegalModal: (open: boolean) => void;
  activeLegalTab: 'terms' | 'privacy';
  setActiveLegalTab: (tab: 'terms' | 'privacy') => void;
}

const CONSENT_STORAGE_KEY = 'sst_user_cookie_consent';

const ConsentContext = createContext<ConsentContextType | undefined>(undefined);

export const ConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [consent, setConsent] = useState<ConsentStatus>('pending');

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === 'granted' || stored === 'denied') {
      setConsent(stored as ConsentStatus);
    }
  }, []);

  const [openLegalModal, setOpenLegalModal] = useState(false);
  const [activeLegalTab, setActiveLegalTab] = useState<'terms' | 'privacy'>('privacy');

  const acceptAll = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'granted');
    setConsent('granted');
    window.dispatchEvent(new CustomEvent('sst_consent_updated', { detail: 'granted' }));
  };

  const rejectAll = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'denied');
    setConsent('denied');
    window.dispatchEvent(new CustomEvent('sst_consent_updated', { detail: 'denied' }));
  };

  const resetConsent = () => {
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    setConsent('pending');
    window.dispatchEvent(new CustomEvent('sst_consent_updated', { detail: 'pending' }));
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
        openLegalModal,
        setOpenLegalModal,
        activeLegalTab,
        setActiveLegalTab
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

