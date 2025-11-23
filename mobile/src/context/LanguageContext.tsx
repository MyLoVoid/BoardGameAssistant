import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { translations, type Locale, type TranslationKey } from '@/localization/translations';

interface LanguageContextValue {
  language: Locale;
  setLanguage: (locale: Locale) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'bgai-language';

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Locale>('es');

  useEffect(() => {
    const hydrate = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored === 'es' || stored === 'en') {
          setLanguageState(stored);
        }
      } catch (error) {
        console.warn('Failed to load language preference', error);
      }
    };

    void hydrate();
  }, []);

  const handleLanguageChange = useCallback(async (next: Locale) => {
    setLanguageState(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next);
    } catch (error) {
      console.warn('Failed to persist language preference', error);
    }
  }, []);

  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>) => {
      const dictionary = translations[language] ?? translations.es;
      let text = dictionary[key] ?? translations.es[key] ?? key;

      if (params) {
        Object.entries(params).forEach(([paramKey, value]) => {
          const pattern = new RegExp(`\\{${paramKey}\\}`, 'g');
          text = text.replace(pattern, String(value));
        });
      }

      return text;
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage: handleLanguageChange,
      t: translate,
    }),
    [handleLanguageChange, language, translate],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextValue => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return ctx;
};
