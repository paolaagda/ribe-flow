import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import AppLayout from "@/components/AppLayout";
import LoginPage from "@/pages/LoginPage";
import AgendaPage from "@/pages/AgendaPage";
import AnalisesPage from "@/pages/AnalisesPage";
import ParceirosPage from "@/pages/ParceirosPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import CampanhasPage from "@/pages/CampanhasPage";
import CadastroPage from "@/pages/CadastroPage";
import CadastroDetalhePage from "@/pages/CadastroDetalhePage";
import ColaboradorPerfilPage from "@/pages/ColaboradorPerfilPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import InformacoesUteisPage from "@/pages/InformacoesUteisPage";
import LinksUteisPage from "@/pages/LinksUteisPage";
import GestaoTarefasPage from "@/pages/GestaoTarefasPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <AppLayout>{children}</AppLayout>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/agenda" replace /> : <LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/" element={<Navigate to="/agenda" replace />} />
      <Route path="/dashboard" element={<Navigate to="/agenda" replace />} />
      <Route path="/campanhas" element={<ProtectedRoute><CampanhasPage /></ProtectedRoute>} />
      <Route path="/agenda" element={<ProtectedRoute><AgendaPage /></ProtectedRoute>} />
      <Route path="/analises" element={<ProtectedRoute><AnalisesPage /></ProtectedRoute>} />
      <Route path="/parceiros" element={<ProtectedRoute><ParceirosPage /></ProtectedRoute>} />
      <Route path="/informacoes" element={<ProtectedRoute><InformacoesUteisPage /></ProtectedRoute>} />
      <Route path="/links" element={<ProtectedRoute><LinksUteisPage /></ProtectedRoute>} />
      <Route path="/tarefas" element={<ProtectedRoute><GestaoTarefasPage /></ProtectedRoute>} />
      <Route path="/configuracoes" element={<ProtectedRoute><ConfiguracoesPage /></ProtectedRoute>} />
      <Route path="/cadastro" element={<ProtectedRoute><CadastroPage /></ProtectedRoute>} />
      <Route path="/cadastro/:id" element={<ProtectedRoute><CadastroDetalhePage /></ProtectedRoute>} />
      <Route path="/colaborador/:id" element={<ProtectedRoute><ColaboradorPerfilPage /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <NotificationProvider>
            <AppRoutes />
          </NotificationProvider>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
