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
  /** Admin Geric/Geemp — visão total, sem restrição de gerência */
  const isAdmin = () => usuario?.role === 'admin_geric';

  /** Gestor de área OU admin */
  const isGestor = () => usuario?.role === 'gestor_area' || isAdmin();

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
   * Admin vê tudo; Gestor vê apenas os seus.
   * Suporta múltiplas chaves e paths aninhados (ex: 'processo.id_gerencia').
   */
  const filterByGerencia = (items, keys = 'id_gerencia') => {
    if (!usuario || isAdmin()) return items;
    const keyList = Array.isArray(keys) ? keys : [keys];
    return items.filter(item =>
      keyList.some(key => {
        const val = key.split('.').reduce((obj, k) => obj?.[k], item);
        return val === usuario.id_gerencia || val == null;
      })
    );
  };

  /** id_gerencia do usuário — null para admin (sem restrição) */
  const gerenciaFiltro = isAdmin() ? null : usuario?.id_gerencia;

  /** Nome curto da gerência para badge de contexto no header */
  const nomeGerenciaContexto = () => {
    if (isAdmin()) return 'Visão Consolidada';
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

