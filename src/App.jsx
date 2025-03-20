import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useTranslation, I18nextProvider } from 'react-i18next';
import i18n from "./i18n";
import CityRoute from "./components/CityRoute";
import LanguageSelector from './components/LanguageSelector';
import { DataProvider } from "./data/DataContext";
import DebugTool from './components/DebugTool';
import "./index.css";

const AppContent = () => {
  const { t } = useTranslation();

  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');
    if (savedLanguage) {
      i18n.changeLanguage(savedLanguage);
    } else {
      const browserLang = navigator.language;
      if (browserLang.startsWith('pt')) {
        i18n.changeLanguage('pt-BR');
      }
    }
  }, []);

  return (
    <div className="flex flex-col min-h-screen w-full bg-blue-50">
      <header className="bg-blue-700 text-white py-3 fixed top-0 w-full z-50 shadow-md min-h-20 justify-center">
        <div className="container flex justify-between mx-auto max-w-[1200px] items-center px-6">
          <div className="flex flex-col justify-center">
            <h2 className="text-xl font-regular tracking-wide">{t('header:app_subtitle')}</h2>
            <h1 className="text-sm font-light text-white opacity-[0.6] tracking-wider mt-0.2">
              {t('header:app_name')}
            </h1>
          </div>
          <LanguageSelector />
        </div>
      </header>

      <Routes>
        <Route path="/" element={<CityRoute />} />
        <Route path="/cities/:cityId" element={<CityRoute />} />
      </Routes>

      <footer className="bg-gray-100 py-4 mt-auto">
        <div className="container mx-auto px-4 text-center text-gray-600 text-sm">
          {t('footer:copyright')}
        </div>
      </footer>
    </div>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <DataProvider>
          <AppContent />
        </DataProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
};

export default App;