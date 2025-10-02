document.getElementById("DadosConta").addEventListener("submit", async function (e) {
    e.preventDefault();
    const nome = document.getElementById("nome").value;
    const email = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    try {
        const response = await fetch("http://localhost:3000/usuarios", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ nome, email, senha })
        });

        let result = {};
        try {
            result = await response.json();
        } catch (jsonError) {
            
            alert("Erro do servidor.");
            return;
        }

        if (response.ok) {
            alert(result.msg || "Conta criada com sucesso!");
            window.location.href = "../login/login.html";
        } else {
            alert(result.err || result.erro || "Erro ao criar a conta");
        }
    } catch (error) {
        alert("Erro de conexão com o servidor: " + error.message);
    }
});