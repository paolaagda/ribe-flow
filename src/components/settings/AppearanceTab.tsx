import { useTheme } from '@/hooks/useTheme';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Sun } from 'lucide-react';

export default function AppearanceTab() {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {theme === 'dark' ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-primary" />}
          <div>
            <Label className="text-sm font-medium">Modo escuro</Label>
            <p className="text-xs text-muted-foreground">Alterne entre o tema claro e escuro</p>
          </div>
        </div>
        <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
      </div>
      <div className="space-y-2 pt-4 border-t border-border">
        <p className="text-sm"><span className="font-medium">App:</span> Canal Parceiro</p>
        <p className="text-sm"><span className="font-medium">Versão:</span> 1.0.0</p>
        <p className="text-sm text-muted-foreground">Sistema de gestão de visitas e prospecções comerciais.</p>
      </div>
    </div>
  );
}
