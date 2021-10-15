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
    background: require("../img/themes/beach/background.png"),
    ground: require("../img/themes/beach/ground.png"),
  },
  {
    background: require("../img/themes/city/background.png"),
    ground: require("../img/themes/city/ground.png"),
  },
  {
    background: require("../img/themes/desert/background.png"),
    ground: require("../img/themes/desert/ground.png"),
  },
  {
    background: require("../img/themes/grassland/background.png"),
    ground: require("../img/themes/grassland/ground.png"),
  },
  {
    background: require("../img/themes/madmax/background.png"),
    ground: require("../img/themes/madmax/ground.png"),
  },
  {
    background: require("../img/themes/nightsky/background.png"),
    ground: require("../img/themes/nightsky/ground.png"),
  },
  {
    background: require("../img/themes/rainy/background.png"),
    ground: require("../img/themes/rainy/ground.png"),
  },
  {
    background: require("../img/themes/sunrise/background.png"),
    ground: require("../img/themes/sunrise/ground.png"),
  },
  {
    background: require("../img/themes/sunset/background.png"),
    ground: require("../img/themes/sunset/ground.png"),
  },
  {
    background: require("../img/themes/volcano/background.png"),
    ground: require("../img/themes/volcano/ground.png"),
  },
]);

const picturesToLoad = THEMES.reduce((acc, v) => {
  acc.push(v.background);
  acc.push(v.ground);
  return acc;
}, []);

function preloadImage(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = url;
  });
}

Promise.all(picturesToLoad.map((p) => preloadImage(p))).then(() => {
  document.querySelectorAll(".slide").forEach(function (s, i) {
    s.querySelector(".ground").style.backgroundImage = `url(${
      THEMES[i % THEMES.length].ground
    })`;
    s.style.backgroundImage = `url(${THEMES[i % THEMES.length].background})`;
  });
  document.querySelector("#loader").style.display = "none";
});
