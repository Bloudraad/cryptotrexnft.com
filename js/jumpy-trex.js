const smoothscroll = require('smoothscroll-polyfill');
smoothscroll.polyfill();

const { DINO_COLOR } = require('./preload');

const photos = [DINO_COLOR.left, DINO_COLOR.right];
const { initGame } = require('../game');
const idlePhoto = DINO_COLOR.idle;

const dino = document.getElementById('dino');
let isRunning = false;
let isPregame = false;
let counter = 0;
let timer = null;
const wrapper = document.querySelector('.outer-wrapper');

function easeInBubble() {
  const scrollRatio = wrapper.scrollTop / window.innerWidth;
  document.querySelectorAll('.slide .nes-balloon').forEach((v, i) => {
    if (i < scrollRatio - 0.5) {
      v.style.opacity = 1;
      v.style.transform = 'rotate(0)';
    } else {
      v.style.opacity = 0;
      v.style.transform = 'rotate(45deg)';
    }
  });
}

wrapper.addEventListener(
  'scroll',
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
      dino.style.bottom = `${0.15 * window.innerHeight + offset}px`;
    } else {
      dino.style.bottom = `${0.15 * window.innerHeight}px`;
    }

    timer = setTimeout(function () {
      isRunning = false;
    }, 50);
  },
  false,
);

let lastX = 0;
let lastY = 0;
document.addEventListener('touchmove', function (e) {
  const yDiff = e.touches[0].clientY - lastY;
  const xDiff = e.touches[0].clientX - lastX;
  lastY = e.touches[0].clientY;
  lastX = e.touches[0].clientX;

  const diff = Math.abs(yDiff) > Math.abs(xDiff) ? yDiff : xDiff;

  const currentSlide = Math.floor(wrapper.scrollTop / window.innerWidth);
  wrapper.scrollTo({
    top: (currentSlide - diff / Math.abs(diff)) * window.innerWidth,
    behavior: 'smooth',
  });
});
document.addEventListener('keydown', function (e) {
  const currentSlide = Math.floor(wrapper.scrollTop / window.innerWidth);
  if (e.key === 'ArrowRight' && currentSlide < 5) {
    wrapper.scrollTo({
      top: (currentSlide + 1) * window.innerWidth,
      behavior: 'smooth',
    });
  } else if (e.key === 'ArrowLeft' && currentSlide > 0) {
    wrapper.scrollTo({
      top: (currentSlide - 1) * window.innerWidth,
      behavior: 'smooth',
    });
  }
});

setInterval(() => {
  if (!isRunning && !isPregame) {
    if (dino.src !== idlePhoto) dino.src = idlePhoto;
    return;
  }
  dino.src = photos[counter];
  counter = (counter + 1) % photos.length;
}, 100);

const playBtn = document.getElementById('btn-play');
playBtn.addEventListener('click', () => {
  playBtn.remove();
  const parent = document.querySelector('.slide');
  document.querySelector('.wrapper').style.width = '100vw';
  document.querySelector('.wrapper').style.marginBottom = '-100vw';
  isPregame = true;
  dino.style.left = 0;
  setTimeout(() => {
    document
      .querySelectorAll('.slide:first-child div:not(.ground):not(.underground)')
      .forEach((v) => v.remove());
    isPregame = false;
    document.querySelector('.slide').innerHTML += `
      <button class="nes-btn is-success" id="jump">Jump</button>
      <button class="nes-btn is-error" id="duck">Duck</button>
    `;
    initGame(parent);
  }, 2000);
});
