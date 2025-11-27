# 📋 Guia Completo de Teste - OLC PAP

## ✅ Verificação do Servidor

Antes de tudo, certifique-se de que o servidor Node está rodando:

```powershell
# Abra um terminal na raiz do projeto
cd "C:\Users\AEPAP\Documents\Projeto pap\OLC PAP"
node servidor.js
```

Deverá aparecer: `Servidor rodando em http://localhost:3000`

---

## 🧪 Teste 1: Criar Conta

**URL:** `file:///C:/Users/AEPAP/Documents/Projeto pap/OLC PAP/criar conta/criarConta.html`

### Passos:
1. Preencha o formulário com:
   - Nome: `Teste User`
   - Email: `teste@example.com`
   - Palavra-passe: `senha123`
2. Clique em "Criar conta"
3. ✅ Deverá ver alerta verde: "Conta criada com sucesso!"
4. ✅ Após 1.5s, será redirecionado para a página de login

### Erros esperados:
- Email duplicado → "Email already exists" ou similar
- Campos vazios → "Preencha todos os campos"

---

## 🧪 Teste 2: Login

**URL:** `file:///C:/Users/AEPAP/Documents/Projeto pap/OLC PAP/Login/login.html`

### Passos:
1. Preencha com:
   - Email: `teste@example.com`
   - Palavra-passe: `senha123`
2. Clique em "Login"
3. ✅ Deverá ver alerta verde
4. ✅ Será redirecionado para `/inicio/inicio.html` e o token será salvo em `localStorage`

### Verificar Token:
- Abra DevTools (F12)
- Vá para `Application → Local Storage → file://`
- Deve existir chave `token` com um JWT

---

## 🧪 Teste 3: Página Inicial (Produtos)

**URL:** `file:///C:/Users/AEPAP/Documents/Projeto pap/OLC PAP/inicio/inicio.html`

### Verificar:
1. ✅ Navbar aparece com 4 ícones (home, chat, favorite, account_circle)
2. ✅ Barra de pesquisa funciona
3. ✅ Produtos são carregados em grid
4. ✅ Cada produto tem ícone de favorito (coração vazio 🤍)
5. ✅ Botão "Novo produto" no canto inferior direito

### Interações:
- **Clicar no coração** → deve ficar preenchido (🩷) e aparecer alerta rosa
- **Clicar de novo** → volta ao vazio (🤍) e alerta laranja
- **Clicar no card do produto** → abre modal com detalhes
- **Modal → "Enviar mensagem ao vendedor"** → redireciona para chat com vendedor

---

## 🧪 Teste 4: Página de Favoritos

**URL:** `file:///C:/Users/AEPAP/Documents/Projeto pap/OLC PAP/favoritos/favoritos.html`

### Verificar:
1. ✅ Se não tiver nenhum favorito → mensagem "Nenhum favorito adicionado"
2. ✅ Se adicionar favoritos na página inicial → devem aparecer aqui
3. ✅ Botão "Remover dos Favoritos" funciona
4. ✅ Após remover o último favorito → volta a mensagem vazia

---

## 🧪 Teste 5: Chat / Mensagens

**URL:** `file:///C:/Users/AEPAP/Documents/Projeto pap/OLC PAP/conversas/chat.html`

### Verificar:
1. ✅ Se não estiver logado → redirecionado para login
2. ✅ Lista de conversas aparece à esquerda (vazia inicialmente)
3. ✅ Texto "Selecione uma conversa" aparece no início

### Enviar Mensagem:
1. Vá para `/inicio/inicio.html`
2. Clique num produto → abre modal
3. Clique "Enviar mensagem ao vendedor"
4. ✅ Será redirecionado para chat com a conversa já aberta
5. ✅ Nome do vendedor aparece no cabeçalho
6. Digite mensagem e pressione Enter ou clique "Enviar"
7. ✅ Mensagem aparece à direita (azul) e se salva no DB

---

## 🧪 Teste 6: Novo Produto

**URL:** `file:///C:/Users/AEPAP/Documents/Projeto pap/OLC PAP/produtos/novo_produto.html`

### Passos:
1. Preencha:
   - Título: `Produto Teste`
   - Descrição: `Descrição do produto`
   - Preço: `15.99`
   - Categoria: `Eletrônicos`
   - Imagem: (selecione uma imagem do seu PC)
2. Clique "Adicionar produto"
3. ✅ Alerta verde: "Produto criado com sucesso!"
4. ✅ Após 2s, redireciona para início
5. ✅ Novo produto aparece na lista

---

## 🧪 Teste 7: Perfil

**URL:** `file:///C:/Users/AEPAP/Documents/Projeto pap/OLC PAP/Perfil/perfil.html`

### Verificar:
1. ✅ Foto de perfil aparece (ou foto padrão)
2. ✅ Nome, email, e bio aparecem
3. ✅ Produtos do utilizador aparecem em lista
4. ✅ Botão "Sair" funciona e remove token
5. ✅ Botão "Atualizar Foto" funciona

---

## 🧪 Teste 8: Recuperação de Senha

**URL:** `file:///C:/Users/AEPAP/Documents/Projeto pap/OLC PAP/recuperarSenha/rsenha.html`

### Passos:
1. Preencha:
   - Email: `teste@example.com`
   - Nome: `Teste User`
2. Clique "Verificar"
3. ✅ Se correto → alerta verde e campo de nova senha aparece
4. Preencha a nova senha e clique "Alterar"
5. ✅ Alerta verde: "Palavra passe alterada com sucesso!"
6. ✅ Redireciona para login após 2s

---

## 🔧 Troubleshooting

### Problema: "Fetch failed" ou "Cannot find module"
- **Solução:** Verifique se o servidor está rodando (`node servidor.js`)

### Problema: "Token not provided"
- **Solução:** Faça login novamente e verifique se o token está em `localStorage`

### Problema: Favoritos não aparecem
- **Solução:** Verifique se a tabela `favoritos` existe no banco de dados com campos:
  - `id_produto` (FK para `produtos.id`)
  - `id_usuario` (FK para `usuarios.id`)

### Problema: Mensagens não enviam
- **Solução:** Verifique se:
  - O servidor recebe POST em `/mensagens`
  - O field é `mensagem` (não `texto`)
  - A tabela `mensagens` existe

### Problema: Imagens não carregam
- **Solução:** Verifique se as pastas `/uploads` e `/FTperfil` existem no servidor

---

## 📊 Checklist Final

- [ ] Servidor rodando em `http://localhost:3000`
- [ ] Criar conta funciona
- [ ] Login funciona e salva token
- [ ] Produtos carregam
- [ ] Favoritos adicionam/removem
- [ ] Página de favoritos mostra produtos
- [ ] Chat abre com query string `?vendedor=`
- [ ] Mensagens enviam e salvam
- [ ] Novo produto cria com imagem
- [ ] Perfil carrega dados corretos
- [ ] Recuperação de senha funciona
- [ ] Buscador de produtos funciona
- [ ] Logout funciona

---

## 🚀 Próximos Passos

Se tudo passar nos testes:
1. **Deploy:** Hospedar servidor Node (Heroku, Railway, etc.)
2. **HTTPS:** Configurar SSL/TLS
3. **CDN:** Servir estáticos via CDN
4. **Banco de dados:** Migrar para servidor MySQL remoto
5. **Melhorias:** Adicionar WebSocket para chat em tempo real

