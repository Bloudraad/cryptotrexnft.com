import Web3 from "web3";
import os from "./contracts/ERC1155Test.json";
import ct from "./contracts/CryptoTrex.json";


const v1 = '0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656'; //move to env
const ms = '0x079438b0274eBf1d6D9be4627c68387e6E2119c0';
const ta = '0x2CB81e6B9acaB06e208F48F71D4D5d9bd29574ce';

function loadWeb3() {
    const eth = window.ethereum;
    if (eth) {
        const web3 = new Web3(eth);
        eth.enable();
        eth.on('accountsChanged', (accounts) => {
            // if account changed from metamask, or first time logging in
            if (accounts.length < 1) {
                return;
            }
            const address = accounts[0];
            console.log(address);
        });
        eth.on('chainChanged', () => {
            window.location.reload();
        });

        return web3;
    }
    return new Web3(Web3.givenProvider || 'ws://localhost:7545');
}

async function switchChain(web3) {
    try {
        // wasAdded is a boolean. Like any RPC method, an error may be thrown.
        const wasAdded = await web3.request({
            method: 'wallet_switchEthereumChain',
            params: [{
                chainId: "0x1",
            }],
        });

        if (wasAdded) {
            console.log('Thanks for your interest!');
        } else {
            console.log('Your loss!');
        }
    } catch (error) {
        console.log(error);
    }
}

async function web3Address(web3) {
  const addr = await web3.eth.getAccounts();
  if (addr < 1) {
    return '';
  }
  return addr[0];
}

async function batchMigrate(ids) {
    const web3 = loadWeb3();
    const address = await web3Address(web3);
    let tokenIds = [];
    ids.forEach(id => {
        tokenIds.push(web3.utils.toBN(id));
    });
    console.log(tokenIds, ids);
    
    const osc = new web3.eth.Contract(os.abi, v1);
    osc.methods.isApprovedForAll(address, ms).call({from: address}).then(result=>{
        const c = new web3.eth.Contract(ct.abi, ms);
        if(result) {
            c.methods.migrateBatch(tokenIds).send({from: address})
                .on('receipt', console.log)
                .on('transactionHash', console.log);
        } else {
            osc.methods.setApprovalForAll(ms, true).send({from:address})
            .on('receipt', ()=>{
                c.methods.migrateBatch(tokenIds).send({from: address})
                    .on('receipt', console.log)
                    .on('transactionHash', console.log);
            })
            .on('transactionHash', console.log);
        }
    });
    

}

async function migrate(id) {
    const web3 = loadWeb3();
    const address = await web3Address(web3);
    const tokenId = web3.utils.toBN(id);
    
    const osc = new web3.eth.Contract(os.abi, v1);
    osc.methods.isApprovedForAll(address, ms).call({from: address}).then(result=>{
        const c = new web3.eth.Contract(ct.abi, ms);
        if(result) {
            c.methods.migrate(tokenId).send({from: address})
                .on('receipt', console.log)
                .on('transactionHash', console.log);
        } else {
            osc.methods.setApprovalForAll(ms, true).send({from:address})
            .on('receipt', ()=>{
              c.methods.migrate(tokenId).send({from: address})
                .on('receipt', console.log)
                .on('transactionHash', console.log);
            })
            .on('transactionHash', console.log);
        }
    });
    
    return;
}

async function addToken(web3) {
    const tokenAddress = ta;
    const tokenSymbol = 'FOSSIL';
    const tokenDecimals = 18;
    const tokenImage = 'http://placekitten.com/200/300';

    try {
        // wasAdded is a boolean. Like any RPC method, an error may be thrown.
        const wasAdded = await web3.request({
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

        if (wasAdded) {
            console.log('Thanks for your interest!');
        } else {
            console.log('Your loss!');
        }
    } catch (error) {
        console.log(error);
    }
}
let itemIds = [];
async function renderItems(address) {
    const opensea = 'https://testnets-api.opensea.io'; // move to env
    const v1 = '0x88b48f654c30e99bc2e4a1559b4dcf1ad93fa656'; //move to env
    const url = `${opensea}/api/v1/assets?offset=0&limit=5&asset_contract_address=${v1}&collection=cryptotrex-old&owner=${address}`;
    const res = await fetch(url);
    const body = await res.json();

    const list = document.querySelector('#card-list');

    if(body.assets.length < 1) {
        const batchMigrateBtn = document.getElementById("batchMigrateBtn");
        batchMigrateBtn.textContent = "Nothing to migrate";
        batchMigrateBtn.classList = "nes-btn is-disabled";
        batchMigrateBtn.disabled = true;
        return;
    }

    body.assets.forEach(e => {
        itemIds.push(e.token_id);

        const card = document.createElement('div');
        card.classList = "nes-container is-rounded";
        card.style = "background-color: white; display: block;";
        const imageContainer = document.createElement('div');
        imageContainer.classList = "nes-container is-rounded";
        imageContainer.style = "background-color: white; padding: 0px !important; display: flex; justify-content: center";
        const image = document.createElement('img');
        image.src = e.image_thumbnail_url;
        image.crossOrigin = "anonymous";
        imageContainer.appendChild(image);
        const nameDiv = document.createElement('div');
        const nameTxt = document.createElement('span');
        nameTxt.textContent = e.name;
        nameDiv.appendChild(nameTxt);
        const migrateBtn = document.createElement('button');
        migrateBtn.type = "button";
        migrateBtn.classList = "nes-btn";
        migrateBtn.style = "width: 100%";
        migrateBtn.textContent = "Migrate";
        migrateBtn.addEventListener("click", ()=>migrate(e.token_id));
        card.appendChild(imageContainer);
        card.appendChild(nameDiv);
        card.appendChild(migrateBtn);

        // Add element to list
        list.appendChild(card)
    })
}
// document.addEventListener('load', renderItems);

const batchMigrateBtn = document.getElementById("batchMigrateBtn");
batchMigrateBtn.addEventListener("click", async () => {
    console.log(itemIds);
    await batchMigrate(itemIds);
});

const connectBtn = document.getElementById("migrate-connect");
connectBtn.addEventListener("click", async () => {
  const web3 = loadWeb3();
  const address = await web3Address(web3);
  await renderItems(address);
});

const web3 = loadWeb3();
web3Address(web3).then(async address=>{
    await switchChain(window.ethereum);
    await renderItems(address);
});

const addTokenBtn = document.getElementById("addTokenBtn");
addTokenBtn.addEventListener("click", async () => {
    await addToken(window.ethereum);
})