(function main() {
  document.querySelectorAll(".question h3").forEach((elem) => {
    elem.addEventListener("click", () => {
      elem.classList.toggle("active");
    });
  });
})();
