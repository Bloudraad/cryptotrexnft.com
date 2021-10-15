const photos = [
  require("../img/dino/left.png"),
  require("../img/dino/right.png"),
];
const { initGame } = require("../game");
const idlePhoto = require("../img/dino/both.png");

const dino = document.getElementById("dino");
let isRunning = false;
let isPregame = false;
let counter = 0;
let timer = null;
const wrapper = document.querySelector(".outer-wrapper");

function easeInBubble() {
  const scrollRatio = wrapper.scrollTop / window.innerWidth;
  document.querySelectorAll(".slide .nes-balloon").forEach((v, i) => {
    if (i < scrollRatio - 0.5) {
      v.style.opacity = 1;
      v.style.transform = "rotate(0)";
    } else {
      v.style.opacity = 0;
      v.style.transform = "rotate(45deg)";
    }
  });
}

wrapper.addEventListener(
  "scroll",
  function () {
    easeInBubble();

    if (timer !== null) {
      clearTimeout(timer);
    }

    isRunning = true;
    const currentScroll = wrapper.scrollTop % window.innerWidth;
    const midScreen = window.innerWidth / 2;

    if (currentScroll < midScreen + 150 && currentScroll > midScreen - 150) {
      isRunning = false;
      const offset = 200 - Math.pow(currentScroll - midScreen, 2) / 112.5;
      dino.style.bottom = `calc(15vh + ${offset}px`;
    } else {
      dino.style.bottom = "15vh";
    }

    timer = setTimeout(function () {
      isRunning = false;
    }, 50);
  },
  false
);

let lastX = 0;
let lastY = 0;
document.addEventListener("touchmove", function (e) {
  const yDiff = e.touches[0].clientY - lastY;
  const xDiff = e.touches[0].clientX - lastX;
  lastY = e.touches[0].clientY;
  lastX = e.touches[0].clientX;

  const diff = Math.abs(yDiff) > Math.abs(xDiff) ? yDiff : xDiff;

  const currentSlide = Math.floor(wrapper.scrollTop / window.innerWidth);
  wrapper.scrollTo({
    top: (currentSlide - diff / Math.abs(diff)) * window.innerWidth,
    behavior: "smooth",
  });
});

setInterval(() => {
  if (!isRunning && !isPregame) {
    if (dino.src !== idlePhoto) dino.src = idlePhoto;
    return;
  }
  dino.src = photos[counter];
  counter = (counter + 1) % photos.length;
}, 100);

const playBtn = document.getElementById("btn-play");
playBtn.addEventListener("click", () => {
  playBtn.remove();
  const parent = document.querySelector(".slide");
  const slides = document.querySelectorAll(".slide");
  slides.forEach((val, key) => key > 0 && val.remove());
  document.querySelector(".wrapper").style.width = "100vw";
  document.querySelector(".wrapper").style.marginBottom = "-100vw";
  isPregame = true;
  dino.style.left = 0;
  setTimeout(() => {
    document
      .querySelectorAll(".slide:first-child div:not(.ground)")
      .forEach((v) => v.remove());
    document.querySelector(".slide:first-child nav").innerHTML =
      '<a class="nes-btn is-warning" href="/">&lt; Back to site</a>';
    isPregame = false;
    document.querySelector(".slide").innerHTML += `
      <button class="nes-btn is-success" id="jump">Jump</button>
      <button class="nes-btn is-error" id="duck">Duck</button>
    `;
    initGame(parent);
  }, 2000);
});
