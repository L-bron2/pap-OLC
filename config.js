// ================== CONFIGURAÇÃO GLOBAL ================== //
// Este arquivo centraliza todas as URLs e configurações da aplicação
// Altere aqui se o servidor mudar de endereço

const CONFIG = {
  API_BASE_URL: "http://localhost:3000",
  
  // Endpoints de autenticação
  AUTH: {
    LOGIN: "/login",
    CRIAR_CONTA: "/usuarios",
    GET_USUARIO: "/usuarios/id",
    GET_USUARIO_PUBLICO: (id) => `/usuarios/${id}`,
    RECUPERAR_VERIFICAR: "/recuperar/verificar",
    RECUPERAR_ALTERAR: "/recuperar/alterar",
  },
  
  // Endpoints de produtos
  PRODUTOS: {
    LISTAR: "/produtos",
    CRIAR: "/produtos",
  },
  
  // Endpoints de mensagens
  MENSAGENS: {
    LISTAR: "/mensagens",
    CONVERSA: (id) => `/mensagens/conversa/${id}`,
    ENVIAR: "/mensagens",
  },
  
  // Endpoints de favoritos
  FAVORITOS: {
    LISTAR: "/favoritos",
    ADICIONAR: "/favoritos",
    REMOVER: (id) => `/favoritos/${id}`,
  },
  
  // Endpoints de perfil
  PERFIL: {
    FOTO: "/usuarios/foto",
  }
};

// Funções auxiliares para URLs completas
function getApiUrl(endpoint) {
  return CONFIG.API_BASE_URL + endpoint;
}

// Exporte para uso em todos os arquivos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CONFIG, getApiUrl };
}
