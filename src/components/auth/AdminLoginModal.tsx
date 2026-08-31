import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  Mail, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { agencyConfig } from '../../config/agencyConfig';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [email, setEmail] = useState('pilar@urbegestion.cl');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      // Demo authentication logic (Accepts standard credentials or admin passwords)
      if (
        (email.toLowerCase().includes('urbe') || email.toLowerCase().includes('admin') || email.toLowerCase().includes('pilar')) &&
        (password === 'admin123' || password === 'urbe2026' || password === '123456' || password.length >= 4)
      ) {
        sessionStorage.setItem('urbe_admin_authenticated', 'true');
        setIsLoading(false);
        onLoginSuccess();
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg('Credenciales incorrectas. (Para demo usa clave: admin123)');
      }
    }, 400);
  };

  const handleQuickDemoLogin = () => {
    sessionStorage.setItem('urbe_admin_authenticated', 'true');
    onLoginSuccess();
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-urbe-accent/20 rounded-full blur-2xl pointer-events-none" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          aria-label="Cerrar modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-urbe-primary/10 text-urbe-primary flex items-center justify-center mx-auto shadow-sm">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">
            Acceso Privado Administrador
          </h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Panel de Gestión Inmobiliaria & CRM para {agencyConfig.brandName}.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Correo Electrónico
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="pilar@urbegestion.cl"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-urbe-primary"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:ring-2 focus:ring-urbe-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-urbe-primary hover:bg-urbe-primaryDark text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{isLoading ? 'Verificando...' : 'Ingresar al Panel CRM'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Access Button for Live Presentations */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
            <span>¿Estás en una presentación?</span>
            <span className="text-emerald-700 font-bold">Modo Demo</span>
          </div>

          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
          >
            <Sparkles className="w-3.5 h-3.5 text-urbe-accent" />
            <span>Acceso Rápido 1-Clic (Demostración)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
