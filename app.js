let favoritos = JSON.parse(localStorage.getItem("fav")) || [];
let todasSuratas = [];
let modoFavoritos = false;

// Aplica tema guardado
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

document.addEventListener("DOMContentLoaded", async () => {
  const lista    = document.getElementById("listaSuratas");
  const input    = document.getElementById("searchInput");
  const favAlert = document.getElementById("favAlert");

  lista.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-success" role="status"></div>
      <p class="mt-2 text-muted">A carregar suratas...</p>
    </div>`;

  try {
    // API com tradução portuguesa real (Al-Hayek)
    const res  = await fetch("https://api.alquran.cloud/v1/surah");
    const data = await res.json();
    todasSuratas = data.data;
  } catch (e) {
    lista.innerHTML = `<div class="col-12"><div class="alert alert-danger">Erro ao carregar. Verifique a ligação.</div></div>`;
    return;
  }

  function render(list) {
    if (!list.length) {
      lista.innerHTML = `<div class="col-12 text-center text-muted py-4">Nenhuma surata encontrada.</div>`;
      return;
    }

    lista.innerHTML = list.map(s => {
      const isFav   = favoritos.includes(s.number);
      const tipoMap = { Meccan: "Meca", Medinan: "Medina" };
      const tipo    = tipoMap[s.revelationType] || s.revelationType;

      return `
        <div class="col-lg-3 col-md-6 col-sm-6">
          <div class="card card-surah shadow-sm h-100">
            <div class="card-body d-flex flex-column gap-2">

              <div class="d-flex align-items-center gap-2">
                <div class="card-num">${s.number}</div>
                <div class="flex-grow-1">
                  <div class="fw-semibold" style="font-size:14px">${s.englishName}</div>
                  <div class="text-muted" style="font-size:12px">${s.englishNameTranslation}</div>
                </div>
              </div>

              <div class="card-arabic text-end">${s.name}</div>

              <div class="d-flex gap-2 align-items-center">
                <span class="badge-place">${tipo}</span>
                <span class="text-muted" style="font-size:12px">${s.numberOfAyahs} versículos</span>
              </div>

              <div class="mt-auto d-flex flex-column gap-2">
                <button class="btn btn-success btn-sm w-100"
                  onclick="openSurata(${s.number})">
                  Ler
                </button>
                <button class="btn ${isFav ? 'btn-danger' : 'btn-outline-secondary'} btn-sm w-100"
                  onclick="toggleFav(${s.number})">
                  ${isFav ? "❤️ Remover" : "🤍 Favorito"}
                </button>
              </div>

            </div>
          </div>
        </div>`;
    }).join("");
  }

  render(todasSuratas);

  // Pesquisa
  input.addEventListener("input", e => {
    modoFavoritos = false;
    favAlert.classList.add("d-none");
    const q = e.target.value.toLowerCase().trim();
    const filtered = q
      ? todasSuratas.filter(s =>
          s.englishName.toLowerCase().includes(q) ||
          s.englishNameTranslation.toLowerCase().includes(q) ||
          String(s.number).includes(q)
        )
      : todasSuratas;
    render(filtered);
  });

  // Expõe globalmente
  window.openSurata = id => {
    window.location.href = `surata.html?id=${id}`;
  };

  window.toggleFav = id => {
    favoritos = favoritos.includes(id)
      ? favoritos.filter(f => f !== id)
      : [...favoritos, id];
    localStorage.setItem("fav", JSON.stringify(favoritos));
    render(modoFavoritos
      ? todasSuratas.filter(s => favoritos.includes(s.number))
      : todasSuratas);
  };

  window.mostrarFavoritos = () => {
    modoFavoritos = true;
    input.value = "";
    favAlert.classList.remove("d-none");
    render(todasSuratas.filter(s => favoritos.includes(s.number)));
    window.scrollTo({ top: 400, behavior: "smooth" });
  };

  window.mostrarTodos = () => {
    modoFavoritos = false;
    favAlert.classList.add("d-none");
    render(todasSuratas);
  };

  window.toggleTheme = () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    document.getElementById("themeBtn").textContent = isDark ? "☀️" : "🌙";
  };

  // Ícone correcto no carregamento
  if (localStorage.getItem("theme") === "dark") {
    document.getElementById("themeBtn").textContent = "☀️";
  }

  // PWA service worker
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  }
});