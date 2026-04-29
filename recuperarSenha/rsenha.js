const params = new URLSearchParams(window.location.search);
const tokenRecuperacao = params.get("token");

const form = document.getElementById("recuperarSenhaBox");
const emailInput = document.getElementById("email");
const nomeInput = document.getElementById("nome");
const campoSenha = document.getElementById("campoSenha");
const novaSenhaInput = document.getElementById("novaSenha");
const btnVerificar = document.getElementById("BTN_verificar");
const btnAlterar = document.getElementById("Alterar");
const titulo = document.getElementById("tituloRecuperar");
const textoAjuda = document.getElementById("textoAjuda");

// Quando existe token, a pagina veio do email e deve mostrar apenas o campo 
// para escolher uma nova palavra-passe.
if (tokenRecuperacao) {
  titulo.textContent = "Nova palavra-passe";
  textoAjuda.textContent = "Escolha uma nova palavra-passe para voltar a entrar na sua conta.";
  emailInput.style.display = "none";
  nomeInput.style.display = "none";
  btnVerificar.style.display = "none";
  campoSenha.style.display = "flex";
  novaSenhaInput.required = true;
} else {
  titulo.textContent = "Recuperar palavra-passe";
  textoAjuda.textContent = "Indique o email da conta. Vamos enviar um link seguro para alterar a palavra-passe.";
  nomeInput.style.display = "none";
  novaSenhaInput.required = false;
  campoSenha.style.display = "none";
}

// Evita que o Enter recarregue a pagina
form.addEventListener("submit", (event) => event.preventDefault());

// Pservidor que envie o email de recuperacao.
btnVerificar.addEventListener("click", async () => {
  const email = emailInput.value.trim();

  if (!email) {
    mostrarAlerta("Insira o seu email.", "#ff3b30");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/recuperar/pedir-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarAlerta(result.msg || "Email enviado com sucesso!", "#34c759");
      emailInput.value = "";
    } else {
      mostrarAlerta(result.erro || "Nao foi possivel enviar o email.", "#ff3b30");
    }
  } catch (error) {
    mostrarAlerta("Erro de conexao: " + error.message, "#ff3b30");
  }
});

// Altera a palavra-passe usando o token temporario que veio no link do email.
btnAlterar.addEventListener("click", async () => {
  const novaSenha = novaSenhaInput.value.trim();

  if (!tokenRecuperacao) {
    mostrarAlerta("Abra o link enviado para o seu email.", "#ff9500");
    return;
  }

  if (novaSenha.length < 6) {
    mostrarAlerta("A palavra-passe deve ter pelo menos 6 caracteres.", "#ff3b30");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/recuperar/alterar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenRecuperacao, novaSenha }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarAlerta(result.msg || "Palavra-passe alterada com sucesso!", "#34c759");
      setTimeout(() => {
        window.location.href = "../Login/login.html";
      }, 1800);
    } else {
      mostrarAlerta(result.erro || "Erro ao alterar palavra-passe.", "#ff3b30");
    }
  } catch (error) {
    mostrarAlerta("Erro de conexao: " + error.message, "#ff3b30");
  }
});
