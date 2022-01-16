import os from './contracts/ERC1155Test.json';
import ct from './contracts/CryptoTrex.json';
import vx from './contracts/CryptoTrexVX.json';
import t from './contracts/Fossil.json';
import { config } from './config';
import { loadWeb3, web3Address, switchChain } from './web3.js';
import Web3 from 'web3';
import { tokenIdMap } from './map';

document.addEventListener('DOMContentLoaded', () => {
  const vxViewer = document.querySelector('#preview .voxel-viewer');
  vxViewer.style.height = vxViewer.offsetWidth;
  window.addEventListener('resize', () => {
    vxViewer.style.height = vxViewer.offsetWidth;
  });
});

let currencyToggle = false;
const btnAdd = document.getElementById('btnAdd');
const btnMinus = document.getElementById('btnMinus');
const inputMint = document.getElementById('inputMint');
const btnMax = document.getElementById('btnMax');
const txtMint = document.getElementById('txtMint');
inputMint.addEventListener('input', async (event) => {
  if (event.target.value <= 0) inputMint.value = 1;
  if (event.target.value >= 20) inputMint.value = 20;
  let price = 0.08;
  if (currencyToggle) {
    price = 70;
    if (await allowanceIsInsufficient()) {
      txtMint.textContent = 'Approve FOSSIL token usage';
      txtCurrency.textContent = '';
      return;
    }
  }
  txtMint.textContent = `Mint ${Number.parseInt(inputMint.value)} for ${
    inputMint.value * price
  }`;
});
btnAdd.addEventListener('click', async () => {
  if (inputMint.value >= 20) return;
  inputMint.value++;
  let price = 0.08;
  if (currencyToggle) {
    price = 70;
    if (await allowanceIsInsufficient()) {
      txtMint.textContent = 'Approve FOSSIL token usage';
      txtCurrency.textContent = '';
      return;
    }
  }
  txtMint.textContent = `Mint ${inputMint.value} for ${
    inputMint.value * price
  }`;
});
btnMinus.addEventListener('click', async () => {
  if (inputMint.value <= 1) return;
  inputMint.value--;
  let price = 0.08;
  txtMint.textContent = `Mint ${inputMint.value} for ${
    inputMint.value * price
  }`;
  if (currencyToggle) {
    price = 70;
    if (await allowanceIsInsufficient()) {
      txtMint.textContent = 'Approve FOSSIL token usage';
      txtCurrency.textContent = '';
      return;
    }
  }
  txtMint.textContent = `Mint ${inputMint.value} for ${
    inputMint.value * price
  }`;
});
btnMax.addEventListener('click', async () => {
  inputMint.value = 20;
  let price = 0.08;
  if (currencyToggle) {
    price = 70;
    if (await allowanceIsInsufficient()) {
      txtMint.textContent = 'Approve FOSSIL token usage';
      txtCurrency.textContent = '';
      return;
    }
  }
  txtMint.textContent = `Mint 20 for ${20 * price}`;
});

const btnFossilToggle = document.getElementById('btnFossilToggle');
const txtCurrency = document.getElementById('txtCurrency');
btnFossilToggle.addEventListener('click', async () => {
  let price;
  if (currencyToggle) {
    btnFossilToggle.textContent = 'Mint with $FOSSIL';
    txtCurrency.textContent = 'ETH';
    price = 0.08;
    txtMint.textContent = `Mint ${inputMint.value} for ${
      inputMint.value * price
    }`;
  } else {
    if (await allowanceIsInsufficient()) {
      txtMint.textContent = 'Approve FOSSIL token usage';
      txtCurrency.textContent = '';
    } else {
      price = 70;
      txtMint.textContent = `Mint ${inputMint.value} for ${
        inputMint.value * price
      }`;
      txtCurrency.textContent = 'FOSSIL';
    }
    btnFossilToggle.textContent = 'Mint with $ETH';
  }
  currencyToggle = !currencyToggle;
});

async function allowanceIsInsufficient() {
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const tc = new web3.eth.Contract(t.abi, config[chainId].token_address);
  const allowance = await tc.methods
    .allowance(address, config[chainId].vx_address)
    .call({});
  price = 70;
  return (
    Web3.utils.fromDecimal(Number.parseInt(inputMint.value) * price) >=
    Number.parseInt(Web3.utils.fromWei(allowance, 'ether'))
  );
}

const loaderMint = document.getElementById('loaderMint');
const contentMint = document.getElementById('contentMint');
const btnMint = document.getElementById('btnMint');
function enableBtnMint() {
  btnMint.disabled = false;
  contentMint.hidden = false;
  loaderMint.hidden = true;
}
function disableBtnMint() {
  btnMint.disabled = true;
  contentMint.hidden = true;
  loaderMint.hidden = false;
}
btnMint.addEventListener('click', async () => {
  disableBtnMint();
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
  const tc = new web3.eth.Contract(t.abi, config[chainId].token_address);
  const amount = Web3.utils.fromDecimal(inputMint.value);
  if (!currencyToggle) {
    const price = await vxc.methods.etherPrice().call({});
    const gas = await vxc.methods.mint(amount).estimateGas({
      from: address,
      value: price * amount,
    });
    vxc.methods
      .mint(amount)
      .send({
        from: address,
        gas: gas,
        value: price * amount,
      })
      .on('receipt', enableBtnMint)
      .on('transactionHash', (hash) => {
        enableBtnMint();
      })
      .on('error', enableBtnMint);
  } else {
    if (await allowanceIsInsufficient()) {
      const value = amount * Web3.utils.fromDecimal(70);
      const v = Web3.utils.toWei(value.toString(), 'ether');
      const gas = await tc.methods
        .approve(config[chainId].vx_address, v)
        .estimateGas({
          from: address,
        });
      tc.methods
        .approve(config[chainId].vx_address, v)
        .send({
          from: address,
          gas: gas,
        })
        .on('receipt', enableBtnMint)
        .on('transactionHash', (hash) => {
          enableBtnMint();
        })
        .on('error', enableBtnMint);
    } else {
      const gas = await vxc.methods.fossilMint(amount).estimateGas({
        from: address,
      });
      vxc.methods
        .fossilMint(amount)
        .send({
          from: address,
          gas: gas,
        })
        .on('receipt', enableBtnMint)
        .on('transactionHash', (hash) => {
          enableBtnMint();
        })
        .on('error', enableBtnMint);
    }
  }
});

window.onload = async () => {
  const txtMinted = document.getElementById('txtMinted');
  const web3 = await loadWeb3();
  const chainId = await web3.eth.getChainId();
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
  const supply = await vxc.methods.totalSupply().call({});
  console.log(supply);
  if (supply - 1112 > 11111) {
    txtMinted.textContent = `Sold out!`;
  }
  txtMinted.textContent = `${supply - 1112} / 11,111 Minted`;
};
