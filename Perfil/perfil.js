const token = localStorage.getItem("token");

// função para mostrar alerta
function mostrarAlerta(mensagem, cor = "#ff3b30", icone = "") {
  const alerta = document.getElementById("alerta");
  alerta.innerHTML = `
    <span style="font-size:1.3em;margin-right:8px;">${icone}</span>
    ${mensagem}
    <button class="fechar" onclick="this.parentElement.style.display='none'">&times;</button>
  `;
  alerta.style.background = cor;
  alerta.classList.add("mostrar");
  alerta.style.display = "block";

  setTimeout(() => {
    alerta.classList.remove("mostrar");
    alerta.style.display = "none";
  }, 3000);
}

if (!token) {
  mostrarAlerta("Sem sessão iniciada, faça login.", "#ff3b30");
  window.location.href = "../Login/login.html";
}

window.onload = async function () {
  try {
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const response = await fetch("http://localhost:3000/usuarios", { headers });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.erro || 'Erro carregar dados do utilizador');
    }
    const usuarios = await response.json();
    const div = document.getElementById("usuarios");
    div.innerHTML = "";

    usuarios.forEach((usuario) => {
      const item = document.createElement("div");
      item.className = "usuario";
      const foto = usuario.foto_url;
      const nome = usuario.nome;
      const email = usuario.email;
      const dataRaw =
        usuario.data_publicacao ;
      const dataFmt = dataRaw ? new Date(dataRaw).toLocaleDateString() : "-";
      item.innerHTML = `
                <img src="${foto}" alt="foto do utilizador" style="max-width:200px;max-height:200px;">
                <h2>${nome}</h2>
                <p>${email}</p>
                <p>Data: ${dataFmt}</p>
            `;
      div.appendChild(item);
    });
  } catch (error) {
    mostrarAlerta("Erro ao carregar dados.", "#ff3b30");
  }
};
