function shuffle(array) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle...
  while (currentIndex != 0) {
    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

export const THEMES = shuffle([
  {
    id: "beach",
    background: require("../img/themes/beach/background.png"),
    ground: require("../img/themes/beach/ground.png"),
    underground: require("../img/themes/beach/underground.png"),
    obstacle1: require("../img/themes/beach/obstacle-1.png"),
    obstacle2: require("../img/themes/beach/obstacle-2.png"),
    obstacle3: require("../img/themes/beach/obstacle-3.png"),
    obstacle4: require("../img/themes/beach/obstacle-4.png"),
  },
  {
    id: "city",
    background: require("../img/themes/city/background.png"),
    ground: require("../img/themes/city/ground.png"),
    underground: require("../img/themes/city/underground.png"),
    obstacle1: require("../img/themes/city/obstacle-1.png"),
    obstacle2: require("../img/themes/city/obstacle-2.png"),
    obstacle3: require("../img/themes/city/obstacle-3.png"),
    obstacle4: require("../img/themes/city/obstacle-4.png"),
  },
  {
    id: "desert",
    background: require("../img/themes/desert/background.png"),
    ground: require("../img/themes/desert/ground.png"),
    underground: require("../img/themes/desert/underground.png"),
    obstacle1: require("../img/themes/desert/obstacle-1.png"),
    obstacle2: require("../img/themes/desert/obstacle-2.png"),
    obstacle3: require("../img/themes/desert/obstacle-3.png"),
    obstacle4: require("../img/themes/desert/obstacle-4.png"),
  },
  {
    id: "grassland",
    background: require("../img/themes/grassland/background.png"),
    ground: require("../img/themes/grassland/ground.png"),
    underground: require("../img/themes/grassland/underground.png"),
    obstacle1: require("../img/themes/grassland/obstacle-1.png"),
    obstacle2: require("../img/themes/grassland/obstacle-2.png"),
    obstacle3: require("../img/themes/grassland/obstacle-3.png"),
    obstacle4: require("../img/themes/grassland/obstacle-4.png"),
  },
  {
    id: "madmax",
    background: require("../img/themes/madmax/background.png"),
    ground: require("../img/themes/madmax/ground.png"),
    underground: require("../img/themes/madmax/underground.png"),
    obstacle1: require("../img/themes/madmax/obstacle-1.png"),
    obstacle2: require("../img/themes/madmax/obstacle-2.png"),
    obstacle3: require("../img/themes/madmax/obstacle-3.png"),
    obstacle4: require("../img/themes/madmax/obstacle-4.png"),
  },
  {
    id: "nightsky",
    background: require("../img/themes/nightsky/background.png"),
    ground: require("../img/themes/nightsky/ground.png"),
    underground: require("../img/themes/nightsky/underground.png"),
    obstacle1: require("../img/themes/nightsky/obstacle-1.png"),
    obstacle2: require("../img/themes/nightsky/obstacle-2.png"),
    obstacle3: require("../img/themes/nightsky/obstacle-3.png"),
    obstacle4: require("../img/themes/nightsky/obstacle-4.png"),
  },
  {
    id: "rainy",
    background: require("../img/themes/rainy/background.png"),
    ground: require("../img/themes/rainy/ground.png"),
    underground: require("../img/themes/rainy/underground.png"),
    obstacle1: require("../img/themes/rainy/obstacle-1.png"),
    obstacle2: require("../img/themes/rainy/obstacle-2.png"),
    obstacle3: require("../img/themes/rainy/obstacle-3.png"),
    obstacle4: require("../img/themes/rainy/obstacle-4.png"),
  },
  {
    id: "sunrise",
    background: require("../img/themes/sunrise/background.png"),
    ground: require("../img/themes/sunrise/ground.png"),
    underground: require("../img/themes/sunrise/underground.png"),
    obstacle1: require("../img/themes/sunrise/obstacle-1.png"),
    obstacle2: require("../img/themes/sunrise/obstacle-2.png"),
    obstacle3: require("../img/themes/sunrise/obstacle-3.png"),
    obstacle4: require("../img/themes/sunrise/obstacle-4.png"),
  },
  {
    id: "sunset",
    background: require("../img/themes/sunset/background.png"),
    ground: require("../img/themes/sunset/ground.png"),
    underground: require("../img/themes/sunset/underground.png"),
    obstacle1: require("../img/themes/sunset/obstacle-1.png"),
    obstacle2: require("../img/themes/sunset/obstacle-2.png"),
    obstacle3: require("../img/themes/sunset/obstacle-3.png"),
    obstacle4: require("../img/themes/sunset/obstacle-4.png"),
  },
  {
    id: "volcano",
    background: require("../img/themes/volcano/background.png"),
    ground: require("../img/themes/volcano/ground.png"),
    underground: require("../img/themes/volcano/underground.png"),
    obstacle1: require("../img/themes/volcano/obstacle-1.png"),
    obstacle2: require("../img/themes/volcano/obstacle-2.png"),
    obstacle3: require("../img/themes/volcano/obstacle-3.png"),
    obstacle4: require("../img/themes/volcano/obstacle-4.png"),
  },
]);

const dinoColors = [
  {
    idle: require("../img/dino/red/idle.png"),
    left: require("../img/dino/red/left.png"),
    right: require("../img/dino/red/right.png"),
    spriteRun: require("../img/dino/red/sprite-run.png"),
    spriteDown: require("../img/dino/red/sprite-down.png"),
    hurt: require("../img/dino/red/hurt.png"),
  },
];
export const DINO_COLOR =
  dinoColors[Math.floor(Math.random() * dinoColors.length)];

const picturesToLoad = THEMES.reduce((acc, v) => {
  acc.push(v.background);
  acc.push(v.ground);
  acc.push(v.underground);
  acc.push(v.obstacle1);
  acc.push(v.obstacle2);
  acc.push(v.obstacle3);
  acc.push(v.obstacle4);
  return acc;
}, []);
picturesToLoad.push(DINO_COLOR.idle, DINO_COLOR.left, DINO_COLOR.right);

function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
    img.style.display = "none";
  });
}

Promise.all(picturesToLoad.map((p) => preloadImage(p))).then(() => {
  document.querySelectorAll(".slide").forEach(function (s, i) {
    s.querySelector(".ground").style.backgroundImage = `url(${
      THEMES[i % THEMES.length].ground
    })`;
    if (s.querySelector(".hurdle")) {
      s.querySelector(".hurdle").src =
        THEMES[(i - 1 + THEMES.length) % THEMES.length].obstacle3;
    }
    s.querySelector(".underground").style.backgroundImage = `url(${
      THEMES[i % THEMES.length].underground
    })`;
    s.style.backgroundImage = `url(${THEMES[i % THEMES.length].background})`;
  });
  document.querySelector("#loader").style.display = "none";
});
