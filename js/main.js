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
      txtMint.textContent = 'Approve FOSSIL';
      txtCurrency.textContent = '';
      return;
    } else {
      txtCurrency.textContent = 'FOSSIL';
    }
  } else {
    txtCurrency.textContent = 'ETH';
  }
  txtMint.textContent = `Mint ${Number.parseInt(inputMint.value)} for ${
    inputMint.value * price
  }`;
});
inputMint.addEventListener('focus', (e) => {
  e.target.focus();
  e.target.select();
});
btnAdd.addEventListener('click', async () => {
  if (inputMint.value >= 20) return;
  inputMint.value++;
  let price = 0.08;
  if (currencyToggle) {
    price = 70;
    if (await allowanceIsInsufficient()) {
      txtMint.textContent = 'Approve FOSSIL';
      txtCurrency.textContent = '';
      return;
    } else {
      txtCurrency.textContent = 'FOSSIL';
    }
  } else {
    txtCurrency.textContent = 'ETH';
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
      txtMint.textContent = 'Approve FOSSIL';
      txtCurrency.textContent = '';
      return;
    } else {
      txtCurrency.textContent = 'FOSSIL';
    }
  } else {
    txtCurrency.textContent = 'ETH';
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
      txtMint.textContent = 'Approve FOSSIL';
      txtCurrency.textContent = '';
      return;
    } else {
      txtCurrency.textContent = 'FOSSIL';
    }
  } else {
    txtCurrency.textContent = 'ETH';
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
      txtMint.textContent = 'Approve FOSSIL';
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
  return (
    Number.parseInt(inputMint.value) * 70 >
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
  btnList.replaceChildren();
  if (!currencyToggle) {
    try {
      const price = await vxc.methods.etherPrice().call({});
      const balance = await web3.eth.getBalance(address);
      if (balance < price * amount) {
        enableBtnMint();
        txtMint.textContent = 'Insufficient ETH';
        txtCurrency.textContent = '';
        return;
      } else {
        txtCurrency.textContent = 'FOSSIL';
      }
      const gas = await vxc.methods.mint(amount).estimateGas({
        from: address,
        value: price * amount,
      });
      vxc.methods
        .mint(amount)
        .send({
          from: address,
          gas: Math.floor(gas * 1.1),
          value: price * amount,
        })
        .on('receipt', (receipt) => {
          enableBtnMint();
          modalMinted(receipt);
        })
        .on('transactionHash', (hash) => {
          enableBtnMint();
          showModal(`https://etherscan.io/tx/${hash}`, 'Minting your Voxel');
        })
        .on('error', (error) => {
          enableBtnMint();
          console.log(error);
        });
    } catch (err) {
      console.log(err);
      enableBtnMint();
      // hideModal();
      showModalError(err, 'Error occurred');
    }
  } else {
    if (await allowanceIsInsufficient()) {
      const v = Web3.utils.toWei('100000', 'ether');
      const gas = await tc.methods
        .approve(config[chainId].vx_address, v)
        .estimateGas({
          from: address,
        });
      tc.methods
        .approve(config[chainId].vx_address, v)
        .send({
          from: address,
          gas: Math.floor(gas * 1.1),
        })
        .on('receipt', (receipt) => {
          console.log(receipt);
          enableBtnMint();
          hideModal();
          txtMint.textContent = `Mint ${inputMint.value} for ${
            inputMint.value * 70
          }`;
          txtCurrency.textContent = 'FOSSIL';
        })
        .on('transactionHash', (hash) => {
          enableBtnMint();
          showModal(
            `https://etherscan.io/tx/${hash}`,
            'Approving $FOSSIL usage',
          );
        })
        .on('error', (err) => {
          console.log(err);
          enableBtnMint();
          showModalError(err, 'Error occurred');
        });
    } else {
      try {
        const gas = await vxc.methods.fossilMint(amount).estimateGas({
          from: address,
        });
        vxc.methods
          .fossilMint(amount)
          .send({
            from: address,
            gas: Math.floor(gas * 1.1),
          })
          .on('receipt', (receipt) => {
            enableBtnMint();
            modalMinted(receipt);
          })
          .on('transactionHash', (hash) => {
            enableBtnMint();
            showModal(`https://etherscan.io/tx/${hash}`, 'Minting your Voxel');
          })
          .on('error', () => {
            enableBtnMint();
            hideModal();
          });
      } catch (error) {
        console.log(err);
        enableBtnMint();
        showModalError(err, 'Error occurred');
      }
    }
  }
});

let vxaddress;
window.onload = async () => {
  const txtMinted = document.getElementById('txtMinted');
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
  vxaddress = config[chainId].vx_address;
  const supply = await vxc.methods.totalSupply().call({});
  if (supply > 13333) {
    txtMinted.textContent = `Sold out!`;
    btnMint.disabled = true;
    btnFossilToggle.hidden = true;
  }
  txtMinted.textContent = `${supply} / 13,333 Minted`;
  const ctc = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  const balance = await ctc.methods.balanceOf(address).call({});
  btnFossilToggle.hidden = balance == 0;
};

// Get the modal
const btnViewTx = document.getElementById('btnViewTx');
const modal = document.getElementById('txModal');
const txtModalHeader = document.getElementById('txtModalHeader');
const loaderModal = document.getElementById('loaderModal');
const previewModal = document.getElementById('previewModal');
const btnList = document.getElementById('btnList');
const txtErr = document.getElementById('txtErr');
function showModal(url, text) {
  modal.style.display = 'block';
  btnViewTx.href = url;
  txtModalHeader.textContent = text;
  loaderModal.hidden = false;
  previewModal.hidden = true;
  btnViewTx.hidden = false;
  txtErr.hidden = true;
  btnList.replaceChildren();
}
function showModalError(error, text) {
  modal.style.display = 'block';
  txtModalHeader.textContent = text;
  loaderModal.hidden = false;
  previewModal.hidden = true;
  btnViewTx.hidden = true;
  txtErr.textContent = error.toString();
  txtErr.hidden = false;
  btnList.replaceChildren();
}

function createButton(name) {
  const btn = document.createElement('a');
  btn.type = 'button';
  btn.classList = 'btn btn-secondary';
  btn.target = '_blank';
  btn.style = 'font-weight: 800; margin-top: 18px;';
  btn.textContent = `VX #${name}`;
  btn.href = `https://opensea.io/assets/${vxaddress}/${name}`;

  return btn;
}

function modalMinted(voxels) {
  txtModalHeader.textContent = 'Minted!';
  loaderModal.hidden = true;
  previewModal.hidden = false;
  btnViewTx.hidden = true;
  btnList.replaceChildren();
  if (voxels.events.Transfer.length > 1) {
    const tokenIds = voxels.events.Transfer.map((v) => v.returnValues.tokenId);
    tokenIds.forEach((v) => {
      const btn = createButton(v);
      btnList.appendChild(btn);
    });
  } else {
    const tokenId = voxels.events.Transfer.returnValues.tokenId;
    const btn = createButton(tokenId);
    btnList.appendChild(btn);
  }
}
function hideModal() {
  modal.style.display = 'none';
}

const span = document.getElementsByClassName('xclose')[0];
span.onclick = hideModal;

// When the user clicks anywhere outside of the modal, close it
window.onclick = function (event) {
  if (event.target == modal) {
    hideModal();
    btnList.replaceChildren();
  }
};
