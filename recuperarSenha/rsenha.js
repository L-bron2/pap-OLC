// 🔔 FUNÇÃO PARA MOSTRAR ALERTAS
function mostrarAlerta(mensagem, cor = '#ff3b30', icone = '') {
    const alerta = document.getElementById('alerta');
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

document.getElementById("formRecuperar").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email");
    const nomeUtilizador = document.getElementById("nomeUtilizador");
    const palavraPasse = document.getElementById("palavra-passe");

    // VERIFICAR SE TODOS OS CAMPOS ESTÃO PREENCHIDOS
    const campos = this.querySelectorAll("input");
    let tudoPreenchido = true;

    campos.forEach(campo => {
        if (campo.value.trim() === "") {
            tudoPreenchido = false;
            campo.style.borderColor = "red";
        } else {
            campo.style.borderColor = "";
        }
    });

    if (!tudoPreenchido) {
        mostrarAlerta("Por favor, preencha todos os campos.", "#ff3b30");
        return;
    }

    // PEGAR DADOS DO FORMULÁRIO
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData.entries());

    try {
        const response = await fetch("http://localhost:3000/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });

        let result = {};
        try {
            result = await response.json();
        } catch (jsonError) {
            mostrarAlerta("Erro ao processar resposta do servidor.", "#ff3b30");
            return;
        }

        if (response.ok) {
            mostrarAlerta("Palavra-passe alterada com sucesso!", "#4BB543", "&#10004;");
            campos.forEach(campo => campo.value = "");
        } else {
            mostrarAlerta(result.message || result.err || "Erro ao alterar palavra-passe.", "#ff3b30");
        }

    } catch (error) {
        console.error("Erro de rede:", error);
        mostrarAlerta("Erro ao comunicar com o servidor.", "#ff3b30");
    }
});
