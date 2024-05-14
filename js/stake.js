import os from './contracts/ERC1155Test.json';
import ct from './contracts/CryptoTrex.json';
import vx from './contracts/CryptoTrexVX.json';
import { config } from './config';
import { loadWeb3, web3Address, switchChain } from './web3.js';
import Web3 from 'web3';
import { tokenIdMap } from './map';
import imgLoader from '../img/loader.svg';

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
let unclaimedVXs = [];

async function getClaimableRewards(address, c) {
  return await c.methods.rewards(itemIds).call({ from: address });
}

const contentClaimFossil = document.getElementById('contentClaimFossil');
const loaderClaimFossil = document.getElementById('loaderClaimFossil');
async function claimRewards(btn, address, web3) {
  loaderClaimFossil.hidden = false;
  contentClaimFossil.hidden = true;
  btn.disabled = true;

  const chainId = await web3.eth.getChainId();
  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  const gas = await c.methods.claim(itemIds).estimateGas({
    from: address,
  });
  c.methods
    .claim(itemIds)
    .send({ from: address, gas: Math.floor(gas * 1.1) })
    .on('receipt', async () => {
      loaderClaimFossil.hidden = true;
      contentClaimFossil.hidden = false;
      btn.disabled = false;
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
      loaderClaimFossil.hidden = true;
      contentClaimFossil.hidden = false;
      btn.disabled = false;
      btn.addEventListener('click', () => {
        window.open(`https://etherscan.io/tx/${hash}`, '_blank').focus();
      });
    })
    .on('error', () => {
      loaderClaimFossil.hidden = true;
      contentClaimFossil.hidden = false;
      btn.disabled = false;
    });
}

async function getV2Items(address, opensea, newCollection) {
  const url = `${opensea}/api/v2/contract?offset=0&limit=50&collection=${newCollection}&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}
/*
async function getItems(ownerAddr, baseURL, contractAddr) {
  const url = `${baseURL}?owner=${ownerAddr}&contractAddresses[]=${[
    contractAddr,
  ]}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.ownedNfts.map((d) => d.id.tokenId);
}
*/
async function getItems(ownerAddr, baseURL, contractAddr) {
  const url = `${baseURL}?owner=${ownerAddr}&contractAddresses[]=${[
    contractAddr,
  ]}`;
  const res = await fetch(url);
  const body = await res.json();

  if (body && body.ownedNfts) {
    return body.ownedNfts.map((d) => d.id.tokenId);
  } else {
    console.error("Error fetching items:", body);
    return []; // Return an empty array or handle the error case as needed
  }
}


async function renderItems(address, web3, c) {
  const chainId = await web3.eth.getChainId();
  const v2 = await getItems(
    address,
    config[chainId].alchemy_api,
    config[chainId].migration_address,
  );

  const list = document.getElementById('card-list');
  if (web3.currentProvider.isMetaMask) {
    const addTokenBtn = document.getElementById('addTokenBtn');
    addTokenBtn.hidden = false;
  }
  
/* if (v2) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'X-API-KEY': config[chainId].opensea_api_key, // Use 'X-API-KEY' instead of 'x-api-key'
    },
  };
   
  const baseUrl = `${config[chainId].opensea_api}/api/v2/chain/ethereum/contract/${config[chainId].migration_address}/nfts/`;

  v2.forEach(async (e) => {
    try {
      itemIds.push(e);
      const response = await fetch(baseUrl, options); // Pass options object as the second argument
      const body = await response.json();
      const card = await buildCard(body);
      list.appendChild(card);
    } catch (error) {
      console.error(error);
    }
  });
}
*/
if (v2) {
  console.log("Value of v2:", v2);
  for (const e of v2) {
    try {
      console.log(`Fetching data for item ID: ${e}`);
      itemIds.push(e);
      const response = await fetch(
        `${config[chainId].opensea_api}/api/v2/chain/ethereum/contract/${config[chainId].migration_address}/nfts/${Web3.utils.toBN(e)}`,
        { 
          method: 'GET',
          headers: {
            'X-API-Key': config[chainId].opensea_api_key,
          }
        }
      );
      console.log(`Response received for item ID: ${e}`);
      const body = await response.json();
      console.log(`JSON body received for item ID: ${e}`);
      const card = await buildCard(body);
      console.log(`Card built for item ID: ${e}`);
      list.appendChild(card);
      console.log(`Card appended for item ID: ${e}`);
    } catch (error) {
      console.error(`Error fetching data for item ID ${e}:`, error);
    }
  }
}
 }


  const rewardsView = document.getElementById('claimableRewardsTxt');
  const rewards = await getClaimableRewards(address, c);
  rewardsView.textContent = `${formatEther(rewards)} $FOSSIL`;
}

