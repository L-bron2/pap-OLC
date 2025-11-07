// Função para mostrar alertas
function mostrarAlerta(mensagem, cor = '#ff3b30', icone = '') {
    const alerta = document.getElementById('alerta');
    if (!alerta) return; 
    alerta.innerHTML = `
        <span style="font-size:1.3em;margin-right:8px;">${icone}</span>
        ${mensagem}
        <button class="fechar" onclick="this.parentElement.style.display='none'">&times;</button>
    `;
    alerta.style.background = cor;
    alerta.classList.add('mostrar');
    alerta.style.display = 'block';

    setTimeout(() => {
        alerta.classList.remove('mostrar');
        alerta.style.display = 'none';
    }, 3000);
}

// Carregar conversas
window.onload = async function () {
  try {
    const response = await fetch("http://localhost:3000/mensagens", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    const conversas = await response.json();
    const div = document.getElementById("conversas");
    div.innerHTML = "";
    conversas.forEach((conversa) => {
      const item = document.createElement("div");
      item.className = "conversa";
      item.innerHTML = `
                <h2>Com: ${conversa.outro_usuario_nome} (ID: ${conversa.outro_usuario_id})</h2>
                <p>Última mensagem: ${conversa.ultima_mensagem}</p>
                <p>Data: ${new Date(conversa.data_ultima_mensagem).toLocaleString()}</p>
            `;
      div.appendChild(item);
    });
  } catch (error) {
    mostrarAlerta("Erro ao carregar conversas: " + error.message);
  }
};
