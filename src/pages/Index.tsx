import AuthForm from "@/components/auth/AuthForm";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30">
      <header className="container mx-auto py-10">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Inmobiliaria DOMIN10 — Autenticación
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">
          Regístrate o inicia sesión para acceder al panel de gestión.
        </p>
        <div className="mt-6">
          <Button asChild>
            <Link to="/dashboard/agent">Ir al Panel del Agente</Link>
          </Button>
        </div>
      </header>
      <main className="container mx-auto pb-16">
        <section aria-labelledby="auth-section" className="flex justify-center">
          <h2 id="auth-section" className="sr-only">Formulario de autenticación</h2>
          <AuthForm />
        </section>
      </main>
    </div>
  );
};

export default Index;
