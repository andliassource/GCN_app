// ============================================================================
// SERVIÇO DE AUTENTICAÇÃO (MOCK / LOCALSTORAGE) - PORTÁVEL PARA FIREBASE & AZURE AD
// ============================================================================

const DEFAULT_USER = {
  uid: "usr-999",
  nome: "Comitê GERIC Admin",
  email: "geric.compliance@empresa.com",
  cargo: "Gerente Executivo de Riscos e GCN",
  departamento: "Geric / Compliance",
  role: "admin"
};

export const authService = {
  // Faz login do usuário com e-mail e senha. Permite qualquer credencial para facilidade de testes.
  async login(email, password) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Mock de verificação simples
        if (email && password) {
          const user = {
            ...DEFAULT_USER,
            email: email,
            nome: email.split("@")[0].toUpperCase()
          };
          localStorage.setItem("gcn_user", JSON.stringify(user));
          resolve(user);
        } else {
          reject(new Error("E-mail e senha são obrigatórios."));
        }
      }, 500);
    });
  },

  // Retorna o usuário logado atualmente ou null se não houver sessão ativa
  getCurrentUser() {
    const userStr = localStorage.getItem("gcn_user");
    if (!userStr) {
      // Como queremos que o usuário comece logado para facilitar o teste imediato da aplicação:
      localStorage.setItem("gcn_user", JSON.stringify(DEFAULT_USER));
      return DEFAULT_USER;
    }
    return JSON.parse(userStr);
  },

  // Realiza logout do usuário
  async logout() {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem("gcn_user");
        resolve(true);
      }, 300);
    });
  },

  // Simulador de perfil de usuários para governança e workflows de aprovação
  getMockUsers() {
    return [
      DEFAULT_USER,
      {
        uid: "usr-001",
        nome: "Patrícia Lima",
        email: "patricia.lima@empresa.com",
        cargo: "Coordenadora de SRE / Infraestrutura",
        departamento: "Tecnologia / Operações",
        role: "manager"
      },
      {
        uid: "usr-002",
        nome: "Roberto Carlos",
        email: "roberto.carlos@empresa.com",
        cargo: "Diretor de Riscos e Compliance",
        departamento: "Geric / Compliance",
        role: "approver"
      },
      {
        uid: "usr-003",
        nome: "Alice Souza",
        email: "alice.souza@empresa.com",
        cargo: "Gerente de Checkout e Canais Digitais",
        departamento: "Produtos / Checkout",
        role: "manager"
      }
    ];
  }
};
