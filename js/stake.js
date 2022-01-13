import os from './contracts/ERC1155Test.json';
import ct from './contracts/CryptoTrex.json';
import { config } from './config';
import { loadWeb3, web3Address, switchChain } from './web3.js';
import Web3 from 'web3';
import { tokenIdMap } from './map';

const formatEther = (value) =>
  new Number(Web3.utils.fromWei(value, 'ether')).toFixed(4).toString();

async function addToken(eth) {
  const web3 = await loadWeb3();
  const chainId = await web3.eth.getChainId();

  const tokenAddress = config[chainId].token_address;
  const tokenSymbol = 'FOSSIL';
  const tokenDecimals = 18;
  const tokenImage =
    'https://gateway.pinata.cloud/ipfs/QmZpPpnuASN7riY1UwVftSMowJAgMbf9x1k9pCaH5buSEQ';

  try {
    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
    await eth.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20', // Initially only supports ERC20, but eventually more!
        options: {
          address: tokenAddress, // The address that the token is at.
          symbol: tokenSymbol, // A ticker symbol or shorthand, up to 5 chars.
          decimals: tokenDecimals, // The number of decimals in the token
          image: tokenImage, // A string url of the token logo
        },
      },
    });
  } catch (error) {
    console.log(error);
  }
}
let itemIds = [];

async function getClaimableRewards(address, c) {
  return await c.methods.rewards(itemIds).call({ from: address });
}

async function claimRewards(btn, address, web3) {
  btn.disabled = true;
  btn.textContent = 'Claiming...';
  btn.classList = 'nes-btn is-disabled';

  const chainId = await web3.eth.getChainId();
  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  const gas = await c.methods.claim(itemIds).estimateGas({
    from: address,
  });
  c.methods
    .claim(itemIds)
    .send({ from: address, gas: gas })
    .on('receipt', async () => {
      btn.disabled = true;
      btn.classList = 'nes-btn is-success';
      btn.textContent = 'Claimed';
      const rewardsView = document.getElementById('claimableRewardsTxt');
      const rewards = await getClaimableRewards(address, c);
      rewardsView.textContent = `${formatEther(rewards)} $FOSSIL`;
      setTimeout(() => {
        btn.disabled = false;
        btn.classList = 'nes-btn is-primary';
        btn.textContent = 'Claim';
      }, 3000);
    })
    .on('transactionHash', (hash) => {
      btn.disabled = false;
      btn.textContent = 'Claiming...';
      btn.classList = 'nes-btn';
      btn.addEventListener('click', () => {
        window.open(`https://etherscan.io/tx/${hash}`, '_blank').focus();
      });
    })
    .on('error', () => {
      btn.disabled = true;
      btn.textContent = 'Failed';
      btn.classList = 'nes-btn is-error';
      setTimeout(() => {
        btn.disabled = false;
        btn.classList = 'nes-btn is-primary';
        btn.textContent = 'Claim';
      }, 3000);
    });
}

async function getV2Items(address, opensea, newCollection) {
  const url = `${opensea}/api/v1/assets?offset=0&limit=50&collection=${newCollection}&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}

async function renderItems(address, web3, c) {
  const chainId = await web3.eth.getChainId();
  const v2 = await getV2Items(
    address,
    config[chainId].opensea_api,
    config[chainId].new_collection,
  );

  const list = document.getElementById('card-list');
  if (web3.currentProvider.isMetaMask) {
    const addTokenBtn = document.getElementById('addTokenBtn');
    addTokenBtn.hidden = false;
  }

  if (v2) {
    v2.forEach((e) => {
      itemIds.push(e.token_id);
      list.appendChild(buildCard(e));
    });
  }

  const rewardsView = document.getElementById('claimableRewardsTxt');
  const rewards = await getClaimableRewards(address, c);
  rewardsView.textContent = `${formatEther(rewards)} $FOSSIL`;
}

function buildCard(e) {
  const card = document.createElement('div');
  card.classList = 'card';
  card.style = `
  margin: 4px;
  background-color: #0a0a0a;
  color: #fff;
  border: 1px solid;
  padding: 24px;
  border-image-slice: 1;
  border-image-source: linear-gradient(180deg, #d56730, #d5673041);`;
  const imageContainer = document.createElement('a');
  imageContainer.href = e.permalink;
  imageContainer.target = '_blank';
  const image = document.createElement('img');
  image.src = e.image_thumbnail_url;
  image.crossOrigin = 'anonymous';
  image.style.width = '100%';
  image.classList = 'card-img-top';
  imageContainer.appendChild(image);
  const bodyDiv = document.createElement('div');
  bodyDiv.classList = 'card-body';
  const nameDiv = document.createElement('h5');
  nameDiv.classList.add('card-title');
  nameDiv.textContent = e.name;

  // TODO: implement individual claim VX button
  // const claimVxBtn = document.createElement('button');
  // claimVxBtn.type = 'button';
  // claimVxBtn.classList = 'btn btn-primary w-100';
  // claimVxBtn.textContent = 'Claim VX';
  // claimVxBtn.addEventListener('click', () => {});

  card.appendChild(imageContainer);
  bodyDiv.appendChild(nameDiv);
  // bodyDiv.appendChild(claimVxBtn);
  card.appendChild(bodyDiv);

  const cardContainer = document.createElement('div');
  cardContainer.classList.add('col-md-3', 'col-xs-6', 'pb-1');
  cardContainer.appendChild(card);

  return cardContainer;
}

window.onload = async () => {
  try {
    const web3 = await loadWeb3();
    const address = await web3Address(web3);
    const chainId = await web3.eth.getChainId();
    const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
    // await switchChain(window.ethereum);
    await renderItems(address, web3, c);

    const claimBtn = document.getElementById('claimBtn');
    claimBtn.addEventListener(
      'click',
      async () => await claimRewards(claimBtn, address, web3),
    );
  } catch (err) {
    console.log(err);
  }
};

const addTokenBtn = document.getElementById('addTokenBtn');
addTokenBtn.addEventListener('click', async () => {
  await addToken(window.ethereum);
});

const btnCheck = document.getElementById('btnCheck');
btnCheck.addEventListener('click', async () => {
  const amt = await checkClaimableRewards();
  console.log(amt);
  const tokenAmt = document.getElementById('tokenAmt');
  tokenAmt.textContent = formatEther(amt);
});

async function checkClaimableRewards() {
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  const rexIdInput = document.getElementById('rexId');
  const tokenId = tokenIdMap[rexIdInput.value];
  console.log(tokenId, rexIdInput.value);

  return await c.methods.rewards([tokenId]).call({ from: address });
}
