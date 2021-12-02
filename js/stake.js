import os from './contracts/ERC1155Test.json';
import ct from './contracts/CryptoTrex.json';
import { config } from './config';
import { loadWeb3, web3Address, switchChain } from './web3.js';

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

async function getClaimableRewards() {
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();

  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  return await c.methods.rewards(itemIds).call({ from: address });
}

async function claimRewards(btn) {
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();

  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  c.methods
    .claim(itemIds)
    .send({ from: address })
    .on('receipt', async () => {
      btn.disabled = true;
      btn.classList = 'nes-btn is-success';
      btn.textContent = 'Claimed';
      const rewardsView = document.getElementById('claimableRewardsTxt');
      const rewards = await getClaimableRewards();
      rewardsView.textContent = `${web3.utils.fromWei(
        rewards,
        'ether',
      )} $FOSSIL`;
      btn.disabled = false;
      btn.classList = 'nes-btn is-primary';
      btn.textContent = 'Claim';
    })
    .on('transactionHash', (hash) => {
      btn.textContent = 'Claiming...';
      btn.addEventListener('click', () => {
        window.open(`https://etherscan.io/tx/${hash}`, '_blank').focus();
      });
    })
    .on('error', () => {
      btn.disabled = true;
      btn.textContent = 'Failed';
      btn.classList = 'nes-btn is-error';
    });
}

async function getV2Items(address, opensea, newCollection) {
  const url = `${opensea}/api/v1/assets?offset=0&limit=50&collection=${newCollection}&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}

async function renderItems(address, web3) {
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
  const rewards = await getClaimableRewards();
  rewardsView.textContent = `${web3.utils.fromWei(rewards, 'ether')} $FOSSIL`;
}

function buildCard(e) {
  const card = document.createElement('div');
  card.classList = 'nes-container item-card is-rounded';
  card.style = 'background-color: white; display: block;';
  const imageContainer = document.createElement('a');
  imageContainer.classList = 'nes-container is-rounded';
  imageContainer.href = e.permalink;
  imageContainer.target = '_blank';
  imageContainer.style =
    'background-color: white; padding: 0px !important; display: flex; justify-content: center';
  const image = document.createElement('img');
  image.src = e.image_thumbnail_url;
  image.crossOrigin = 'anonymous';
  image.style.width = '100%';
  imageContainer.appendChild(image);
  const nameDiv = document.createElement('p');
  nameDiv.classList.add('pt-1');
  nameDiv.textContent = e.name;
  card.appendChild(imageContainer);
  card.appendChild(nameDiv);

  const cardContainer = document.createElement('div');
  cardContainer.classList.add('col-md-3', 'col-xs-6', 'pb-1');
  cardContainer.appendChild(card);

  return cardContainer;
}

window.onload = async () => {
  try {
    const web3 = await loadWeb3();
    const address = await web3Address(web3);
    switchChain(window.ethereum);
    renderItems(address, web3);
  } catch (err) {
    console.log(err);
  }
};

const addTokenBtn = document.getElementById('addTokenBtn');
addTokenBtn.addEventListener('click', async () => {
  await addToken(window.ethereum);
});

const claimBtn = document.getElementById('claimBtn');
claimBtn.addEventListener('click', async () => await claimRewards(claimBtn));
