import ethicon from '../img/eth.png';
import fslicon from '../img/token.png';

document.addEventListener('DOMContentLoaded', () => {
  const vxViewer = document.querySelector('#preview .voxel-viewer');
  vxViewer.style.height = vxViewer.offsetWidth;
  window.addEventListener('resize', () => {
    vxViewer.style.height = vxViewer.offsetWidth;
  });
});

{
  /* <div class="input-mint-container">
<div class="input-mint-input">
  <button id="btnAdd" class="btn-input">-</button>
  <input id="inputMint" value="1" max="20" step="1" class="input-mint" type="number"/>
  <button id="btnMinus" class="btn-input">+</button>
</div>
<button id="btnMax" class="btn-max">MAX</button>
</div> */
}

let currencyToggle = false;
const btnAdd = document.getElementById('btnAdd');
const btnMinus = document.getElementById('btnMinus');
const inputMint = document.getElementById('inputMint');
const btnMax = document.getElementById('btnMax');
const txtMint = document.getElementById('txtMint');
inputMint.addEventListener('input', (event) => {
  let price = 0.08;
  if (currencyToggle) {
    price = 70;
  }
  if (event.target.value <= 0) inputMint.value = 1;
  if (event.target.value >= 20) inputMint.value = 20;
  txtMint.textContent = `Mint ${Number.parseInt(inputMint.value)} for ${
    inputMint.value * price
  }`;
});
btnAdd.addEventListener('click', () => {
  if (inputMint.value >= 20) return;
  inputMint.value++;
  let price = 0.08;
  if (currencyToggle) {
    price = 70;
  }
  txtMint.textContent = `Mint ${inputMint.value} for ${
    inputMint.value * price
  }`;
});
btnMinus.addEventListener('click', () => {
  if (inputMint.value <= 1) return;
  inputMint.value--;
  let price = 0.08;
  if (currencyToggle) {
    price = 70;
  }
  txtMint.textContent = `Mint ${inputMint.value} for ${
    inputMint.value * price
  }`;
});
btnMax.addEventListener('click', () => {
  inputMint.value = 20;
  let price = 0.08;
  if (currencyToggle) {
    price = 70;
  }
  txtMint.textContent = `Mint 20 for ${20 * price}`;
});

const btnFossilToggle = document.getElementById('btnFossilToggle');
const txtCurrency = document.getElementById('txtCurrency');
btnFossilToggle.addEventListener('click', () => {
  let price;
  if (currencyToggle) {
    btnFossilToggle.textContent = 'Mint with $FOSSIL';
    txtCurrency.textContent = 'ETH';
    price = 0.08;
  } else {
    btnFossilToggle.textContent = 'Mint with $ETH';
    txtCurrency.textContent = 'FOSSIL';
    price = 70;
  }
  txtMint.textContent = `Mint ${inputMint.value} for ${
    inputMint.value * price
  }`;
  currencyToggle = !currencyToggle;
});
