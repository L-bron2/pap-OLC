// shared mostrarAlerta provided by ../shared/alerts.js

//verificar utilizador
document
  .getElementById("BTN_verificar")
  .addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const nome = document.getElementById("nome").value.trim();

    if (!email || !nome) {
      mostrarAlerta("Por favor, preencha todos os campos.", "#ff3b30");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3000/recuperar/verificar",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, nome }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        mostrarAlerta(
          "Utilizador encontrado! Insira a nova palavra passe.",
          "#4BB543"
        );
        document.getElementById("campoSenha").style.display = "block";
        document.getElementById("BTN_verificar").style.display = "none";
      } else {
        mostrarAlerta(result.erro || "Utilizador não encontrado.", "#ff3b30");
      }
    } catch (error) {
      mostrarAlerta("Erro de conexão: " + error.message, "#ff3b30");
    }
  });

// alterar palavra passe
document.getElementById("Alterar").addEventListener("click", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value.trim();
  const nome = document.getElementById("nome").value.trim();
  const novaSenha = document.getElementById("novaSenha").value.trim();

  if (!novaSenha) {
    mostrarAlerta("Por favor, insira a nova palavra passe.", "#ff3b30");
    return;
  }

  try {
    const response = await fetch("http://localhost:3000/recuperar/alterar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, nome, novaSenha }),
    });

    const result = await response.json();

    if (response.ok) {
      mostrarAlerta(
        "Palavra passe alterada com sucesso!",
        "#4BB543",
        "&#10004;"
      );
      setTimeout(() => {
        window.location.href = "../Login/login.html";
      }, 2000);
    } else {
      mostrarAlerta(result.erro || "Erro ao alterar palavra passe.", "#ff3b30");
    }
  } catch (error) {
    mostrarAlerta("Erro de conexão: " + error.message, "#ff3b30");
  }
});
