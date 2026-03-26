import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { AppProfile, CompanyCargo, cargoLabels, allCargos } from '@/data/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Moon, Sun, Handshake } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export default function LoginPage() {
  const [isGestor, setIsGestor] = useState(false);
  const [cargo, setCargo] = useState<CompanyCargo>('comercial');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = () => {
    setLoading(true);
    const appProfile: AppProfile = isGestor ? 'gestor' : 'nao_gestor';
    setTimeout(() => {
      login(cargo, appProfile);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground transition-colors"
        onClick={toggleTheme}
      >
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      <motion.div
        initial={{ opacity: 0, scale: 0.95, filter: 'blur(4px)' }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
          <CardContent className="pt-8 pb-8 px-8 space-y-7">
            {/* Logo */}
            <motion.div
              className="text-center space-y-3"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary shadow-lg shadow-primary/25 mb-2">
                <Handshake className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Canal Parceiro</h1>
              <p className="text-sm text-muted-foreground">Acesse sua conta</p>
            </motion.div>

            {/* Form */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" defaultValue="usuario@ribercred.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="••••••••" defaultValue="12345678" />
              </div>
            </div>

            {/* Cargo Selector */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Cargo</Label>
              <Select value={cargo} onValueChange={(v) => setCargo(v as CompanyCargo)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {allCargos.map(c => (
                    <SelectItem key={c} value={c}>{cargoLabels[c]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Profile Toggle (App) */}
            <div className="flex items-center justify-between rounded-xl border-2 border-border p-3">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Perfil do App</Label>
                <p className="text-xs text-muted-foreground">
                  {isGestor ? 'Acesso completo ao sistema' : 'Acesso limitado aos seus dados'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Não Gestor</span>
                <Switch checked={isGestor} onCheckedChange={setIsGestor} />
                <span className={`text-xs font-medium ${isGestor ? 'text-primary' : 'text-muted-foreground'}`}>Gestor</span>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              className="w-full h-11 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow"
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Entrar'}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