async function buildCard(e) {
  console.log('Item:', e); // Add this line to log the item before accessing token_id
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
  image.src = e.nft.image_url;
  image.crossOrigin = 'anonymous';
  image.style.width = '100%';
  image.classList = 'card-img-top';
  imageContainer.appendChild(image);
  const bodyDiv = document.createElement('div');
  bodyDiv.classList = 'card-body';
  const nameDiv = document.createElement('h5');
  nameDiv.classList.add('card-title');
  nameDiv.textContent = e.name;

  const web3 = await loadWeb3();
  const chainId = await web3.eth.getChainId();
  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
  const isClaimed = await vxc.methods.isGenesisMinted([e.token_id]).call({});
  const claimVxBtn = document.createElement('button');
  const contentClaimVx = document.createElement('span');
  const loaderClaimVx = document.createElement('img');
  loaderClaimVx.width = '24';
  loaderClaimVx.height = '24';
  loaderClaimVx.src = imgLoader;
  loaderClaimVx.hidden = true;
  claimVxBtn.type = 'button';
  contentClaimVx.textContent = 'Claim Voxel';
  claimVxBtn.appendChild(loaderClaimVx);
  claimVxBtn.appendChild(contentClaimVx);
  if (isClaimed[0]) {
    claimVxBtn.classList = 'btn btn-disabled w-100';
    claimVxBtn.disabled = true;
    contentClaimVx.textContent = 'Claimed';
  } else {
    claimVxBtn.classList = 'btn btn-secondary w-100';
    contentClaimVx.textContent = 'Claim Voxel';
    claimVxBtn.disabled = false;
    unclaimedVXs.push(e.token_id);
  }
  claimVxBtn.style = 'margin-bottom: 12px';
  claimVxBtn.addEventListener('click', async () => {
    loaderClaimVx.hidden = false;
    contentClaimVx.hidden = true;
    claimVxBtn.disabled = true;
    const address = await web3Address(web3);
    const gas = await vxc.methods.genesisMint([e.token_id]).estimateGas({
      from: address,
    });
    vxc.methods
      .genesisMint([e.token_id])
      .send({ from: address, gas: Math.floor(gas * 1.1) })
      .on('receipt', async () => {
        claimVxBtn.classList = 'btn btn-disabled w-100';
        claimVxBtn.disabled = true;
        contentClaimVx.textContent = 'Claimed';
        loaderClaimVx.hidden = true;
        contentClaimVx.hidden = false;
      })
      .on('transactionHash', (hash) => {
        contentClaimVx.textContent = 'Claiming...';
        claimVxBtn.classList = 'btn btn-disabled w-100';
        claimVxBtn.disabled = true;
      })
      .on('error', () => {
        loaderClaimVx.hidden = true;
        contentClaimVx.hidden = false;
        contentClaimVx.textContent = 'Claim VX';
        claimVxBtn.classList = 'btn btn-secondary w-100';
        claimVxBtn.disabled = false;
      });
  });

  // const claimFossilBtn = document.createElement('button');
  // claimFossilBtn.type = 'button';
  // claimFossilBtn.classList = 'btn btn-secondary w-100';
  // const fossilAmount = await c.methods.rewards([e.token_id]).call({});
  // claimFossilBtn.textContent = `Claim Fossil (${formatEther(fossilAmount)})`;

  // claimFossilBtn.addEventListener('click', () => {});

  card.appendChild(imageContainer);
  bodyDiv.appendChild(nameDiv);
  bodyDiv.appendChild(claimVxBtn);
  // bodyDiv.appendChild(claimFossilBtn);
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
    await switchChain(window.ethereum);
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

const btnClaimAllVX = document.getElementById('claimAllVxBtn');
const contentClaimAllVx = document.getElementById('contentClaimAllVx');
const loaderClaimAllVx = document.getElementById('loaderClaimAllVx');
btnClaimAllVX.addEventListener('click', async () => {
  contentClaimAllVx.hidden = true;
  loaderClaimAllVx.hidden = false;
  btnClaimAllVX.disabled = true;
  const web3 = await loadWeb3();
  const chainId = await web3.eth.getChainId();
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
  const address = await web3Address(web3);
  const gas = await vxc.methods.genesisMint(unclaimedVXs).estimateGas({
    from: address,
  });
  vxc.methods
    .genesisMint(unclaimedVXs)
    .send({ from: address, gas: Math.floor(gas * 1.1) })
    .on('receipt', async () => {
      contentClaimAllVx.hidden = false;
      loaderClaimAllVx.hidden = true;
      btnClaimAllVX.disabled = false;
    })
    .on('transactionHash', (hash) => {
      contentClaimAllVx.hidden = false;
      loaderClaimAllVx.hidden = true;
      btnClaimAllVX.disabled = false;
    })
    .on('error', () => {
      contentClaimAllVx.hidden = false;
      loaderClaimAllVx.hidden = true;
      btnClaimAllVX.disabled = false;
    });
});

async function checkClaimableRewards() {
  const web3 = await loadWeb3();
  const chainId = await web3.eth.getChainId();
  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
  const rexIdInput = document.getElementById('rexId');
  const tokenId = tokenIdMap[rexIdInput.value];
  const isMinted = await vxc.methods.isGenesisMinted([tokenId]).call({});
  const txtIsVXClaimed = document.getElementById('txtIsVXClaimed');
  const containerIsVXClaimed = document.getElementById('containerIsVXClaimed');
  if (isMinted[0]) {
    txtIsVXClaimed.textContent = 'Voxel Claimed';
  } else {
    txtIsVXClaimed.textContent = 'Voxel Unclaimed';
  }

  return await c.methods.rewards([tokenId]).call({});
}
