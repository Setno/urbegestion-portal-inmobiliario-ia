import React, { useState } from 'react';
import { 
  X, 
  Lock, 
  KeyRound, 
  Mail, 
  ArrowRight,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { useBrandStore } from '../../stores/useBrandStore';

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
  const { config: agencyConfig } = useBrandStore();
  const [email, setEmail] = useState('');
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
      const cleanUser = email.toLowerCase().trim();
      const cleanPass = password.trim();

      // Authorized credentials (Full email or short demo alias)
      const isAuthorizedUser = 
        cleanUser === 'admin' || 
        cleanUser === 'pilar' || 
        cleanUser === 'demo' ||
        cleanUser.includes('urbe') || 
        cleanUser.includes('admin') || 
        cleanUser === agencyConfig.contact.email.toLowerCase();

      const isAuthorizedPass = 
        cleanPass === 'admin' || 
        cleanPass === '1234' || 
        cleanPass === 'admin123' || 
        cleanPass === 'urbe2026' || 
        cleanPass === '123456';

      if (isAuthorizedUser && isAuthorizedPass) {
        sessionStorage.setItem('urbe_admin_authenticated', 'true');
        setIsLoading(false);
        onLoginSuccess();
        onClose();
      } else {
        setIsLoading(false);
        setErrorMsg('Acceso denegado: Usuario o contraseña no autorizados.');
      }
    }, 450);
  };

  // Secret Fast Fill for Live Presentations: Clicking the lock icon autofills and logs in
  const handleSecretLockClick = () => {
    setEmail(agencyConfig.contact.email || 'admin@corredora.cl');
    setPassword('••••••••');
    setIsLoading(true);
    setTimeout(() => {
      sessionStorage.setItem('urbe_admin_authenticated', 'true');
      setIsLoading(false);
      onLoginSuccess();
      onClose();
    }, 350);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 relative overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200"
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

        {/* Header with Secret One-Click on the Lock Icon */}
        <div className="text-center space-y-2 mb-6">
          <div 
            onClick={handleSecretLockClick}
            className="w-12 h-12 rounded-2xl bg-urbe-primary/10 text-urbe-primary flex items-center justify-center mx-auto shadow-sm cursor-pointer hover:bg-urbe-primary/20 hover:scale-105 active:scale-95 transition-all"
            title="Acceso Seguro"
          >
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
              Usuario o Correo
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="admin o tu correo corporativo"
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
            <span>{isLoading ? 'Verificando credenciales...' : 'Ingresar al Panel CRM'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-100 text-center">
          <span className="text-[10px] text-slate-400 font-medium">
            Acceso restringido únicamente a corredores autorizados de {agencyConfig.brandName}.
          </span>
        </div>

      </div>
    </div>
  );
};
