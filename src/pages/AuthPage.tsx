import AuthForm from "@/components/auth/AuthForm";
import { useLanguage } from "@/contexts/LanguageContext";

export default function AuthPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/30 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
            {t('auth.title')}
          </h1>
          <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
            {t('auth.subtitle')}
          </p>
        </div>
        <div className="flex justify-center">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}