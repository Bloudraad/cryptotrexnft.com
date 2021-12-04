import f from './contracts/Fossil.json';
import { config } from './config';
import { loadWeb3, web3Address, switchChain } from './web3.js';
import Web3 from 'web3';

async function airdrop(address, c) {
  const address_field = document.getElementById('address_field');
  const amount_field = document.getElementById('amount_field');
  c.methods
    .mint(address_field.value, Web3.utils.toWei(amount_field.value, 'ether'))
    .send({ from: address })
    .on('receipt', console.log)
    .on('transactionHash', console.log)
    .on('error', console.log);
}

window.onload = async () => {
  try {
    const web3 = await loadWeb3();
    const address = await web3Address(web3);
    const chainId = await web3.eth.getChainId();
    const c = new web3.eth.Contract(f.abi, config[chainId].token_address);

    const airdropBtn = document.getElementById('airdropBtn');
    airdropBtn.addEventListener('click', async () => await airdrop(address, c));
  } catch (err) {
    console.log(err);
  }
};
