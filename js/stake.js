import cryptotrex from './contracts/CryptoTrex.json';
import staking from './contracts/Staking.json';
import { config } from './config';
import { loadWeb3, web3Address, switchChain } from './web3.js';
import { createClient } from 'urql';

async function render(address, web3) {
  const approved = await isApproved(web3, address);
  if (approved) {
    await renderItems(address, web3);
  } else {
    await renderApprovalPrompt();
  }
}

async function getStakedRexes(api, address) {
  const client = createClient({
    url: api,
  });
  return await client
    .query(
      `query {
    users(where: {id: "${address.toLowerCase()}"}) {
        id
        tokens {
            id
        }
    }
    previousOwners(where: {id: "${address.toLowerCase()}"}) {
        id
        tokens {
            id
            owner {
              id
            }
        }
    }
  }`,
    )
    .toPromise();
}

async function getClaimableRewards(web3, address, stakedRexes, unstakedRexes) {
  const chainId = await web3.eth.getChainId();
  const ids = [];
  stakedRexes.tokens.map((e) => {
    if (e.owner.id === config[chainId].staking_address.toLowerCase()) {
      ids.push(e.id);
    }
  });
  unstakedRexes.tokens.map((e) => {
    ids.push(e.id);
  });
  console.log(ids);
  const osc = new web3.eth.Contract(
    staking.abi,
    config[chainId].staking_address,
  );
  return await osc.methods.rewards(ids).call({ from: address });
}

async function isApproved(web3, address) {
  const chainId = await web3.eth.getChainId();
  const osc = new web3.eth.Contract(
    cryptotrex.abi,
    config[chainId].migration_address,
  );
  return await osc.methods
    .isApprovedForAll(address, config[chainId].staking_address)
    .call({ from: address });
}

async function approve() {
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const osc = new web3.eth.Contract(
    cryptotrex.abi,
    config[chainId].migration_address,
  );
  osc.methods
    .setApprovalForAll(config[chainId].staking_address, true)
    .send({ from: address })
    .on('receipt', () => {
      const approveBtn = document.getElementById('approveBtn');
      approveBtn.textContent = 'Approved';
      approveBtn.disabled = true;
      approveBtn.classList = 'nes-btn is-success is-disabled';
      renderItems(address, web3);
    })
    .on('transactionHash', (hash) => {
      const container = document.getElementById('approvalContainer');
      const viewTx = document.createElement('a');
      viewTx.classList = 'nes-btn';
      viewTx.href = `https://etherscan.io/tx/${hash}`;
      viewTx.target = '_blank';
      viewTx.text = 'View Transaction';
      container.appendChild(viewTx);

      const approveBtn = document.getElementById('approveBtn');
      approveBtn.textContent = 'Approving...';
      approveBtn.disabled = true;
      approveBtn.classList = 'nes-btn is-primary';
    });
}

async function stake(id, btn) {
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const tokenId = web3.utils.toBN(id);

  const c = new web3.eth.Contract(staking.abi, config[chainId].staking_address);
  c.methods
    .stake(tokenId)
    .send({ from: address })
    .on('receipt', () => {
      btn.disabled = true;
      btn.classList = 'nes-btn is-success';
      btn.textContent = 'Staked';
    })
    .on('transactionHash', (hash) => {
      btn.textContent = 'Staking...';
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

async function unstake(id, btn) {
  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const tokenId = web3.utils.toBN(id);

  const c = new web3.eth.Contract(staking.abi, config[chainId].staking_address);
  c.methods
    .unstake(tokenId)
    .send({ from: address })
    .on('receipt', () => {
      btn.disabled = true;
      btn.classList = 'nes-btn is-success';
      btn.textContent = 'Unstaked';
    })
    .on('transactionHash', (hash) => {
      btn.textContent = 'Unstaking...';
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

async function getV2Items(address, opensea, newCollection) {
  const url = `${opensea}/api/v1/assets?offset=0&limit=50&collection=${newCollection}&owner=${address}`;
  const res = await fetch(url);
  const body = await res.json();
  return body.assets;
}

async function renderApprovalPrompt() {
  const apprView = document.getElementById('approvalView');
  const migrView = document.getElementById('migrationView');
  apprView.hidden = false;
  migrView.hidden = true;

  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const v2 = await getV2Items(
    address,
    config[chainId].opensea_api,
    config[chainId].old_collection,
  );

  if (v2.length < 1) {
    const warning = document.getElementById('warningNoTrex');
    warning.hidden = false;
  }
}

async function renderItems(address, web3) {
  try {
    const apprView = document.getElementById('approvalView');
    const stkView = document.getElementById('stakingView');
    apprView.hidden = true;
    stkView.hidden = false;

    const chainId = await web3.eth.getChainId();
    const rexes = await getStakedRexes(config[chainId].subgraph_api, address);
    const rewards = await getClaimableRewards(
      web3,
      address,
      rexes.data.previousOwners[0],
      rexes.data.users[0],
    );
    const claimableRewardsTxt = document.getElementById('claimableRewardsTxt');
    claimableRewardsTxt.textContent = `${web3.utils.fromWei(
      rewards,
      'ether',
    )} $FOSSIL`;

    const list = document.querySelector('#card-list');
    if (web3.currentProvider.isMetaMask) {
      const addTokenBtn = document.getElementById('addTokenBtn');
      addTokenBtn.hidden = false;
    }

    if (rexes.data.users) {
      rexes.data.users[0].tokens.forEach((e) => {
        list.appendChild(
          buildCard(
            {
              token_id: e.id,
            },
            false,
          ),
        );
      });
    }
    if (rexes.data.previousOwners) {
      rexes.data.previousOwners[0].tokens.forEach((e) => {
        console.log(
          e.owner.id,
          config[chainId].staking_address.toLowerCase(),
          e.owner.id === config[chainId].staking_address.toLowerCase(),
        );
        if (e.owner.id === config[chainId].staking_address.toLowerCase()) {
          list.appendChild(
            buildCard(
              {
                token_id: e.id,
              },
              true,
            ),
          );
        }
      });
    }
  } catch (err) {
    console.log(err);
  }
}

function buildCard(e, staked) {
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
  const migrateBtn = document.createElement('button');
  migrateBtn.type = 'button';

  if (!staked) {
    migrateBtn.classList = 'nes-btn';
    migrateBtn.textContent = 'Stake';
    migrateBtn.addEventListener('click', () => stake(e.token_id, migrateBtn));
  } else {
    migrateBtn.classList = 'nes-btn';
    migrateBtn.textContent = 'Unstake';
    migrateBtn.addEventListener('click', () => unstake(e.token_id, migrateBtn));
  }
  migrateBtn.style = 'width: 100%';
  card.appendChild(imageContainer);
  card.appendChild(nameDiv);
  card.appendChild(migrateBtn);

  const cardContainer = document.createElement('div');
  cardContainer.classList.add('col-md-3', 'col-xs-6', 'pb-1');
  cardContainer.appendChild(card);

  return cardContainer;
}

window.onload = async () => {
  try {
    const web3 = await loadWeb3();
    const address = await web3Address(web3);
    // switchChain(window.ethereum);
    render(address, web3);
  } catch (err) {
    console.log(err);
  }
};

const addTokenBtn = document.getElementById('addTokenBtn');
addTokenBtn.addEventListener('click', async () => {
  await addToken(window.ethereum);
});

const approveBtn = document.getElementById('approveBtn');
approveBtn.addEventListener('click', async () => {
  await approve();
});
