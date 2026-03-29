import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Moon, Sun, Handshake, ArrowLeft, Lock, CheckCircle2, XCircle, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface TokenData {
  token: string;
  email: string;
  expiry: number;
}

const PASSWORD_RULES = [
  { id: 'length', label: 'Mínimo de 8 caracteres', test: (pw: string) => pw.length >= 8 },
  { id: 'letter', label: 'Pelo menos 1 letra', test: (pw: string) => /[a-zA-Z]/.test(pw) },
  { id: 'number', label: 'Pelo menos 1 número', test: (pw: string) => /[0-9]/.test(pw) },
  { id: 'special', label: '1 caractere especial (opcional)', test: (pw: string) => /[^a-zA-Z0-9]/.test(pw), optional: true },
];

function getStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: '', color: '' };
  const passed = PASSWORD_RULES.filter(r => r.test(pw)).length;
  if (passed <= 1) return { score: 20, label: 'Muito fraca', color: 'text-destructive' };
  if (passed === 2) return { score: 40, label: 'Fraca', color: 'text-destructive' };
  if (passed === 3) return { score: 70, label: 'Boa', color: 'text-warning' };
  return { score: 100, label: 'Forte', color: 'text-success' };
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Token validation
  const tokenParam = searchParams.get('token');
  const tokenData = useMemo((): TokenData | null => {
    try {
      const raw = localStorage.getItem('reset_token');
      if (!raw) return null;
      return JSON.parse(raw) as TokenData;
    } catch {
      return null;
    }
  }, []);

  const isTokenValid = useMemo(() => {
    if (!tokenParam || !tokenData) return false;
    if (tokenData.token !== tokenParam) return false;
    if (Date.now() > tokenData.expiry) return false;
    return true;
  }, [tokenParam, tokenData]);

  const strength = useMemo(() => getStrength(password), [password]);

  const requiredRulesPassed = PASSWORD_RULES.filter(r => !r.optional).every(r => r.test(password));
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = requiredRulesPassed && passwordsMatch;

  const handleSubmit = () => {
    setError('');
    if (!passwordsMatch) {
      setError('As senhas não coincidem');
      return;
    }
    if (!requiredRulesPassed) {
      setError('A senha não atende aos requisitos mínimos');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      // Clear token
      localStorage.removeItem('reset_token');
      setLoading(false);
      setSuccess(true);
      toast({ title: 'Senha redefinida com sucesso', description: 'Você será redirecionado para o login.' });
      setTimeout(() => navigate('/login'), 2500);
    }, 1200);
  };

  // Expired/invalid token view
  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

        <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-card/80 backdrop-blur-xl">
            <CardContent className="pt-8 pb-8 px-8 space-y-6 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/15 mx-auto">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <h1 className="text-xl font-bold text-foreground">Link inválido ou expirado</h1>
                <p className="text-sm text-muted-foreground">O link de redefinição não é mais válido. Solicite um novo link na página de login.</p>
              </div>
              <div className="space-y-2">
                <Button className="w-full" onClick={() => navigate('/login')}>
                  <ArrowLeft className="h-4 w-4 mr-2" /> Solicitar novo link
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/8 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <Button variant="ghost" size="icon" className="absolute top-4 right-4 h-9 w-9 rounded-full text-muted-foreground hover:text-foreground" onClick={toggleTheme}>
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
            <motion.div className="text-center space-y-3" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary shadow-lg shadow-primary/25 mb-2">
                <Handshake className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Canal Parceiro</h1>
              <p className="text-sm text-muted-foreground">
                {success ? 'Senha redefinida!' : 'Criar nova senha'}
              </p>
              {tokenData?.email && !success && (
                <p className="text-xs text-muted-foreground/70">{tokenData.email}</p>
              )}
            </motion.div>

            {!success ? (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-5">
                {/* New password */}
                <div className="space-y-2">
                  <Label htmlFor="new-password">Nova senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(''); }}
                      className="pl-10 pr-10"
                      autoFocus
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Strength bar */}
                  {password.length > 0 && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-2 pt-1">
                      <div className="flex items-center gap-2">
                        <Progress value={strength.score} className="h-1.5 flex-1" />
                        <span className={cn('text-[10px] font-medium', strength.color)}>{strength.label}</span>
                      </div>
                      <div className="space-y-1">
                        {PASSWORD_RULES.map(rule => {
                          const passed = rule.test(password);
                          return (
                            <div key={rule.id} className={cn('flex items-center gap-1.5 text-[11px] transition-colors', passed ? 'text-success' : 'text-muted-foreground')}>
                              {passed ? <CheckCircle2 className="h-3 w-3" /> : <div className="h-3 w-3 rounded-full border border-current" />}
                              <span>{rule.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirmar senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      className="pl-10 pr-10"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive">
                      As senhas não coincidem
                    </motion.p>
                  )}
                </div>

                {error && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-destructive text-center">
                    {error}
                  </motion.p>
                )}

                <Button onClick={handleSubmit} className="w-full h-11 shadow-lg shadow-primary/20" disabled={loading || !canSubmit}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Redefinir senha'}
                </Button>

                <Button variant="ghost" className="w-full gap-2 text-muted-foreground hover:text-foreground" onClick={() => navigate('/login')}>
                  <ArrowLeft className="h-4 w-4" /> Voltar para login
                </Button>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 py-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-success/15">
                  <ShieldCheck className="h-7 w-7 text-success" />
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sua senha foi redefinida com sucesso. Redirecionando para o login...
                </p>
                <Loader2 className="h-4 w-4 animate-spin mx-auto text-muted-foreground" />
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
