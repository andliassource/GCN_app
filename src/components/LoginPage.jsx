import React, { useState } from 'react';
import { Shield, Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEMO_PERFIS = [
  { label: 'Administrador Geric (acesso total)', email: 'rcarlos@empresa.com.br', senha: 'geric2024', role: 'admin_geric', cor: 'indigo' },
  { label: 'Gestor Gecob (negócios)', email: 'mcosta@empresa.com.br', senha: 'gecob2024', role: 'gestor_area', cor: 'emerald' },
  { label: 'Gestora Getic (TI/PRD)', email: 'plima@empresa.com.br', senha: 'getic2024', role: 'gestor_area', cor: 'purple' },
  { label: 'Gestor Gesap (predial)', email: 'slima@empresa.com.br', senha: 'gesap2024', role: 'gestor_area', cor: 'amber' },
  { label: 'Visitante (somente leitura)', email: 'visitante@empresa.com.br', senha: 'visualizador', role: 'visualizador', cor: 'slate' },
];

const COR_MAP = {
  indigo: 'bg-indigo-600 hover:bg-indigo-700 border-indigo-600',
  emerald: 'bg-emerald-600 hover:bg-emerald-700 border-emerald-600',
  purple: 'bg-purple-600 hover:bg-purple-700 border-purple-600',
  amber: 'bg-amber-500 hover:bg-amber-600 border-amber-500',
  slate: 'bg-slate-600 hover:bg-slate-700 border-slate-600',
};

const BADGE_MAP = {
  admin_geric: 'bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300',
  gestor_area: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
  visualizador: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
};

export default function LoginPage({ configSistema }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErro('');
    setLoading(true);
    setTimeout(() => {
      const res = login(email, senha);
      if (!res.ok) { setErro(res.erro); setLoading(false); }
    }, 400);
  };

  const preencherPerfil = (p) => {
    setEmail(p.email);
    setSenha(p.senha);
    setErro('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 flex items-center justify-center p-4">
      {/* Fundo decorativo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-5xl flex flex-col lg:flex-row gap-8 items-start">

        {/* Coluna Esquerda — Branding */}
        <div className="flex-1 text-center lg:text-left pt-8 px-4">
          <div className="flex items-center justify-center lg:justify-start gap-3 mb-6">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/40">
              <Shield className="w-7 h-7 text-white" />
            </div>
            {configSistema?.logo_base64 && (
              <img src={configSistema.logo_base64} alt="Logo" className="h-12 object-contain rounded" />
            )}
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight">
            Sistema GCN/NRGCN
          </h1>
          <p className="text-indigo-300 text-sm font-semibold mt-1 uppercase tracking-wider">
            {configSistema?.nome_empresa || 'Gestão de Continuidade de Negócios'}
          </p>
          <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-sm lg:max-w-none">
            Plataforma de Gestão de Continuidade de Negócios e Resiliência Cibernética.
            Alinhado às normas <strong className="text-slate-300">ISO 22301:2019</strong> e{' '}
            <strong className="text-slate-300">ISO 27031:2011</strong>.
          </p>
          <div className="flex flex-wrap gap-2 mt-6 justify-center lg:justify-start">
            {['PCO', 'PRD', 'BIA/AIN', 'Riscos', 'Dashboard Geric', 'NRGCN'].map(t => (
              <span key={t} className="text-[10px] px-2 py-1 rounded-full bg-indigo-900/50 text-indigo-300 border border-indigo-800/60 font-semibold uppercase tracking-wide">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* Coluna Direita — Formulário + Perfis Demo */}
        <div className="w-full lg:w-[420px] space-y-4">

          {/* Card Login */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-white font-bold text-lg mb-1">Acesso ao Sistema</h2>
            <p className="text-slate-400 text-xs mb-6">Informe suas credenciais corporativas</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">E-mail Corporativo</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                  placeholder="usuario@empresa.com.br"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    value={senha}
                    onChange={e => setSenha(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowSenha(!showSenha)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {erro && (
                <div className="flex items-center gap-2 p-3 bg-rose-900/30 border border-rose-700/50 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                  <span className="text-xs text-rose-300">{erro}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-900/40"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? 'Autenticando...' : 'Entrar'}
              </button>
            </form>
          </div>

          {/* Perfis Demo */}
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 shadow-xl">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Perfis de Demonstração — Clique para selecionar
            </p>
            <div className="space-y-2">
              {DEMO_PERFIS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => preencherPerfil(p)}
                  className={`w-full text-left px-3 py-2 rounded-lg border transition-all hover:scale-[1.01] ${email === p.email ? 'bg-white/10 border-white/20' : 'border-transparent hover:bg-white/5'}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-200 font-semibold">{p.label}</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${BADGE_MAP[p.role] || BADGE_MAP.visualizador}`}>
                      {p.role === 'admin_geric' ? 'Admin' : p.role === 'gestor_area' ? 'Gestor' : 'Viewer'}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">{p.email}</p>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
