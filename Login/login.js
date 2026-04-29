// Trata o envio do formulario de login e guarda o token JWT devolvido pela API.
document
  .getElementById("formLogin")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("palavra-passe").value.trim();

    // verifica se os campos tão preenchidos
    if (!email || !senha) {
      mostrarAlerta("Preencha todos os campos.", "#ff3b30");
      return;
    }

    try {
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });

      let result = {};
      try {
        result = await response.json();
      } catch (jsonError) {
        mostrarAlerta("Erro no servidor. Resposta invalida.", "#ff3b30");
        console.error("JSON invalido:", jsonError);
        return;
      }

      if (response.ok) {
        localStorage.setItem("token", result.token);
        window.location.href = "../inicio/inicio.html";
      } else {
        mostrarAlerta(
          result.erro || result.err || "Email ou palavra-passe incorretos",
          "#ff3b30",
        );
      }
    } catch (error) {
      mostrarAlerta(
        "Erro de conexao com o servidor: " + error.message,
        "#ff3b30",
      );
      console.error("Erro fetch login:", error);
    }
  });
