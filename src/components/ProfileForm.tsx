import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Upload, CreditCard, Sparkles, Phone, Mail, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser } from "@supabase/supabase-js";

interface Profile {
  id: string;
  full_name?: string;
  bio?: string;
  title?: string;
  education?: string;
  avatar_url?: string;
  facebook_url?: string;
  instagram_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  website_url?: string;
  corporate_phone?: string;
  agent_code?: string;
  identity_card?: string;
}

interface ProfileFormProps {
  user: SupabaseUser;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    id: user.id,
    full_name: "",
    bio: "",
    title: "",
    education: "",
    avatar_url: "",
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    twitter_url: "",
    website_url: "",
    corporate_phone: "",
    agent_code: "",
    identity_card: "",
  });

  // Función para generar código de agente automáticamente
  const generateAgentCode = (fullName: string, identityCard: string) => {
    if (!fullName || !identityCard) return "";
    
    // Obtener iniciales del nombre completo
    const initials = fullName
      .trim()
      .split(' ')
      .filter(word => word.length > 0)
      .map(word => word[0].toUpperCase())
      .join('');
    
    // Obtener últimos 4 dígitos del carnet
    const digits = identityCard.replace(/\D/g, ''); // Solo números
    const lastFourDigits = digits.slice(-4);
    
    if (initials && lastFourDigits.length === 4) {
      return `${initials}${lastFourDigits}`;
    }
    
    return "";
  };

  // Efecto para generar automáticamente el código cuando cambian nombre o carnet
  useEffect(() => {
    if (profile.full_name && profile.identity_card) {
      const newCode = generateAgentCode(profile.full_name, profile.identity_card);
      if (newCode && newCode !== profile.agent_code) {
        setProfile(prev => ({ ...prev, agent_code: newCode }));
      }
    }
  }, [profile.full_name, profile.identity_card]);

  useEffect(() => {
    fetchProfile();
  }, [user.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const processImageToSquare = async (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No canvas context'));
          return;
        }
        
        // Make it square 400x400
        canvas.width = 400;
        canvas.height = 400;
        
        // Calculate crop dimensions to maintain aspect ratio
        const size = Math.min(img.naturalWidth, img.naturalHeight);
        const startX = (img.naturalWidth - size) / 2;
        const startY = (img.naturalHeight - size) / 2;
        
        // Draw cropped and resized image
        ctx.drawImage(img, startX, startY, size, size, 0, 0, 400, 400);
        
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error('No blob'));
        }, 'image/jpeg', 0.9);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // Process image to square 400x400
      const processedBlob = await processImageToSquare(file);
      
      const fileName = `${user.id}/avatar.jpg`;

      // Upload processed image to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, processedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL with timestamp to force refresh
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const timestampedUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with new avatar URL
      setProfile(prev => ({ ...prev, avatar_url: timestampedUrl }));
      toast.success("Avatar subido exitosamente");
      
    } catch (error: any) {
      toast.error("Error subiendo avatar: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          ...profile,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast.success("Perfil actualizado exitosamente");
    } catch (error: any) {
      toast.error("Error actualizando perfil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Card className="overflow-hidden border-0 shadow-lg bg-gradient-to-br from-background via-background to-accent/20">
        <CardHeader className="bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-b border-primary/20">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="p-2 rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Mi Perfil AURA
              </span>
              <p className="text-sm text-muted-foreground font-normal mt-1">
                Configura tu perfil profesional de agente inmobiliario
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Upload Section */}
            <Card className="overflow-hidden border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 shadow-md">
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative">
                    <Avatar className="h-40 w-40 ring-4 ring-primary/20 ring-offset-4 ring-offset-background shadow-xl">
                      <AvatarImage src={profile.avatar_url} alt="Avatar" className="object-cover" />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/30 text-primary">
                        {profile.full_name?.split(' ').map(n => n[0]).join('') || 'AG'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-2 -right-2 p-2 bg-primary rounded-full shadow-lg">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="lg" 
                        disabled={uploading} 
                        className="border-primary/30 hover:border-primary bg-gradient-to-r from-background to-primary/5 hover:shadow-lg transition-all duration-300"
                        asChild
                      >
                        <div className="flex items-center gap-3 px-6">
                          <Upload className="h-5 w-5" />
                          {uploading ? 'Procesando imagen...' : 'Cambiar Avatar'}
                        </div>
                      </Button>
                    </Label>
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="sr-only"
                    />
                  </div>
                  <div className="text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      ✨ <strong>Auto-optimización AURA:</strong> Cualquier formato se convertirá automáticamente a JPG
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Se redimensionará a 400x400px para la mejor calidad
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information Section */}
            <Card className="overflow-hidden border border-primary/10 bg-gradient-to-br from-background to-secondary/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-secondary/30 to-secondary/50 border-b border-secondary/30 pb-6">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  Información Básica
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="full_name" className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Nombre completo
                    </Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Tu nombre completo"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-background to-secondary/10 focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Título profesional
                    </Label>
                    <Input
                      id="title"
                      value={profile.title || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Ing. Comercial / Agente Inmobiliario"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-background to-secondary/10 focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="identity_card" className="text-sm font-semibold flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-primary" />
                      Carnet de Identidad
                    </Label>
                    <Input
                      id="identity_card"
                      value={profile.identity_card || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, identity_card: e.target.value }))}
                      placeholder="12345678"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-background to-secondary/10 focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="corporate_phone" className="text-sm font-semibold flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" />
                      Teléfono corporativo
                    </Label>
                    <Input
                      id="corporate_phone"
                      value={profile.corporate_phone || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, corporate_phone: e.target.value }))}
                      placeholder="+591 123-4567"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-background to-secondary/10 focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="agent_code" className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Código AURA
                      <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">Auto-generado</span>
                    </Label>
                    <Input
                      id="agent_code"
                      value={profile.agent_code || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, agent_code: e.target.value }))}
                      placeholder="ABC1234"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-primary/5 to-primary/10 focus:shadow-lg transition-all duration-300 font-mono text-center font-semibold"
                      readOnly={!!generateAgentCode(profile.full_name || '', profile.identity_card || '')}
                    />
                    {profile.full_name && profile.identity_card && (
                      <p className="text-xs text-primary flex items-center gap-1 mt-2">
                        <Sparkles className="h-3 w-3" />
                        Generado automáticamente con iniciales + carnet
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biography & Education Section */}
            <Card className="overflow-hidden border border-primary/10 bg-gradient-to-br from-background to-accent/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-accent/30 to-accent/50 border-b border-accent/30 pb-6">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  Acerca de Mí
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <Label htmlFor="bio" className="text-sm font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Biografía profesional
                      <div className="ml-auto flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                        <Sparkles className="h-3 w-3" />
                        AURA Asistente
                      </div>
                    </Label>
                    <Textarea
                      id="bio"
                      value={profile.bio || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="✨ AURA te ayuda: Describe tu pasión por bienes raíces, años de experiencia, especialidades (residencial, comercial, lujo), logros destacados, y qué te diferencia como agente inmobiliario profesional..."
                      rows={4}
                      className="border-primary/20 focus:border-primary bg-gradient-to-br from-background to-secondary/10 focus:shadow-lg transition-all duration-300 resize-none"
                    />
                    <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <strong className="text-primary">💡 Sugerencia AURA:</strong> Menciona tu experiencia, especialidades, certificaciones, y filosofía de servicio al cliente. Ejemplo: "Soy un profesional apasionado por bienes raíces con X años de experiencia..."
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label htmlFor="education" className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Educación y certificaciones
                      <div className="ml-auto flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
                        <Sparkles className="h-3 w-3" />
                        AURA Asistente
                      </div>
                    </Label>
                    <Textarea
                      id="education"
                      value={profile.education || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))}
                      placeholder="✨ AURA te ayuda: Lista tu título universitario, certificaciones inmobiliarias, licencias, cursos de especialización, diplomados, y formación continua..."
                      rows={3}
                      className="border-primary/20 focus:border-primary bg-gradient-to-br from-background to-secondary/10 focus:shadow-lg transition-all duration-300 resize-none"
                    />
                    <div className="text-xs text-muted-foreground bg-primary/5 p-3 rounded-lg border border-primary/10">
                      <strong className="text-primary">💡 Sugerencia AURA:</strong> Incluye grado académico, certificaciones profesionales, licencias vigentes, y cursos recientes. Ejemplo: "Licenciado en Administración de Empresas, Certificado en Avalúos Inmobiliarios..."
                    </div>
                  </div>
              </CardContent>
            </Card>

            {/* Social Links Section */}
            <Card className="overflow-hidden border border-primary/10 bg-gradient-to-br from-background to-muted/20 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-muted/30 to-muted/50 border-b border-muted/30 pb-6">
                <CardTitle className="text-xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Globe className="h-5 w-5 text-primary" />
                  </div>
                  Presencia Digital
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label htmlFor="facebook_url" className="text-sm font-semibold flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">f</span>
                      </div>
                      Facebook
                    </Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={profile.facebook_url || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, facebook_url: e.target.value }))}
                      placeholder="https://facebook.com/tu-perfil"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-background to-secondary/10 focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="instagram_url" className="text-sm font-semibold flex items-center gap-2">
                      <div className="w-4 h-4 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs">📸</span>
                      </div>
                      Instagram
                    </Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={profile.instagram_url || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/tu-perfil"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-background to-secondary/10 focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="linkedin_url" className="text-sm font-semibold flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-700 rounded-sm flex items-center justify-center">
                        <span className="text-white text-xs font-bold">in</span>
                      </div>
                      LinkedIn
                    </Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={profile.linkedin_url || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/tu-perfil"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-background to-secondary/10 focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label htmlFor="website_url" className="text-sm font-semibold flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      Sitio web personal
                    </Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={profile.website_url || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, website_url: e.target.value }))}
                      placeholder="https://tu-sitio-personal.com"
                      className="h-12 border-primary/20 focus:border-primary bg-gradient-to-r from-background to-secondary/10 focus:shadow-lg transition-all duration-300"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
              <Button 
                type="submit" 
                disabled={loading}
                size="lg"
                className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 text-white font-semibold"
              >
                {loading ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Guardando perfil AURA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Guardar Perfil AURA
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}