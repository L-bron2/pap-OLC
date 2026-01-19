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
