import Web3 from "web3";
import os from "./contracts/ERC1155Test.json";
import ct from "./contracts/CryptoTrex.json";
import {config} from "./config";

function loadWeb3() {
  const eth = window.ethereum;
  if (eth) {
    const web3 = new Web3(eth);
    try {
      eth
        .request({ method: "eth_requestAccounts" })
        .then((result) => {
          console.log(result);
        })
        .catch((error) => {
          const d = document.getElementById("dialog-connect");
          d.addEventListener("click", load);
          d.showModal();
        });
      eth.on("accountsChanged", async (accounts) => {
        // if account changed from metamask, or first time logging in
        if (accounts.length < 1) {
          return;
        }
        const address = accounts[0];
        const approved = await isApproved(web3, address);
        if(approved) {
          await renderItems(address);
        } else {
          await renderApprovalPrompt();
        }
      });
      eth.on("chainChanged", () => {
        window.location.reload();
      });
    } catch (err) {
      console.log(err);
    }

    return web3;
  }
  return new Web3(Web3.givenProvider || "ws://localhost:7545");
}

async function switchChain(web3) {
  try {
    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
    const wasAdded = await web3.request({
      method: "wallet_switchEthereumChain",
      params: [
        {
          chainId: "0x1",
        },
      ],
    });
  } catch (error) {
    console.log(error);
  }
}

async function web3Address(web3) {
  const addr = await web3.eth.getAccounts();
  if (addr.length < 1) {
    return;
  }
  return addr[0];
}

async function batchMigrate(ids) {
  const web3 = loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  let tokenIds = [];
  ids.forEach((id) => {
    tokenIds.push(web3.utils.toBN(id));
  });
  if(tokenIds.length < 1) return;
  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  const batchMigrateBtn = document.getElementById("batchMigrateBtn");
  c.methods.migrateBatch(tokenIds)
           .send({ from: address })
           .on("receipt", ()=>{
              batchMigrateBtn.disabled = true;
              batchMigrateBtn.textContent = "Migrated";
              batchMigrateBtn.classList = "nes-btn is-success";
           })
           .on("transactionHash", ()=>{
              batchMigrateBtn.textContent = "Migrating...";
              batchMigrateBtn.classList = "nes-btn";
           })
           .on("error", ()=>{
              batchMigrateBtn.disabled = true;
              batchMigrateBtn.textContent = "Failed";
              batchMigrateBtn.classList = "nes-btn is-error";
           })
}

async function isApproved(web3, address) {
  const chainId = await web3.eth.getChainId();
  const osc = new web3.eth.Contract(os.abi, config[chainId].origin_address);
  return await osc.methods
    .isApprovedForAll(address, config[chainId].migration_address)
    .call({ from: address });
}

async function approve() {
  const web3 = loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const osc = new web3.eth.Contract(os.abi, config[chainId].origin_address);
  osc.methods
    .setApprovalForAll(config[chainId].migration_address, true)
    .send({ from: address })
    .on("receipt", () => {
      const approveBtn = document.getElementById("approveBtn");
      approveBtn.textContent = "Approved";
      approveBtn.disabled = true;
      approveBtn.classList = "nes-btn is-success is-disabled";
      renderItems(address);
    })
    .on("transactionHash", hash=>{
      const container = document.getElementById("approvalContainer");
      const viewTx = document.createElement("a");
      viewTx.classList = "nes-btn";
      viewTx.href = `https://etherscan.io/tx/${hash}`;
      viewTx.target = "_blank";
      viewTx.text = "View Transaction";
      container.appendChild(viewTx);

      const approveBtn = document.getElementById("approveBtn");
      approveBtn.textContent = "Approving...";
      approveBtn.disabled = true;
      approveBtn.classList = "nes-btn is-primary is-disabled";
    });
}

async function migrate(id, btn) {
  const web3 = loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const tokenId = web3.utils.toBN(id);

  const c = new web3.eth.Contract(ct.abi, config[chainId].migration_address);
  c.methods.migrate(tokenId)
           .send({ from: address })
           .on("receipt", ()=>{
              btn.disabled = true;
              btn.classList = "nes-btn is-success";
              btn.textContent = "Migrated";
           })
           .on("transactionHash", hash=>{
             btn.textContent = "Migrating...";
             btn.addEventListener('click', ()=>{
                window.open(`https://etherscan.io/tx/${hash}`, '_blank').focus();
             });
           })
           .on("error", ()=>{
              btn.disabled = true;
              btn.textContent = "Failed";
              btn.classList = "nes-btn is-error";
           })
}

