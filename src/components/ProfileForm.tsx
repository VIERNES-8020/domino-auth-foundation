import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { User, Upload } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabaseClient";
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
}

interface ProfileFormProps {
  user: SupabaseUser;
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const sb = getSupabaseClient();
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
  });

  useEffect(() => {
    fetchProfile();
  }, [user.id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await sb
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
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
      const { error: uploadError } = await sb.storage
        .from('avatars')
        .upload(fileName, processedBlob, { 
          upsert: true,
          contentType: 'image/jpeg'
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL with timestamp to force refresh
      const { data: { publicUrl } } = sb.storage
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
      const { error } = await sb
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
    <div className="space-y-6">
      <Card className="shadow-sm bg-background">
        <CardHeader className="bg-secondary/50">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Mi Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload Section */}
            <Card className="bg-muted/30">
              <CardContent className="p-6">
                <div className="flex flex-col items-center space-y-4">
                  <Avatar className="h-32 w-32">
                    <AvatarImage src={profile.avatar_url} alt="Avatar" />
                    <AvatarFallback className="text-lg">
                      {profile.full_name?.split(' ').map(n => n[0]).join('') || 'AG'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="avatar-upload" className="cursor-pointer">
                      <Button type="button" variant="outline" size="sm" disabled={uploading} asChild>
                        <div className="flex items-center gap-2">
                          <Upload className="h-4 w-4" />
                          {uploading ? 'Subiendo...' : 'Cambiar foto'}
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
                  <p className="text-xs text-muted-foreground text-center">
                    Formatos: JPG, PNG. Se redimensionará automáticamente a 400x400px.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Basic Information Section */}
            <Card className="bg-background">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Información Básica</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Nombre completo</Label>
                    <Input
                      id="full_name"
                      value={profile.full_name || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Tu nombre completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="title">Título profesional</Label>
                    <Input
                      id="title"
                      value={profile.title || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Ej: Agente Inmobiliario Senior"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="corporate_phone">Teléfono corporativo</Label>
                    <Input
                      id="corporate_phone"
                      value={profile.corporate_phone || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, corporate_phone: e.target.value }))}
                      placeholder="+591 123-4567"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agent_code">Código de agente</Label>
                    <Input
                      id="agent_code"
                      value={profile.agent_code || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, agent_code: e.target.value }))}
                      placeholder="LMG4567"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Biography & Education Section */}
            <Card className="bg-background">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Acerca de Mí</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Biografía profesional</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Cuéntanos sobre ti, tu experiencia y especialidades..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="education">Educación y certificaciones</Label>
                  <Textarea
                    id="education"
                    value={profile.education || ""}
                    onChange={(e) => setProfile(prev => ({ ...prev, education: e.target.value }))}
                    placeholder="Tu formación académica, certificaciones inmobiliarias, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Social Links Section */}
            <Card className="bg-background">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Redes Sociales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="facebook_url">Facebook</Label>
                    <Input
                      id="facebook_url"
                      type="url"
                      value={profile.facebook_url || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, facebook_url: e.target.value }))}
                      placeholder="https://facebook.com/tu-perfil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="instagram_url">Instagram</Label>
                    <Input
                      id="instagram_url"
                      type="url"
                      value={profile.instagram_url || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, instagram_url: e.target.value }))}
                      placeholder="https://instagram.com/tu-perfil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedin_url">LinkedIn</Label>
                    <Input
                      id="linkedin_url"
                      type="url"
                      value={profile.linkedin_url || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, linkedin_url: e.target.value }))}
                      placeholder="https://linkedin.com/in/tu-perfil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website_url">Sitio web</Label>
                    <Input
                      id="website_url"
                      type="url"
                      value={profile.website_url || ""}
                      onChange={(e) => setProfile(prev => ({ ...prev, website_url: e.target.value }))}
                      placeholder="https://tu-sitio.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}