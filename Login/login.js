document.getElementById("formLogin").addEventListener("submit", async function (e) {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const senha = document.getElementById("palavra-passe").value;

    try {
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        let result = {};
        try {
            result = await response.json();
        } catch (jsonError) {
            alert("Erro do servidor.");
            return;
        }

        if (response.ok) {
            localStorage.setItem('token', result.token);
            window.location.href = "../inicio/inicio.html";
        } else {
            alert(result.err || result.erro || "Email ou palavra passe errada");
        }
    } catch (error) {
        alert("Erro de conexão com o servidor: " + error.message);
    }
});