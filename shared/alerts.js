// função para mostrar alertas na tela partilhada entre todas as paginas 
function mostrarAlerta(mensagem, cor = "#ff3b30", icone = "") {
  let alerta = document.getElementById("alerta");
  if (!alerta) {
    alerta = document.createElement("div");
    alerta.id = "alerta";
    alerta.className = "alerta";
    alerta.style.display = "none";
    document.body.appendChild(alerta);
  }

  alerta.innerHTML = `
    <span style="font-size:1.3em;margin-right:8px;">${icone}</span>
    ${mensagem}
  `;
  alerta.style.background = cor;
  alerta.classList.add("mostrar");
  alerta.style.display = "block";

  // esconde o alerta após 3 segundos
  if (window.__mostrarAlertaTimeout)
    clearTimeout(window.__mostrarAlertaTimeout);
  window.__mostrarAlertaTimeout = setTimeout(() => {
    alerta.classList.remove("mostrar");
    alerta.style.display = "none";
  }, 3000);
}

// assim todas as paginas podem chamar a função para mostrar alertas
window.mostrarAlerta = mostrarAlerta;

// Modal de confirmacao reutilizavel para acoes sensiveis, como apagar conta,
// produto ou conversa. Devolve uma Promise<boolean>, por isso deve ser usado
// com await: const ok = await confirmarAcao({ titulo, mensagem });
function confirmarAcao({
  titulo = "Confirmar acao",
  mensagem = "Tem a certeza que pretende continuar?",
  confirmarTexto = "Confirmar",
  cancelarTexto = "Cancelar",
  tipo = "perigo",
} = {}) {
  return new Promise((resolve) => {
    const overlay = document.createElement("div");
    overlay.className = "confirmar-overlay";
    overlay.innerHTML = `
      <div class="confirmar-caixa" role="dialog" aria-modal="true">
        <h2>${titulo}</h2>
        <p>${mensagem}</p>
        <div class="confirmar-acoes">
          <button type="button" class="confirmar-cancelar">${cancelarTexto}</button>
          <button type="button" class="confirmar-confirmar ${tipo}">${confirmarTexto}</button>
        </div>
      </div>
    `;

    function fechar(resultado) {
      overlay.remove();
      document.removeEventListener("keydown", aoPremirTecla);
      resolve(resultado);
    }

    function aoPremirTecla(evento) {
      if (evento.key === "Escape") fechar(false);
    }

    overlay.addEventListener("click", (evento) => {
      if (evento.target === overlay) fechar(false);
    });

    overlay
      .querySelector(".confirmar-cancelar")
      .addEventListener("click", () => fechar(false));

    overlay
      .querySelector(".confirmar-confirmar")
      .addEventListener("click", () => fechar(true));

    document.addEventListener("keydown", aoPremirTecla);
    document.body.appendChild(overlay);
    overlay.querySelector(".confirmar-cancelar").focus();
  });
}

window.confirmarAcao = confirmarAcao;
