const socket = io();

let approved = [];
let idx = 0;
let interval = 7000; // 7s par slide
let timer = null;

const imgA = document.getElementById("slideA");
const imgB = document.getElementById("slideB");
const caption = document.getElementById("caption");
let showingA = true;

// Abonnement
socket.emit("subscribe:screen");

socket.on("approved:init", (list) => {
  approved = list || [];
  idx = 0;
  startLoop();
});

socket.on("approved:update", (list) => {
  approved = list || [];
  if (idx >= approved.length) idx = 0;
  // Redémarre le loop proprement
  startLoop(true);
});

function startLoop(reset = false) {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  if (!approved || approved.length === 0) {
    // Écran vide
    [imgA, imgB].forEach((img) => {
      img.classList.remove("visible");
      img.removeAttribute("src");
    });
    caption.classList.add("hidden");
    return;
  }
  // Démarrage immédiat
  showNext(true);
  timer = setInterval(showNext, interval);
}

function showNext(first = false) {
  if (!approved.length) return;

  const item = approved[idx];
  const nextIdx = (idx + 1) % approved.length;
  idx = nextIdx;

  const visible = showingA ? imgA : imgB;
  const hidden = showingA ? imgB : imgA;

  // Précharger dans l'image cachée
  hidden.src = item.url;
  hidden.onload = () => {
    // Cross-fade
    hidden.classList.add("visible");
    visible.classList.remove("visible");
    showingA = !showingA;

    // Caption
    if (item.caption) {
      caption.textContent = item.caption;
      caption.classList.remove("hidden");
    } else {
      caption.classList.add("hidden");
    }
  };

  // Force premier affichage sans flash
  if (first) {
    hidden.classList.add("visible");
    visible.classList.remove("visible");
    showingA = !showingA;
    if (item.caption) {
      caption.textContent = item.caption;
      caption.classList.remove("hidden");
    } else {
      caption.classList.add("hidden");
    }
  }
}
