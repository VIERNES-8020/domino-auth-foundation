import React, { useState } from 'react';
import { Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useLanguage, Language } from '@/contexts/LanguageContext';

const languages = [
  { code: 'es' as Language, name: 'language.spanish', flag: '🇪🇸' },
  { code: 'en' as Language, name: 'language.english', flag: '🇺🇸' },
  { code: 'fr' as Language, name: 'language.french', flag: '🇫🇷' },
  { code: 'de' as Language, name: 'language.german', flag: '🇩🇪' },
  { code: 'pt' as Language, name: 'language.portuguese', flag: '🇧🇷' },
  { code: 'zh' as Language, name: 'language.chinese', flag: '🇹🇼' },
];

export function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();
  const [open, setOpen] = useState(false);

  const currentLanguage = languages.find(lang => lang.code === language);

  const handleLanguageChange = (langCode: Language) => {
    setLanguage(langCode);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="relative group overflow-hidden bg-gradient-to-r from-background to-secondary/20 border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 hover:scale-105 hover:shadow-lg"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative flex items-center gap-2 px-1">
            <Globe className="h-4 w-4 text-primary group-hover:rotate-12 transition-transform duration-300" />
            <span className="text-lg">{currentLanguage?.flag}</span>
            <span className="font-medium text-sm hidden sm:block">
              {t(currentLanguage?.name || 'language.spanish')}
            </span>
            <ChevronDown className="h-3 w-3 ml-1 group-hover:rotate-180 transition-transform duration-300" />
          </div>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-56 p-0 bg-background/95 backdrop-blur-md border-primary/20 shadow-xl" align="end">
        <div className="p-2">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1 mb-1">
            {t('language.select')}
          </div>
          <div className="space-y-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 hover:bg-primary/10 hover:scale-[1.02] ${
                  language === lang.code 
                    ? 'bg-primary/20 text-primary font-medium shadow-sm border border-primary/30' 
                    : 'text-foreground hover:text-primary'
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <span className="flex-1 text-left">{t(lang.name)}</span>
                {language === lang.code && (
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}