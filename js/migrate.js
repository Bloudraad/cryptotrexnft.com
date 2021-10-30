import Web3 from "web3";
import os from "./contracts/ERC1155Test.json";
import ct from "./contracts/CryptoTrex.json";

const v1 = process.env.V1;
const ms = process.env.MS;
const ta = process.env.TA;

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
        await renderItems(address);
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

    if (wasAdded) {
      console.log("Thanks for your interest!");
    } else {
      console.log("Your loss!");
    }
  } catch (error) {
    console.log(error);
  }
}

async function web3Address(web3) {
  const addr = await web3.eth.getAccounts();
  if (addr < 1) {
    return "";
  }
  return addr[0];
}

async function batchMigrate(ids) {
  const web3 = loadWeb3();
  const address = await web3Address(web3);
  let tokenIds = [];
  ids.forEach((id) => {
    tokenIds.push(web3.utils.toBN(id));
  });
  console.log(tokenIds, ids);

  const osc = new web3.eth.Contract(os.abi, v1);
  osc.methods
    .isApprovedForAll(address, ms)
    .call({ from: address })
    .then((result) => {
      const c = new web3.eth.Contract(ct.abi, ms);
      if (result) {
        c.methods
          .migrateBatch(tokenIds)
          .send({ from: address })
          .on("receipt", console.log)
          .on("transactionHash", console.log);
      } else {
        osc.methods
          .setApprovalForAll(ms, true)
          .send({ from: address })
          .on("receipt", () => {
            c.methods
              .migrateBatch(tokenIds)
              .send({ from: address })
              .on("receipt", console.log)
              .on("transactionHash", console.log);
          })
          .on("transactionHash", console.log);
      }
    });
}

async function migrate(id) {
  const web3 = loadWeb3();
  const address = await web3Address(web3);
  const tokenId = web3.utils.toBN(id);

  const osc = new web3.eth.Contract(os.abi, v1);
  osc.methods
    .isApprovedForAll(address, ms)
    .call({ from: address })
    .then((result) => {
      const c = new web3.eth.Contract(ct.abi, ms);
      if (result) {
        c.methods
          .migrate(tokenId)
          .send({ from: address })
          .on("receipt", console.log)
          .on("transactionHash", console.log);
      } else {
        osc.methods
          .setApprovalForAll(ms, true)
          .send({ from: address })
          .on("receipt", () => {
            c.methods
              .migrate(tokenId)
              .send({ from: address })
              .on("receipt", console.log)
              .on("transactionHash", console.log);
          })
          .on("transactionHash", console.log);
      }
    });

  return;
}

async function addToken(web3) {
  const tokenAddress = ta;
  const tokenSymbol = "FOSSIL";
  const tokenDecimals = 18;
  const tokenImage = "http://placekitten.com/200/300";

  try {
    // wasAdded is a boolean. Like any RPC method, an error may be thrown.
    const wasAdded = await web3.request({
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

    if (wasAdded) {
      console.log("Thanks for your interest!");
    } else {
      console.log("Your loss!");
    }
  } catch (error) {
    console.log(error);
  }
}
let itemIds = [];

const opensea = process.env.OPENSEA;
async function getV1Items(address) {
  const url = `${opensea}/api/v1/assets?offset=0&limit=5&collection=cryptotrex-old&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}

async function getV2Items(address) {
  const url = `${opensea}/api/v1/assets?offset=0&limit=5&collection=crypto-trex-2vztzui7gn&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}
async function renderItems(address) {
  const v1 = await getV1Items(address);
  const v2 = await getV2Items(address);
  console.log(v2);

  const list = document.querySelector("#card-list");

  if (v1.length < 1) {
    const batchMigrateBtn = document.getElementById("batchMigrateBtn");
    batchMigrateBtn.textContent = "Nothing to migrate";
    batchMigrateBtn.classList = "nes-btn is-disabled";
    batchMigrateBtn.disabled = true;
  }

  if (v1) {
    v1.forEach((e) => {
      list.appendChild(buildCard(e, false));
    });
  }

  if (v2) {
    v2.forEach((e) => {
      console.log(e);
      list.appendChild(buildCard(e, true));
    });
  }
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
  migrateBtn.addEventListener("click", () => migrate(e.token_id));
  card.appendChild(imageContainer);
  card.appendChild(nameDiv);
  card.appendChild(migrateBtn);

  const cardContainer = document.createElement("div");
  cardContainer.classList.add("col-md-3", "col-xs-6", "pb-1");
  cardContainer.appendChild(card);

  return cardContainer;
}
// document.addEventListener('load', renderItems);

const batchMigrateBtn = document.getElementById("batchMigrateBtn");
batchMigrateBtn.addEventListener("click", async () => {
  await batchMigrate(itemIds);
});

async function load() {
  const web3 = loadWeb3();
  const address = await web3Address(web3);
  if (address === "") {
    return;
  }
  await switchChain(window.ethereum);
  await renderItems(address);
}

window.onload = load;

const addTokenBtn = document.getElementById("addTokenBtn");
addTokenBtn.addEventListener("click", async () => {
  await addToken(window.ethereum);
});