async function addToken(eth) {
  const web3 = loadWeb3();
  const chainId = await web3.eth.getChainId();

  const tokenAddress = config[chainId].token_address;
  const tokenSymbol = "FOSSIL";
  const tokenDecimals = 18;
  const tokenImage = "https://gateway.pinata.cloud/ipfs/QmZpPpnuASN7riY1UwVftSMowJAgMbf9x1k9pCaH5buSEQ";

  try {
    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
    await eth.request({
      method: "wallet_watchAsset",
      params: {
        type: "ERC20", // Initially only supports ERC20, but eventually more!
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

async function getV1Items(address, opensea, oldCollection) {
  const url = `${opensea}/api/v1/assets?offset=0&limit=50&collection=${oldCollection}&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}

async function getV2Items(address, opensea, newCollection) {
  const url = `${opensea}/api/v1/assets?offset=0&limit=50&collection=${newCollection}&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}

async function renderApprovalPrompt() {
  const apprView = document.getElementById("approvalView");
  const migrView = document.getElementById("migrationView");
  apprView.hidden = false;
  migrView.hidden = true;
}
async function renderItems(address) {
  const apprView = document.getElementById("approvalView");
  const migrView = document.getElementById("migrationView");
  apprView.hidden = true;
  migrView.hidden = false;
  const web3 = loadWeb3();
  const chainId = await web3.eth.getChainId();
  const v1 = await getV1Items(address, config[chainId].opensea_api, config[chainId].old_collection);
  const v2 = await getV2Items(address, config[chainId].opensea_api, config[chainId].new_collection);

  const list = document.querySelector("#card-list");
  console.log(web3.currentProvider.isMetaMask);
  if(web3.currentProvider.isMetaMask) {
    const addTokenBtn = document.getElementById("addTokenBtn");
    addTokenBtn.hidden = false;
  }

  if (v1.length < 1) {
    const batchMigrateBtn = document.getElementById("batchMigrateBtn");
    batchMigrateBtn.textContent = "Nothing to migrate";
    batchMigrateBtn.classList = "nes-btn is-disabled";
    batchMigrateBtn.disabled = true;
  }

  if (v1) {
    const c = new web3.eth.Contract(os.abi, config[chainId].origin_address);
    v1.forEach(async (e) => {
      itemIds.push(e.token_id);
      const balance = await c.methods.balanceOf(address, e.token_id)
               .call({ from: address });
      const migrated = balance && balance < 1;
      list.appendChild(buildCard(e, migrated));
    });
  }

  if (v2) {
    v2.forEach((e) => {
      list.appendChild(buildCard(e, true));
    });
  }l
}

function buildCard(e, migrated) {
  const card = document.createElement("div");
  card.classList = "nes-container item-card is-rounded";
  card.style = "background-color: white; display: block;";
  const imageContainer = document.createElement("a");
  imageContainer.classList = "nes-container is-rounded";
  imageContainer.href = e.permalink;
  imageContainer.target = "_blank";
  imageContainer.style =
    "background-color: white; padding: 0px !important; display: flex; justify-content: center";
  const image = document.createElement("img");
  image.src = e.image_thumbnail_url;
  image.crossOrigin = "anonymous";
  image.style.width = "100%";
  imageContainer.appendChild(image);
  const nameDiv = document.createElement("p");
  nameDiv.classList.add("pt-1");
  nameDiv.textContent = e.name;
  const migrateBtn = document.createElement("button");
  migrateBtn.type = "button";

  if (!migrated) {
    migrateBtn.classList = "nes-btn";
    migrateBtn.textContent = "Migrate";
  } else {
    migrateBtn.classList = "nes-btn is-disabled";
    migrateBtn.disabled = true;
    migrateBtn.textContent = "Migrated";
  }
  migrateBtn.style = "width: 100%";
  migrateBtn.addEventListener("click", () => migrate(e.token_id, migrateBtn));
  card.appendChild(imageContainer);
  card.appendChild(nameDiv);
  card.appendChild(migrateBtn);

  const cardContainer = document.createElement("div");
  cardContainer.classList.add("col-md-3", "col-xs-6", "pb-1");
  cardContainer.appendChild(card);

  return cardContainer;
}

const batchMigrateBtn = document.getElementById("batchMigrateBtn");
batchMigrateBtn.addEventListener("click", async () => {
  await batchMigrate(itemIds);
});

async function load() {
  const web3 = loadWeb3();
  const address = await web3Address(web3);
  if (!address) {
    return;
  }
  // await switchChain(window.ethereum);
  const approved = await isApproved(web3, address);
  if(approved) {
    await renderItems(address);
  } else {
    await renderApprovalPrompt();
  }
}

window.onload = load;

const addTokenBtn = document.getElementById("addTokenBtn");
addTokenBtn.addEventListener("click", async () => {
  await addToken(window.ethereum);
});

const approveBtn = document.getElementById("approveBtn");
approveBtn.addEventListener("click", async () => {
  await approve();
});
