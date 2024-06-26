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
  console.log("URL_getv2Items:", url);
  const url = `${opensea}/api/v2/contract?offset=0&limit=50&collection=${newCollection}&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}

/*async function getItems(ownerAddr, baseURL, contractAddr) {
  const url = `${baseURL}?owner=${ownerAddr}&contractAddresses[]=${[
    contractAddr,
  ]}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.ownedNfts.map((d) => d.id.tokenId);
}*/
//new code 
async function getItems(ownerAddr, baseURL, contractAddr) {
  const url = `${baseURL}?owner=${ownerAddr}&contractAddresses[]=${[
    contractAddr,
  ]}`;
  console.log("Fetching items from URL:", url); // Add this console log to track the constructed URL
  const res = await fetch(url);
  const body = await res.json();
  console.log("Response from server:", body); // Add this console log to track the response from the server
  return body.ownedNfts.map((d) => d.id.tokenId);
}
//till here

async function renderItems(address, web3, c) {
  const chainId = await web3.eth.getChainId();
  const v2 = await getItems(
    address,
    config[chainId].alchemy_api,
    config[chainId].migration_address,
  );
//old code
 /* const list = document.getElementById('card-list');
  if (web3.currentProvider.isMetaMask) {
    const addTokenBtn = document.getElementById('addTokenBtn');
    addTokenBtn.hidden = false;
  }
  */
  //new code
  const list = document.getElementById('card-list');
console.log("Card list element:", list); // Log the card list element

if (web3.currentProvider.isMetaMask) {
  const addTokenBtn = document.getElementById('addTokenBtn');
  addTokenBtn.hidden = false;
  console.log("Add token button:", addTokenBtn); // Log the add token button
}


  //Old code here
 /* if (v2) {
    v2.forEach(async (e) => {
      itemIds.push(e);
      const response = await fetch(
        `${config[chainId].opensea_api}/api/v2/chain/ethereum/contract/${
          config[chainId].migration_address
        }/${Web3.utils.toBN(e)}`,
         {
          method: 'GET',
          headers: {
            'X-API-KEY': config[chainId].opensea_api_key,
          },
        }
      );
      const body = await response.json();
      const card = await buildCard(body);
      list.appendChild(card);
    });
  }
  */
//New code here
  if (v2) {
  const options = {
    method: 'GET',
    headers: {
      accept: 'application/json',
      'x-api-key': config[chainId].opensea_api_key,
    },
  };

  v2.forEach(async (e) => {
    itemIds.push(e);
    const url = `${config[chainId].opensea_api}/api/v2/chain/ethereum/contract/${config[chainId].migration_address}/nfts/${Web3.utils.toBN(e)}`; // Define URL here
    console.log("Constructed URL_v2_Stake:", url);
    console.log("Headers:", options.headers); // Logging headers to check if the API key is included
    const response = await fetch(url, options); // Use the URL here
    console.log("Response:", response);
    const body = await response.json();
    const card = await buildCard(body);
    list.appendChild(card);
  });
}

  /*
  try {
  const response = await fetch(url, options);
  const body = await response.json(); // This is where body is defined
 // Log the entire body object to inspect its structure
  console.log("API Response Body:", body);
  // Log the NFT image URL and append to list
//  console.log("NFT Image URL:", e.nft.image_url); 
  list.appendChild(buildCard(body, true));*/

  const rewardsView = document.getElementById('claimableRewardsTxt');
  const rewards = await getClaimableRewards(address, c);
  rewardsView.textContent = `${formatEther(rewards)} $FOSSIL`;
}

/*async function buildCard(e) {
  console.log('API Response:', e);
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
  //image.src = e.image_thumbnail_url;
  image.crossOrigin = 'anonymous';
  image.style.width = '100%';
  image.classList = 'card-img-top';
  imageContainer.appendChild(image);
  const bodyDiv = document.createElement('div');
  bodyDiv.classList = 'card-body';
  const nameDiv = document.createElement('h5');
  nameDiv.classList.add('card-title');
  nameDiv.textContent = e.name;*/
