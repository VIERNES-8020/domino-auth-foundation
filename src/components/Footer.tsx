import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="mt-12 border-t">
      <div className="container mx-auto py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
        <div>
          <h3 className="font-semibold mb-2">DOMINIO</h3>
          <p className="text-muted-foreground">La red de franquicias inmobiliarias más grande de Bolivia.</p>
        </div>
        <nav aria-label="Enlaces" className="space-y-2">
          <Link className="story-link block" to="/propiedades">Propiedades</Link>
          <Link className="story-link block" to="/agentes">Nuestros Agentes</Link>
          <Link className="story-link block" to="/sobre-nosotros">Sobre Nosotros</Link>
          <Link className="story-link block" to="/contacto">Contacto</Link>
        </nav>
        <div>
          <p className="text-muted-foreground">© {new Date().getFullYear()} DOMINIO. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
