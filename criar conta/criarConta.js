document
  .getElementById("DadosConta")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    //verifica se todos os campos foram peenchidos
    if (!nome || !email || !senha) {
      mostrarAlerta("Preencha todos os campos.", "#ff3b30");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, email, senha }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch (jsonError) {
        mostrarAlerta("Erro do servidor. Resposta inválida.", "#ff3b30");
        console.error("JSON inválido:", jsonError);
        return;
      }

      if (response.ok) {
        mostrarAlerta(result.msg || "Conta criada com sucesso!", "#5ebb42");
        setTimeout(() => {
          window.location.href = "../login/login.html"; //abre a pagina de login
        }, 1500);
      } else {
        mostrarAlerta(
          result.erro || result.err || "Erro ao criar a conta",
          "#ff3b30"
        );
      }
    } catch (error) {
      mostrarAlerta(
        "Erro de conexão com o servidor: " + error.message,
        "#ff3b30"
      );
      console.error("Erro fetch criar conta:", error);
    }
  });
