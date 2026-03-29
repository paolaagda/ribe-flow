import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { AppProfile, CompanyCargo, cargoLabels, allCargos } from '@/data/mock-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Moon, Sun, Handshake, ArrowLeft, Mail, CheckCircle2, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const [isGestor, setIsGestor] = useState(false);
  const [cargo, setCargo] = useState<CompanyCargo>('comercial');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [mockResetLink, setMockResetLink] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const handleLogin = () => {
    setLoading(true);
    const appProfile: AppProfile = isGestor ? 'gestor' : 'nao_gestor';
    setTimeout(() => {
      login(cargo, appProfile);
      navigate('/dashboard');
    }, 800);
  };

  const handleForgotSubmit = () => {
    setForgotError('');
    if (!forgotEmail.trim()) {
      setForgotError('Informe seu e-mail');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotEmail.trim())) {
      setForgotError('Digite um e-mail válido');
      return;
    }
    setForgotLoading(true);
    setTimeout(() => {
      // Generate mock token with 15min expiry
      const token = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      const expiry = Date.now() + 15 * 60 * 1000; // 15 minutes
      localStorage.setItem('reset_token', JSON.stringify({ token, email: forgotEmail.trim(), expiry }));

      setForgotLoading(false);
      setForgotSuccess(true);
      setMockResetLink(`/reset-password?token=${token}`);
      toast({
        title: 'Instruções enviadas',
        description: 'Verifique sua caixa de entrada.',
      });
    }, 1500);
  };

  const resetForgot = () => {
    setShowForgot(false);
    setForgotEmail('');
    setForgotError('');
    setForgotSuccess(false);
    setMockResetLink('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

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
              <p className="text-sm text-muted-foreground">
                {showForgot ? 'Recuperar senha' : 'Acesse sua conta'}
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {!showForgot ? (
                <motion.div
                  key="login-form"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-7"
                >
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
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-xs text-primary hover:underline transition-colors"
                    >
                      Esqueci minha senha
                    </button>
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

                  {/* Profile Toggle */}
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
                </motion.div>
              ) : (
                <motion.div
                  key="forgot-form"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-5"
                >
                  {!forgotSuccess ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="forgot-email">E-mail cadastrado</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="forgot-email"
                            type="email"
                            placeholder="seu@email.com"
                            value={forgotEmail}
                            onChange={(e) => { setForgotEmail(e.target.value); setForgotError(''); }}
                            className="pl-10"
                            autoFocus
                          />
                        </div>
                        {forgotError && (
                          <motion.p
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-xs text-destructive"
                          >
                            {forgotError}
                          </motion.p>
                        )}
                      </div>

                      <Button
                        onClick={handleForgotSubmit}
                        className="w-full h-11 shadow-lg shadow-primary/20"
                        disabled={forgotLoading}
                      >
                        {forgotLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Enviar instruções'}
                      </Button>
                    </>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-3 py-4"
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success/15">
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.
                      </p>
                    </motion.div>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-muted-foreground hover:text-foreground"
                    onClick={resetForgot}
                  >
                    <ArrowLeft className="h-4 w-4" /> Voltar para login
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
