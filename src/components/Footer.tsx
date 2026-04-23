import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="mt-12 border-t">
      <div className="container mx-auto py-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
        <div>
          <h3 className="font-semibold mb-2">DOMINIO</h3>
          <p className="text-muted-foreground">{t('footer.description')}</p>
        </div>
        <nav aria-label="Servicios" className="space-y-2">
          <h3 className="text-lg font-bold mb-3">Servicios</h3>
          <Link className="story-link block" to="/propiedades">{t('nav.properties')}</Link>
          <Link className="story-link block" to="/nuestros-agentes">{t('nav.agents')}</Link>
          <Link className="story-link block" to="/sobre-nosotros">{t('nav.about')}</Link>
          <Link className="story-link block" to="/contacto">{t('nav.contact')}</Link>
        </nav>
        <nav aria-label="Legal" className="space-y-2">
          <h3 className="text-lg font-bold mb-3">Legal</h3>
          <Link className="story-link block" to="/politica-de-privacidad">Política de Privacidad</Link>
          <Link className="story-link block" to="/terminos-y-condiciones">Términos y Condiciones</Link>
          <Link className="story-link block" to="/aviso-legal">Aviso Legal</Link>
          <Link className="story-link block" to="/politica-de-cookies">Política de Cookies</Link>
          <Link className="story-link block" to="/rgpd">RGPD</Link>
        </nav>
        <div>
          <p className="text-muted-foreground">© {new Date().getFullYear()} DOMINIO. {t('footer.copyright')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