async function buildCard(e) {
  console.log('API Response:', e); // Log the API response to check its structure and properties
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
  console.log('Image URL_buildcard:', e.nft.image_url); // Log the image URL to check if it's defined
 /* const image = document.createElement('img');
  image.src = e.nft.image_url;*/
  //--
  const image = document.createElement('img');
console.log("Created image element:", image); // Log the created image element
image.src = e.nft.image_url;
console.log("Image source URL:", e.nft.image_url); // Log the image source URL
//--
  image.crossOrigin = 'anonymous';
  image.style.width = '100%';
  image.classList = 'card-img-top';
  imageContainer.appendChild(image);
  const bodyDiv = document.createElement('div');
  bodyDiv.classList = 'card-body';
  const nameDiv = document.createElement('h5');
  nameDiv.classList.add('card-title');
  console.log('Name:', e.name); // Log the name property to check if it's defined
  nameDiv.textContent = e.name;


 /* const web3 = await loadWeb3();
  const chainId = await web3.eth.getChainId();
  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
  const isClaimed = await vxc.methods.isGenesisMinted([e.token_id]).call({});
  const claimVxBtn = document.createElement('button');
  const contentClaimVx = document.createElement('span');
  const loaderClaimVx = document.createElement('img');*/
  
  console.log("Loading web3...");
const web3 = await loadWeb3();
console.log("Web3 loaded:", web3); // Log the loaded web3 object

console.log("Getting chain ID...");
const chainId = await web3.eth.getChainId();
console.log("Chain ID:", chainId); // Log the obtained chain ID

console.log("Creating contract instance c...");
const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
console.log("Contract instance c:", c); // Log the created contract instance c

console.log("Creating contract instance vxc...");
const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
console.log("Contract instance vxc:", vxc); // Log the created contract instance vxc

console.log("Checking if genesis minted...");
const isClaimed = await vxc.methods.isGenesisMinted([e.token_id]).call({});
console.log("Is genesis minted:", isClaimed); // Log the result of checking if genesis is minted

console.log("Creating claim button...");
const claimVxBtn = document.createElement('button');
console.log("Claim button created:", claimVxBtn); // Log the created claim button

console.log("Creating content span...");
const contentClaimVx = document.createElement('span');
console.log("Content span created:", contentClaimVx); // Log the created content span

console.log("Creating loader image...");
const loaderClaimVx = document.createElement('img');
console.log("Loader image created:", loaderClaimVx); // Log the created loader image

/*  loaderClaimVx.width = '24';
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
  }*/
  console.log("Setting content text for claim button...");
contentClaimVx.textContent = 'Claim Voxel';
console.log("Content text set for claim button:", contentClaimVx.textContent);

console.log("Appending loader image to claim button...");
claimVxBtn.appendChild(loaderClaimVx);
console.log("Loader image appended to claim button");

console.log("Appending content span to claim button...");
claimVxBtn.appendChild(contentClaimVx);
console.log("Content span appended to claim button");

console.log("Checking if voxel is claimed...");
if (isClaimed[0]) {
  console.log("Voxel is claimed. Disabling claim button and setting content text to 'Claimed'");
  claimVxBtn.classList = 'btn btn-disabled w-100';
  claimVxBtn.disabled = true;
  contentClaimVx.textContent = 'Claimed';
} else {
  console.log("Voxel is not claimed. Enabling claim button and setting content text to 'Claim Voxel'");
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

/*async function checkClaimableRewards() {
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
}*/
async function checkClaimableRewards() {
  console.log("Fetching web3 instance...");
  const web3 = await loadWeb3();
  console.log("Web3 instance fetched:", web3);

  console.log("Fetching chain ID...");
  const chainId = await web3.eth.getChainId();
  console.log("Chain ID fetched:", chainId);

  console.log("Creating contract instance for migration address...");
  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  console.log("Contract instance created:", c);

  console.log("Creating contract instance for VX address...");
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);
  console.log("VX contract instance created:", vxc);

  console.log("Fetching REX ID input element...");
  const rexIdInput = document.getElementById('rexId');
  console.log("REX ID input element fetched:", rexIdInput);

  console.log("Fetching token ID from token ID map based on REX ID input...");
  const tokenId = tokenIdMap[rexIdInput.value];
  console.log("Token ID fetched:", tokenId);

  console.log("Checking if voxel is minted...");
  const isMinted = await vxc.methods.isGenesisMinted([tokenId]).call({});
  console.log("Is voxel minted:", isMinted);

  console.log("Updating text content for VX claim status...");
  const txtIsVXClaimed = document.getElementById('txtIsVXClaimed');
  const containerIsVXClaimed = document.getElementById('containerIsVXClaimed');
  if (isMinted[0]) {
    txtIsVXClaimed.textContent = 'Voxel Claimed';
  } else {
    txtIsVXClaimed.textContent = 'Voxel Unclaimed';
  }

  console.log("Fetching rewards for the token ID...");
  return await c.methods.rewards([tokenId]).call({});
}

