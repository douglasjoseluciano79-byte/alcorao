const id      = new URLSearchParams(window.location.search).get("id");
const conteudo = document.getElementById("conteudo");
const titulo   = document.getElementById("titulo");
const loading  = document.getElementById("loading");
const audio    = document.getElementById("audioPlayer");
const audioInfo = document.getElementById("audioInfo");

// Aplica tema guardado
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
}

// Numero do versículo activo
let activeIndex = -1;
let totalVersos = 0;

async function loadSurata() {
  if (!id) {
    conteudo.innerHTML = "<p class='alert alert-warning'>Surata não especificada.</p>";
    loading.classList.add("d-none");
    return;
  }

  try {
    // Carrega árabe + tradução portuguesa em paralelo
    const [resAr, resPt] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${id}`),
      fetch(`https://api.alquran.cloud/v1/surah/${id}/pt.elhayek`)
    ]);

    const [dataAr, dataPt] = await Promise.all([resAr.json(), resPt.json()]);

    const surata  = dataAr.data;
    const surataPt = dataPt.data;

    if (!surata) {
      loading.classList.add("d-none");
      conteudo.innerHTML = "<div class='alert alert-danger'>Surata não encontrada.</div>";
      return;
    }

    // Cabeçalho
    const tipoMap = { Meccan: "Meca", Medinan: "Medina" };
    const tipo    = tipoMap[surata.revelationType] || surata.revelationType;

    document.title = `${surata.englishName} · Alcorão`;
    document.getElementById("navTitulo").textContent = surata.englishName;
    document.getElementById("arabicName").textContent = surata.name;
    titulo.textContent = `${surata.number}. ${surata.englishName} — ${surata.englishNameTranslation}`;
    document.getElementById("meta").textContent =
      `${surata.numberOfAyahs} versículos · Revelada em ${tipo}`;

    // Bismillah (excepto Al-Fatiha=1 e At-Tawba=9)
    if (surata.number !== 1 && surata.number !== 9) {
      document.getElementById("bismillah").classList.remove("d-none");
      // reintroduce correct arabic for bismillah
      document.querySelector(".bismillah-box").firstChild.textContent =
        "\u0628\u0650\u0633\u0652\u0645\u0650 \u0627\u0644\u0644\u0651\u064e\u0647\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0627\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650";
    }

    // Áudio — API EveryAyah
    const numPad = String(surata.number).padStart(3, "0");
    audio.src = `https://everyayah.com/data/Alafasy_128kbps/${numPad}001.mp3`;
    audioInfo.textContent = `Recitador: Mishary Rashid Alafasy`;

    // Monta versículos
    totalVersos = surata.ayahs.length;
    const versosPt = surataPt?.ayahs || [];

    let html = "";
    surata.ayahs.forEach((v, i) => {
      const ar = v.text || "";
      const pt = versosPt[i]?.text || "";
      html += `
        <div class="verse-box" id="verse-${i}" data-index="${i}">
          <div class="d-flex gap-3 align-items-start">
            <div class="verse-num mt-1">${v.numberInSurah}</div>
            <div class="flex-grow-1">
              <p class="arabic mb-2">${ar}</p>
              ${pt ? `<p class="portugues mb-0">${pt}</p>` : ""}
            </div>
          </div>
        </div>`;
    });

    conteudo.innerHTML = html;
    loading.classList.add("d-none");

    // Sincronização áudio ↔ versículo
    setupAudioSync(surata.ayahs.length);

  } catch (err) {
    console.error(err);
    loading.classList.add("d-none");
    conteudo.innerHTML = `
      <div class="alert alert-danger">
        Erro ao carregar a surata. Verifique a ligação e tente novamente.
      </div>`;
  }
}

function setupAudioSync(numVersos) {
  audio.addEventListener("timeupdate", () => {
    if (!audio.duration || numVersos === 0) return;

    // Calcula índice aproximado pelo progresso
    const progress  = audio.currentTime / audio.duration;
    const idx       = Math.min(Math.floor(progress * numVersos), numVersos - 1);

    if (idx === activeIndex) return;

    // Remove destaque anterior
    if (activeIndex >= 0) {
      const prev = document.getElementById(`verse-${activeIndex}`);
      if (prev) prev.classList.remove("active");
    }

    // Aplica destaque ao versículo actual
    activeIndex = idx;
    const el = document.getElementById(`verse-${idx}`);
    if (el) {
      el.classList.add("active");
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  });

  // Remove destaque ao parar
  audio.addEventListener("pause", () => {
    if (activeIndex >= 0) {
      const el = document.getElementById(`verse-${activeIndex}`);
      if (el) el.classList.remove("active");
      activeIndex = -1;
    }
  });

  // Clique num versículo salta para a posição proporcional no áudio
  document.getElementById("conteudo").addEventListener("click", e => {
    const box = e.target.closest(".verse-box");
    if (!box || !audio.duration) return;

    const idx = parseInt(box.dataset.index);
    const pos = (idx / totalVersos) * audio.duration;
    audio.currentTime = pos;
    audio.play();
  });
}

loadSurata();