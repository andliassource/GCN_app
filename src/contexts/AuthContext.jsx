import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children, db }) {
  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = sessionStorage.getItem('gcn_usuario');
    if (stored) {
      try { setUsuario(JSON.parse(stored)); } catch { }
    }
    setLoading(false);
  }, []);

  const login = (email, senha) => {
    const u = db.usuarios.autenticar(email, senha);
    if (u) {
      setUsuario(u);
      sessionStorage.setItem('gcn_usuario', JSON.stringify(u));
      return { ok: true, usuario: u };
    }
    return { ok: false, erro: 'Email ou senha inválidos.' };
  };

  const logout = () => {
    setUsuario(null);
    sessionStorage.removeItem('gcn_usuario');
  };

  // ─── HELPERS DE ROLE ────────────────────────────────────────────────────────
  /** Admin Geric — visão total de governança corporativa */
  const isGeric = () => usuario?.role === 'admin_geric';

  /** Geati — visão total de governança de TIC */
  const isGeati = () => usuario?.role === 'tic_governanca';

  /** Geemp — governança corporativa de crises */
  const isGovCorp = () => usuario?.role === 'gov_corporativa';

  /** Gemac — comunicação de crises */
  const isComunicacao = () => usuario?.role === 'comunicacao_crise';

  /** Gesap — apoio predial */
  const isApoioPredial = () => usuario?.role === 'apoio_predial';

  /** Gepes — apoio pessoas/RH */
  const isApoioPessoas = () => usuario?.role === 'apoio_pessoas';

  /** Gefic — apoio financeiro */
  const isApoioFinanceiro = () => usuario?.role === 'apoio_financeiro';

  /** Gesuc — apoio suprimentos */
  const isApoioSuprimentos = () => usuario?.role === 'apoio_suprimentos';

  /** Admin Geric/Geemp OU Geati (Governança de TIC) — visão total consolidada */
  const isAdmin = () => isGeric() || isGeati() || isGovCorp();

  /** Gestor de área, executores de TIC ou administradores */
  const isGestor = () => 
    usuario?.role === 'gestor_area' || 
    usuario?.role === 'tic_executor' || 
    isApoioPredial() || 
    isApoioPessoas() || 
    isApoioFinanceiro() || 
    isApoioSuprimentos() || 
    isComunicacao() || 
    isAdmin();

  /** Executores técnicos de DRP de TIC */
  const isTicExecutor = () => usuario?.role === 'tic_executor';

  /** Visitante somente leitura */
  const isVisualizador = () => usuario?.role === 'visualizador';

  /** Pode editar dados de uma gerência específica */
  const canEdit = (id_gerencia_do_item) => {
    if (!usuario || isVisualizador()) return false;
    if (isAdmin()) return true;
    return usuario.id_gerencia === id_gerencia_do_item;
  };

  /** Pode criar novos registros */
  const canCreate = () => !!(usuario && !isVisualizador());

  /**
   * Filtra lista pela gerência do usuário.
   * Admin/Geati/Geemp vê tudo; Gestores de TIC veem seus processos + os processos que exigem DRP técnico; Gestores de Negócio veem apenas os seus.
   */
  const filterByGerencia = (items, keys = 'id_gerencia') => {
    if (!usuario || isAdmin()) return items;
    const keyList = Array.isArray(keys) ? keys : [keys];
    return items.filter(item =>
      keyList.some(key => {
        const val = key.split('.').reduce((obj, k) => obj?.[k], item);
        if (val === usuario.id_gerencia || val == null) return true;
        
        // Se for executor de TIC, ele enxerga processos que exigem DRP (pois ele executa a infra de DR)
        if (isTicExecutor()) {
          if (item.requer_drp) return true;
          // Se for uma AIN de um processo que requer DRP
          if (item.processo?.requer_drp) return true;
        }
        return false;
      })
    );
  };

  /** id_gerencia do usuário — null para admin (sem restrição) */
  const gerenciaFiltro = isAdmin() ? null : usuario?.id_gerencia;

  /** Nome curto da gerência para badge de contexto no header */
  const nomeGerenciaContexto = () => {
    if (isGeric()) return 'Geric / Riscos';
    if (isGeati()) return 'Geati / Gov. TIC';
    if (isGovCorp()) return 'Geemp / Gov. Corp';
    if (isComunicacao()) return 'Gemac / Comms';
    if (isApoioPredial()) return 'Gesap / Predial';
    if (isApoioPessoas()) return 'Gepes / RH';
    if (isApoioFinanceiro()) return 'Gefic / Fin';
    if (isApoioSuprimentos()) return 'Gesuc / Supr';
    if (isVisualizador()) return 'Visitante';
    try {
      const gerencias = db.gerencias?.list ? db.gerencias.list() : [];
      const ger = gerencias.find(g => g.id_gerencia === usuario?.id_gerencia);
      return ger?.sigla || usuario?.id_gerencia || '';
    } catch { return usuario?.id_gerencia || ''; }
  };

  return (
    <AuthContext.Provider value={{
      usuario, login, logout, loading,
      isAdmin, isGestor, isVisualizador,
      isGeric, isGeati, isTicExecutor,
      isGovCorp, isComunicacao,
      isApoioPredial, isApoioPessoas, isApoioFinanceiro, isApoioSuprimentos,
      canEdit, canCreate,
      filterByGerencia, gerenciaFiltro,
      nomeGerenciaContexto,
      filterByRole: filterByGerencia, // retrocompatibilidade
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};

