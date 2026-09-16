import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  RotateCcw
} from 'lucide-react';
import { MatchPointLogo } from './MatchPointLogo';
import { StorageService } from '../services/storage';
import { User as UserType } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: UserType) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [viewMode, setViewMode] = useState<'login' | 'forgot_password' | 'enter_code' | 'reset_success'>('login');

  // Login Form State
  const [email, setEmail] = useState('admin@matchpoint.com.br');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recovery Form State
  const [recoveryEmail, setRecoveryEmail] = useState('admin@matchpoint.com.br');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [inputCode, setInputCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    setTimeout(() => {
      const result = StorageService.login(email, password);
      setIsLoading(false);

      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMessage(result.message || 'Credenciais inválidas. Verifique seu e-mail e senha.');
      }
    }, 400);
  };

  // Step 1: Send Recovery Code
  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const res = StorageService.requestPasswordReset(recoveryEmail);
      if (res.success && res.code) {
        setGeneratedCode(res.code);
        setViewMode('enter_code');
      } else {
        setRecoveryError(res.message || 'E-mail não encontrado.');
      }
    }, 450);
  };

  // Step 2 & 3: Confirm Code and Set New Password
  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);

    if (inputCode.trim() !== generatedCode) {
      setRecoveryError('Código de verificação incorreto. Confira os 6 dígitos gerados.');
      return;
    }

    if (newPassword.length < 6) {
      setRecoveryError('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setRecoveryError('As senhas digitadas não coincidem.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      StorageService.confirmPasswordReset(recoveryEmail, newPassword);
      setPassword(newPassword);
      setEmail(recoveryEmail);
      setViewMode('reset_success');
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-[#FDF2E7] flex flex-col justify-between relative overflow-hidden font-sans selection:bg-[#FF530D] selection:text-white">
      {/* Background Decorative Ambient Circles */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#FF530D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#FBBF3D]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#93161F]/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Brand Header */}
      <header className="p-6 sm:p-8 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <MatchPointLogo variant="horizontal" theme="dark" size="md" />
        </div>
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-[#FF530D]" />
          <span>Ambiente Seguro • Multi-Tenant RLS</span>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 z-10">
        <div className="w-full max-w-md">
          {/* Card Wrapper */}
          <div className="bg-[#1a1a1a] rounded-3xl border border-[#2a2a2a] shadow-2xl overflow-hidden relative backdrop-blur-md">
            {/* Top Color Accent Line */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[#FF530D] via-[#FBBF3D] to-[#D90000]" />

            <div className="p-6 sm:p-8 space-y-6">
              {/* VIEW 1: LOGIN */}
              {viewMode === 'login' && (
                <>
                  {/* Title & Brand Slogan */}
                  <div className="text-center space-y-2">
                    <div className="flex justify-center pb-1">
                      <div className="h-12 w-12 rounded-2xl bg-[#FF530D]/10 border border-[#FF530D]/30 flex items-center justify-center text-[#FF530D]">
                        <KeyRound className="h-6 w-6" />
                      </div>
                    </div>
                    <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                      Acesso ao Sistema
                    </h1>
                    <p className="text-xs text-[#FBBF3D] font-medium tracking-wide">
                      Precisão para chegar. Estratégia para permanecer.
                    </p>
                  </div>

                  {/* Error Alert */}
                  {errorMessage && (
                    <div className="bg-[#D90000]/15 border border-[#D90000]/40 text-[#FF530D] p-3 rounded-xl text-xs flex items-center gap-2 animate-shake">
                      <AlertCircle className="h-4 w-4 shrink-0 text-[#D90000]" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleLogin} className="space-y-4">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        E-mail Cadastrado
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          id="input-login-email"
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="admin@matchpoint.com.br"
                          className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#333333] rounded-xl text-sm font-semibold text-[#FDF2E7] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF530D] focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Senha de Acesso
                        </label>
                        <button
                          type="button"
                          id="btn-forgot-password-link"
                          onClick={() => {
                            setRecoveryEmail(email || 'admin@matchpoint.com.br');
                            setRecoveryError(null);
                            setViewMode('forgot_password');
                          }}
                          className="text-xs font-semibold text-[#FF530D] hover:text-[#ff7438] transition-colors cursor-pointer"
                        >
                          Esqueci minha senha
                        </button>
                      </div>

                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          id="input-login-password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-2.5 bg-[#111111] border border-[#333333] rounded-xl text-sm font-semibold text-[#FDF2E7] placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#FF530D] focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          id="btn-toggle-password-visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          aria-label={showPassword ? 'Ocultar senha' : 'Ver senha'}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Remember me */}
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-700 bg-[#111111] text-[#FF530D] focus:ring-[#FF530D] accent-[#FF530D] cursor-pointer"
                        />
                        <span className="text-xs text-slate-300 font-medium">Lembrar meu acesso</span>
                      </label>
                    </div>

                    {/* Submit Button */}
                    <button
                      id="btn-submit-login"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 px-4 bg-[#FF530D] hover:bg-[#e04505] active:scale-[0.99] text-white text-sm font-extrabold rounded-xl shadow-lg shadow-[#FF530D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span>Entrar no Sistema</span>
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Production Security Info */}
                  <div className="pt-2 flex items-center justify-center gap-2 text-center text-xs text-slate-400">
                    <ShieldCheck className="h-4 w-4 text-[#FF530D]" />
                    <span>Acesso restrito a usuários autorizados Match Point</span>
                  </div>
                </>
              )}

              {/* VIEW 2: FORGOT PASSWORD - STEP 1 (REQUEST CODE) */}
              {viewMode === 'forgot_password' && (
                <div className="space-y-5">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center pb-1">
                      <div className="h-12 w-12 rounded-2xl bg-[#FBBF3D]/10 border border-[#FBBF3D]/30 flex items-center justify-center text-[#FBBF3D]">
                        <RotateCcw className="h-6 w-6" />
                      </div>
                    </div>
                    <h2 className="text-xl font-black text-white">Recuperação de Senha</h2>
                    <p className="text-xs text-slate-400">
                      Informe o e-mail da sua conta Match Point para receber o código de validação.
                    </p>
                  </div>

                  {recoveryError && (
                    <div className="bg-[#D90000]/15 border border-[#D90000]/40 text-[#FF530D] p-3 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <form onSubmit={handleRequestCode} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Seu E-mail Cadastrado
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          id="input-recovery-email"
                          type="email"
                          required
                          value={recoveryEmail}
                          onChange={(e) => setRecoveryEmail(e.target.value)}
                          placeholder="admin@matchpoint.com.br"
                          className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#333333] rounded-xl text-sm font-semibold text-[#FDF2E7] focus:outline-none focus:ring-2 focus:ring-[#FF530D]"
                        />
                      </div>
                    </div>

                    <button
                      id="btn-send-recovery-code"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#FF530D] hover:bg-[#e04505] text-white text-sm font-bold rounded-xl shadow-lg shadow-[#FF530D]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>Enviar Código de Verificação</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('login')}
                      className="w-full py-2.5 bg-transparent text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Voltar ao Login
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 3: FORGOT PASSWORD - STEP 2 & 3 (ENTER CODE & NEW PASSWORD) */}
              {viewMode === 'enter_code' && (
                <div className="space-y-5">
                  <div className="text-center space-y-1">
                    <h2 className="text-xl font-black text-white">Criar Nova Senha</h2>
                    <p className="text-xs text-slate-400">
                      Enviamos um código de 6 dígitos para <strong>{recoveryEmail}</strong>
                    </p>
                  </div>

                  {/* Simulated Code Box for Instant Ease of Use */}
                  <div className="bg-[#111111] p-3.5 rounded-2xl border border-[#FBBF3D]/40 space-y-1">
                    <span className="text-[10px] font-bold text-[#FBBF3D] uppercase tracking-wider block">
                      Código Gerado pelo Servidor Match Point:
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-black text-white tracking-widest">
                        {generatedCode}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setInputCode(generatedCode);
                          setCodeCopied(true);
                          setTimeout(() => setCodeCopied(false), 2000);
                        }}
                        className="text-xs px-2.5 py-1 bg-[#222222] hover:bg-[#333333] text-[#FF530D] font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        {codeCopied ? 'Preenchido!' : 'Auto-Preencher'}
                      </button>
                    </div>
                  </div>

                  {recoveryError && (
                    <div className="bg-[#D90000]/15 border border-[#D90000]/40 text-[#FF530D] p-3 rounded-xl text-xs flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>{recoveryError}</span>
                    </div>
                  )}

                  <form onSubmit={handleResetPassword} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Código de 6 Dígitos
                      </label>
                      <input
                        id="input-code-validation"
                        type="text"
                        maxLength={6}
                        required
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value)}
                        placeholder="Ex: 123456"
                        className="w-full text-center tracking-widest font-mono text-lg py-2.5 bg-[#111111] border border-[#333333] rounded-xl text-[#FDF2E7] focus:outline-none focus:ring-2 focus:ring-[#FF530D]"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Nova Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          id="input-new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="Mínimo 6 caracteres"
                          className="w-full pl-10 pr-10 py-2.5 bg-[#111111] border border-[#333333] rounded-xl text-sm font-semibold text-[#FDF2E7] focus:outline-none focus:ring-2 focus:ring-[#FF530D]"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 cursor-pointer"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                        Confirmar Nova Senha
                      </label>
                      <div className="relative">
                        <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          id="input-confirm-new-password"
                          type={showNewPassword ? 'text' : 'password'}
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Repita a nova senha"
                          className="w-full pl-10 pr-4 py-2.5 bg-[#111111] border border-[#333333] rounded-xl text-sm font-semibold text-[#FDF2E7] focus:outline-none focus:ring-2 focus:ring-[#FF530D]"
                        />
                      </div>
                    </div>

                    <button
                      id="btn-confirm-password-reset"
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-[#FF530D] hover:bg-[#e04505] text-white text-sm font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isLoading ? (
                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <span>Redefinir Senha & Salvar</span>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('login')}
                      className="w-full py-2 text-slate-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                    >
                      ← Cancelar e Voltar
                    </button>
                  </form>
                </div>
              )}

              {/* VIEW 4: RESET SUCCESS */}
              {viewMode === 'reset_success' && (
                <div className="text-center space-y-5 py-4">
                  <div className="flex justify-center">
                    <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="h-8 w-8" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h2 className="text-xl font-black text-white">Senha Redefinida!</h2>
                    <p className="text-xs text-slate-300">
                      Sua nova credencial foi atualizada com sucesso. Agora você já pode acessar a plataforma Match Point Promove.
                    </p>
                  </div>

                  <button
                    id="btn-back-to-login-after-success"
                    onClick={() => setViewMode('login')}
                    className="w-full py-3 bg-[#FF530D] hover:bg-[#e04505] text-white text-sm font-bold rounded-xl shadow-lg transition-all cursor-pointer"
                  >
                    Acessar com a Nova Senha
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="text-center mt-6 text-xs text-slate-500 space-y-1">
            <p>Match Point Promove • Inteligência de Campo & Representação B2B</p>
            <p className="text-[11px]">📞 (27) 99273-5244 • matchpointpromove@gmail.com</p>
          </div>
        </div>
      </main>

      {/* Footer Bottom Bar */}
      <footer className="p-4 text-center text-[11px] text-slate-600 border-t border-[#1e1e1e] z-10">
        © 2026 Match Point Promove. Todos os direitos reservados.
      </footer>
    </div>
  );
};
