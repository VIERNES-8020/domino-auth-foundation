import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="mt-12 border-t">
      <div className="container mx-auto py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 className="font-semibold mb-2">DOMINIO</h3>
          <p className="text-muted-foreground">{t('footer.description')}</p>
        </div>
        <nav aria-label={t('footer.links')} className="space-y-2">
          <Link className="story-link block" to="/propiedades">{t('nav.properties')}</Link>
          <Link className="story-link block" to="/agentes">{t('nav.agents')}</Link>
          <Link className="story-link block" to="/sobre-nosotros">{t('nav.about')}</Link>
          <Link className="story-link block" to="/contacto">{t('nav.contact')}</Link>
        </nav>
        <div>
          <p className="text-muted-foreground">© {new Date().getFullYear()} DOMINIO. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;