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

  const isAdmin = () => usuario?.role === 'admin_geric';
  const isGestor = () => usuario?.role === 'gestor_area' || isAdmin();
  
  // Filtra por gerência se não for admin
  const filterByRole = (items, keyGerencia = 'id_gerencia') => {
    if (!usuario || isAdmin()) return items;
    return items.filter(item => item[keyGerencia] === usuario.id_gerencia || item[keyGerencia] == null);
  };

  return (
    <AuthContext.Provider value={{ usuario, login, logout, isAdmin, isGestor, filterByRole, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
};
