import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'es' | 'en' | 'fr' | 'de' | 'pt' | 'zh';

export interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  es: {
    // Navigation
    'nav.home': 'Inicio',
    'nav.properties': 'Propiedades',
    'nav.agents': 'Nuestros Agentes',
    'nav.clients': 'Nuestros Clientes',
    'nav.about': 'Sobre Nosotros',
    'nav.contact': 'Contacto',
    'nav.login': 'Iniciar Sesión',
    'nav.register': 'Registrarse',
    'nav.dashboard': 'Panel',
    'nav.signOut': 'Cerrar Sesión',
    
    // Hero Section
    'hero.title': 'Hogar para tu Familia, Proyectos para tu Futuro',
    'hero.subtitle': 'La red de franquicias inmobiliarias más grande de Bolivia. Miles de propiedades verificadas, agentes certificados y el respaldo de DOMINIO.',
    'hero.sellRent': 'Vende o Alquila',
    'hero.explore': 'Explorar Propiedades',
    'hero.franchise': 'Únete como Franquicia',
    
    // Property Types
    'properties.featured': 'Propiedades Destacadas',
    'properties.success': 'Éxitos Recientes',
    'properties.house': 'Casas',
    'properties.apartment': 'Departamentos',
    'properties.land': 'Terrenos',
    'properties.office': 'Oficinas',
    'properties.commercial': 'Local comercial',
    
    // Stats
    'stats.title': 'Números que Hablan por Sí Solos',
    'stats.properties': 'Propiedades Activas',
    'stats.franchises': 'Franquicias Activas',
    'stats.cities': 'Ciudades',
    'stats.sales': 'Ventas Mensuales',
    
    // Language Selector
    'language.select': 'Seleccionar idioma',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.french': 'Français',
    'language.german': 'Alemán',
    'language.portuguese': 'Portugués (Brasil)',
    'language.chinese': 'Chino (tradicional)'
  },
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.properties': 'Properties',
    'nav.agents': 'Our Agents',
    'nav.clients': 'Our Clients',
    'nav.about': 'About Us',
    'nav.contact': 'Contact',
    'nav.login': 'Sign In',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.signOut': 'Sign Out',
    
    // Hero Section
    'hero.title': 'Home for Your Family, Projects for Your Future',
    'hero.subtitle': 'Bolivia\'s largest real estate franchise network. Thousands of verified properties, certified agents and DOMINIO\'s backing.',
    'hero.sellRent': 'Sell or Rent',
    'hero.explore': 'Explore Properties',
    'hero.franchise': 'Join as Franchise',
    
    // Property Types
    'properties.featured': 'Featured Properties',
    'properties.success': 'Recent Successes',
    'properties.house': 'Houses',
    'properties.apartment': 'Apartments',
    'properties.land': 'Land',
    'properties.office': 'Offices',
    'properties.commercial': 'Commercial Space',
    
    // Stats
    'stats.title': 'Numbers That Speak for Themselves',
    'stats.properties': 'Active Properties',
    'stats.franchises': 'Active Franchises',
    'stats.cities': 'Cities',
    'stats.sales': 'Monthly Sales',
    
    // Language Selector
    'language.select': 'Select language',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.portuguese': 'Português (Brasil)',
    'language.chinese': '繁體中文'
  },
  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.properties': 'Propriétés',
    'nav.agents': 'Nos Agents',
    'nav.clients': 'Nos Clients',
    'nav.about': 'À Propos',
    'nav.contact': 'Contact',
    'nav.login': 'Se Connecter',
    'nav.register': 'S\'inscrire',
    'nav.dashboard': 'Tableau de Bord',
    'nav.signOut': 'Se Déconnecter',
    
    // Hero Section
    'hero.title': 'Maison pour Votre Famille, Projets pour Votre Avenir',
    'hero.subtitle': 'Le plus grand réseau de franchises immobilières de Bolivie. Des milliers de propriétés vérifiées, des agents certifiés et le soutien de DOMINIO.',
    'hero.sellRent': 'Vendre ou Louer',
    'hero.explore': 'Explorer les Propriétés',
    'hero.franchise': 'Rejoindre comme Franchise',
    
    // Property Types
    'properties.featured': 'Propriétés en Vedette',
    'properties.success': 'Succès Récents',
    'properties.house': 'Maisons',
    'properties.apartment': 'Appartements',
    'properties.land': 'Terrains',
    'properties.office': 'Bureaux',
    'properties.commercial': 'Local commercial',
    
    // Stats
    'stats.title': 'Des Chiffres Qui Parlent d\'Eux-Mêmes',
    'stats.properties': 'Propriétés Actives',
    'stats.franchises': 'Franchises Actives',
    'stats.cities': 'Villes',
    'stats.sales': 'Ventes Mensuelles',
    
    // Language Selector
    'language.select': 'Sélectionner la langue',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.portuguese': 'Português (Brasil)',
    'language.chinese': '繁體中文'
  },
  de: {
    // Navigation
    'nav.home': 'Startseite',
    'nav.properties': 'Immobilien',
    'nav.agents': 'Unsere Makler',
    'nav.clients': 'Unsere Kunden',
    'nav.about': 'Über Uns',
    'nav.contact': 'Kontakt',
    'nav.login': 'Anmelden',
    'nav.register': 'Registrieren',
    'nav.dashboard': 'Dashboard',
    'nav.signOut': 'Abmelden',
    
    // Hero Section
    'hero.title': 'Zuhause für Ihre Familie, Projekte für Ihre Zukunft',
    'hero.subtitle': 'Boliviens größtes Immobilien-Franchise-Netzwerk. Tausende verifizierte Immobilien, zertifizierte Makler und DOMINIOs Unterstützung.',
    'hero.sellRent': 'Verkaufen oder Vermieten',
    'hero.explore': 'Immobilien Erkunden',
    'hero.franchise': 'Als Franchise Beitreten',
    
    // Property Types
    'properties.featured': 'Ausgewählte Immobilien',
    'properties.success': 'Jüngste Erfolge',
    'properties.house': 'Häuser',
    'properties.apartment': 'Wohnungen',
    'properties.land': 'Grundstücke',
    'properties.office': 'Büros',
    'properties.commercial': 'Gewerberaum',
    
    // Stats
    'stats.title': 'Zahlen, die für sich Sprechen',
    'stats.properties': 'Aktive Immobilien',
    'stats.franchises': 'Aktive Franchises',
    'stats.cities': 'Städte',
    'stats.sales': 'Monatliche Verkäufe',
    
    // Language Selector
    'language.select': 'Sprache auswählen',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.portuguese': 'Português (Brasil)',
    'language.chinese': '繁體中文'
  },
  pt: {
    // Navigation
    'nav.home': 'Início',
    'nav.properties': 'Propriedades',
    'nav.agents': 'Nossos Corretores',
    'nav.clients': 'Nossos Clientes',
    'nav.about': 'Sobre Nós',
    'nav.contact': 'Contato',
    'nav.login': 'Entrar',
    'nav.register': 'Registrar-se',
    'nav.dashboard': 'Painel',
    'nav.signOut': 'Sair',
    
    // Hero Section
    'hero.title': 'Lar para Sua Família, Projetos para Seu Futuro',
    'hero.subtitle': 'A maior rede de franquias imobiliárias da Bolívia. Milhares de propriedades verificadas, corretores certificados e o respaldo da DOMINIO.',
    'hero.sellRent': 'Vender ou Alugar',
    'hero.explore': 'Explorar Propriedades',
    'hero.franchise': 'Junte-se como Franquia',
    
    // Property Types
    'properties.featured': 'Propriedades em Destaque',
    'properties.success': 'Sucessos Recentes',
    'properties.house': 'Casas',
    'properties.apartment': 'Apartamentos',
    'properties.land': 'Terrenos',
    'properties.office': 'Escritórios',
    'properties.commercial': 'Espaço comercial',
    
    // Stats
    'stats.title': 'Números que Falam por Si',
    'stats.properties': 'Propriedades Ativas',
    'stats.franchises': 'Franquias Ativas',
    'stats.cities': 'Cidades',
    'stats.sales': 'Vendas Mensais',
    
    // Language Selector
    'language.select': 'Selecionar idioma',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.portuguese': 'Português (Brasil)',
    'language.chinese': '繁體中文'
  },
  zh: {
    // Navigation
    'nav.home': '首頁',
    'nav.properties': '物業',
    'nav.agents': '我們的代理人',
    'nav.clients': '我們的客戶',
    'nav.about': '關於我們',
    'nav.contact': '聯繫我們',
    'nav.login': '登入',
    'nav.register': '註冊',
    'nav.dashboard': '儀表板',
    'nav.signOut': '登出',
    
    // Hero Section
    'hero.title': '為您的家庭築家，為您的未來築夢',
    'hero.subtitle': '玻利維亞最大的房地產加盟網絡。數千套經過驗證的物業，認證代理人和DOMINIO的支持。',
    'hero.sellRent': '出售或出租',
    'hero.explore': '探索物業',
    'hero.franchise': '加入加盟',
    
    // Property Types
    'properties.featured': '精選物業',
    'properties.success': '最近成功案例',
    'properties.house': '房屋',
    'properties.apartment': '公寓',
    'properties.land': '土地',
    'properties.office': '辦公室',
    'properties.commercial': '商業空間',
    
    // Stats
    'stats.title': '用數字說話',
    'stats.properties': '活躍物業',
    'stats.franchises': '活躍加盟店',
    'stats.cities': '城市',
    'stats.sales': '月銷量',
    
    // Language Selector
    'language.select': '選擇語言',
    'language.spanish': 'Español',
    'language.english': 'English',
    'language.french': 'Français',
    'language.german': 'Deutsch',
    'language.portuguese': 'Português (Brasil)',
    'language.chinese': '繁體中文'
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('es');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('dominio-language') as Language;
    if (savedLanguage && Object.keys(translations).includes(savedLanguage)) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('dominio-language', lang);
  };

  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}