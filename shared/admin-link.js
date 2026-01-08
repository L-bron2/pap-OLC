// Torna visíveis os elementos com a classe `admin-link` somente para administradores
(function () {
  async function checkAndReveal() {
    const links = document.querySelectorAll(".admin-link");
    const area = document.getElementById("area_admin");

    // valor padrão
    window.isAdmin = false;

    const token = localStorage.getItem("token");
    if (!token) {
      if (area) area.style.display = "none";
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/usuarios/id", {
        headers: {
          Authorization: "Bearer " + token,
        },
      });

      if (!res.ok) {
        if (area) area.style.display = "none";
        return;
      }

      const me = await res.json();

      if (me && me.role === "admin") {
        window.isAdmin = true;

        links.forEach((el) => el.classList.remove("hidden"));

        if (area) {
          const a = area.querySelector("a");
          if (a) a.classList.remove("hidden");
          area.style.display = "";
        }
      } else {
        // não é admin
        window.isAdmin = false;
        links.forEach((el) => el.classList.add("hidden"));
        if (area) area.style.display = "none";
      }
    } catch (e) {
      console.warn("admin-link check failed", e);
      if (area) area.style.display = "none";
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", checkAndReveal);
  } else {
    checkAndReveal();
  }
})();
