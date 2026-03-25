import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/data/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, Moon, Sun, Handshake, Crown, Briefcase, Users, Megaphone, TrendingUp } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

const roles: { value: UserRole; label: string; icon: React.ElementType }[] = [
  { value: 'gestor', label: 'Gestor', icon: Crown },
  { value: 'diretor', label: 'Diretor', icon: Briefcase },
  { value: 'gerente', label: 'Gerente', icon: Users },
  { value: 'ascom', label: 'ASCOM', icon: Megaphone },
  { value: 'comercial', label: 'Comercial', icon: TrendingUp },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>('comercial');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      login(selectedRole);
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

            {/* Role Selector */}
            <div className="space-y-3">
              <Label className="text-muted-foreground text-xs uppercase tracking-wider">Perfil de acesso</Label>
              <RadioGroup value={selectedRole} onValueChange={(v) => setSelectedRole(v as UserRole)} className="grid grid-cols-2 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  return (
                    <Label
                      key={role.value}
                      htmlFor={role.value}
                      className={`flex items-center gap-2.5 rounded-xl border-2 p-3 cursor-pointer transition-all duration-200 hover:border-primary/50 ${
                        selectedRole === role.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border'
                      }`}
                    >
                      <RadioGroupItem value={role.value} id={role.value} className="sr-only" />
                      <Icon className={`h-4 w-4 shrink-0 transition-colors ${selectedRole === role.value ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium">{role.label}</span>
                    </Label>
                  );
                })}
              </RadioGroup>
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
