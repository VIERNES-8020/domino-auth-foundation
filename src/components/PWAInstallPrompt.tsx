import { useState, useEffect } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Check if user dismissed recently (don't show for 7 days)
    const dismissedAt = localStorage.getItem('pwa-prompt-dismissed');
    if (dismissedAt) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedAt)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Only show on mobile after a short delay
      if (isMobile) {
        setTimeout(() => setShowPrompt(true), 2000);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check for iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS && isMobile && !isInstalled) {
      setTimeout(() => setShowPrompt(true), 2000);
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [isMobile, isInstalled]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    setShowPrompt(false);
  };

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  if (!showPrompt || isInstalled || !isMobile) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md mx-4 mb-4 bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        {/* Header con gradiente */}
        <div className="relative bg-gradient-to-br from-[#C76C33] to-[#e07d3a] px-6 py-8 text-center">
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          {/* Logo */}
          <div className="w-20 h-20 mx-auto mb-4 bg-white rounded-2xl shadow-lg flex items-center justify-center p-2">
            <img 
              src="/lovable-uploads/0db86b24-3da5-42a2-9780-da456242b977.png" 
              alt="DOMIN10" 
              className="w-full h-full object-contain"
            />
          </div>
          
          <h2 className="text-xl font-bold text-white mb-1">
            ¡Instala DOMIN10!
          </h2>
          <p className="text-white/90 text-sm">
            Tu inmobiliaria en la palma de tu mano
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-5">
          <div className="space-y-3 mb-5">
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Smartphone className="w-5 h-5 text-[#C76C33]" />
              </div>
              <p className="text-sm">Acceso rápido desde tu pantalla de inicio</p>
            </div>
            <div className="flex items-center gap-3 text-gray-700">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5 text-[#C76C33]" />
              </div>
              <p className="text-sm">Sin ocupar espacio de almacenamiento</p>
            </div>
          </div>

          {isIOS ? (
            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <p className="text-sm text-gray-600 text-center">
                Toca <span className="inline-flex items-center px-2 py-0.5 bg-gray-200 rounded text-xs font-medium mx-1">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M15 8a.5.5 0 00-.5-.5H11V3.5a.5.5 0 00-1 0V7.5H5.5a.5.5 0 000 1H10v4.5a.5.5 0 001 0V8.5h3.5A.5.5 0 0015 8z" />
                    <path d="M2 14a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 01-2 2H4a2 2 0 01-2-2v-2z" />
                  </svg>
                  Compartir
                </span> y luego <strong>"Añadir a pantalla de inicio"</strong>
              </p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="flex-1 h-12 rounded-xl border-gray-200"
            >
              Ahora no
            </Button>
            {!isIOS && (
              <Button
                onClick={handleInstall}
                className="flex-1 h-12 rounded-xl bg-[#C76C33] hover:bg-[#b55e28] text-white shadow-lg shadow-orange-500/25"
              >
                <Download className="w-4 h-4 mr-2" />
                Instalar
              </Button>
            )}
            {isIOS && (
              <Button
                onClick={handleDismiss}
                className="flex-1 h-12 rounded-xl bg-[#C76C33] hover:bg-[#b55e28] text-white shadow-lg shadow-orange-500/25"
              >
                Entendido
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
