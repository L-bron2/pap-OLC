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

document.getElementById("formLogin").addEventListener("submit", async function (e) {
    e.preventDefault();

    const email = document.getElementById("email").value.trim(); 
    const senha = document.getElementById("palavra-passe").value.trim();

    //verifica se os campos tão preenchidos
    if (!email || !senha) {
        mostrarAlerta("Preencha todos os campos.", "#ff3b30");
        return;
    }

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        let result = {};
        try {
            result = await response.json(); 
        } catch (jsonError) {
            mostrarAlerta("Erro no servidor. Resposta inválida.");
            console.error("JSON inválido:", jsonError);
            return;
        }

        if (response.ok) {
            // salvar token no localStorage
            localStorage.setItem('token', result.token);
            window.location.href = "../inicio/inicio.html"; // redireciona para a página inicial
        } else {
            mostrarAlerta(result.erro || result.err || "Email ou palavra passe incorreto", "#ff3b30");
        }
    } catch (error) {
        mostrarAlerta("Erro de conexão com o servidor: " + error.message, "#ff3b30");
        console.error("Erro fetch login:", error);
    }
});
