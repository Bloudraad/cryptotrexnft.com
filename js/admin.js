import os from './contracts/ERC1155Test.json';
import ct from './contracts/CryptoTrex.json';
import vx from './contracts/CryptoTrexVX.json';
import t from './contracts/Fossil.json';
import { config } from './config';
import { loadWeb3, web3Address, switchChain } from './web3.js';
import Web3 from 'web3';
import { tokenIdMap } from './map';

window.onload = async () => {
  const setPause = document.getElementById('setPause');
  const setStartStakingTimestamp = document.getElementById(
    'setStartStakingTimestamp',
  );
  const setFossilPrice = document.getElementById('setFossilPrice');
  const setStartStaking = document.getElementById('setStartStaking');
  const setTokenURI = document.getElementById('setTokenURI');
  const getTokenURI = document.getElementById('getTokenURI');

  const web3 = await loadWeb3();
  const address = await web3Address(web3);
  const chainId = await web3.eth.getChainId();
  const tc = new web3.eth.Contract(t.abi, config[chainId].token_address);
  const vxc = new web3.eth.Contract(vx.abi, config[chainId].vx_address);

  setPause.addEventListener('click', async () => {
    vxc.methods
      .setPause('COMMON_PAUSE', false)
      .send({ from: address })
      .on('receipt', console.log)
      .on('transactionHash', console.log)
      .on('error', console.log);
  });
  setStartStakingTimestamp.addEventListener('click', async () => {
    vxc.methods
      .setStakingStartTimestamp()
      .send({ from: address })
      .on('receipt', console.log)
      .on('transactionHash', console.log)
      .on('error', console.log);
  });
  setFossilPrice.addEventListener('click', async () => {
    vxc.methods
      .setFossilPrice(Web3.utils.toWei(Web3.utils.toBN('70'), 'ether'))
      .send({ from: address })
      .on('receipt', console.log)
      .on('transactionHash', console.log)
      .on('error', console.log);
  });
  setStartStaking.addEventListener('click', async () => {
    vxc.methods
      .setStakingStatus(true)
      .send({ from: address })
      .on('receipt', console.log)
      .on('transactionHash', console.log)
      .on('error', console.log);
  });
  setTokenURI.addEventListener('click', async () => {
    vxc.methods
      .setTokenURI('https://storage.googleapis.com/cryptotrexnft/vxmetadata')
      .send({ from: address })
      .on('receipt', console.log)
      .on('transactionHash', console.log)
      .on('error', console.log);
  });
  getTokenURI.addEventListener('click', async () => {
    const uri = await vxc.methods.fossilPrice().call({});
    console.log(uri);
  });
};
