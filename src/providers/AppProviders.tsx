import React from 'react';
import { DataProvider } from '@/contexts/DataContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider, type Language } from '@/contexts/LanguageContext';

interface AppProvidersProps {
  children: React.ReactNode;
  initialLanguage?: Language;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children, initialLanguage }) => {
  return (
    <AuthProvider>
      <DataProvider>
        <LanguageProvider initialLanguage={initialLanguage}>
          {children}
        </LanguageProvider>
      </DataProvider>
    </AuthProvider>
  );
};
