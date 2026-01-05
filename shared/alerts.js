// Shared alert function used across pages
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

  // clear previous timeout if any
  if (window.__mostrarAlertaTimeout)
    clearTimeout(window.__mostrarAlertaTimeout);
  window.__mostrarAlertaTimeout = setTimeout(() => {
    alerta.classList.remove("mostrar");
    alerta.style.display = "none";
  }, 3000);
}

// Expose globally so pages can call mostrarAlerta
window.mostrarAlerta = mostrarAlerta;
