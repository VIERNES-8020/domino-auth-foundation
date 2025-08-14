import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import brandLogo from "@/assets/logo-dominio.svg";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function Header() {
  const sb = useMemo(() => getSupabaseClient(), []);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    sb.auth.getSession().then(({ data: { session } }) => setSession(session));
    return () => subscription.unsubscribe();
  }, [sb]);

  return (
    <header className="container mx-auto py-5">
      <nav className="flex items-center justify-between" aria-label="Principal">
        <Link to="/" className="flex items-center gap-2 hover-scale" aria-label="DOMINIO Inicio">
          <img src="/lovable-uploads/0db86b24-3da5-42a2-9780-da456242b977.png" alt="DOMINIO Inmobiliaria - logotipo oficial" className="h-12 w-auto" />
        </Link>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="story-link">Inicio</Link>
            <Link to="/properties" className="story-link">Propiedades</Link>
            <Link to="/agents" className="story-link">Nuestros Agentes</Link>
            <Link to="/about" className="story-link">Sobre Nosotros</Link>
            <Link to="/contact" className="story-link">Contacto</Link>
          </div>
          {session ? (
            <div className="flex items-center gap-2">
              <Button asChild>
                <Link to="/dashboard/agent">Ir a mi Panel</Link>
              </Button>
              <Button variant="outline" onClick={async () => { await sb.auth.signOut(); }}>
                Cerrar Sesión
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link to="/auth">Iniciar Sesión</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Registrarse</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
