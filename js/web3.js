import Web3 from 'web3';
import WalletConnectProvider from "@walletconnect/web3-provider";

export async function initWalletConnect() {
  const provider = new WalletConnectProvider({
    infuraId: "12510dc2ead94232be19488797cf2955",
    qrcodeModalOptions: {
      mobileLinks: [
        "rainbow",
        "metamask",
        "argent",
        "trust",
        "imtoken",
        "pillar",
      ],
    },
  });
  await provider.enable().catch(()=>{
      throw "rejected";
  });
  const web3 = new Web3(provider);
  return web3;
}

export async function initWeb3() {
  const web3 = new Web3(eth);
  await eth.request({ method: 'eth_requestAccounts' })
  providerCallback(eth, web3);
  return web3;
}

export function providerCallback(provider, web3) {
  provider.on("accountsChanged", async (accounts) => {
    if (accounts.length < 1) {
      return;
    }
    const address = accounts[0];
    const approved = await isApproved(web3, address);
    if (approved) {
      await renderItems(address, web3);
    } else {
      await renderApprovalPrompt();
    }
  });

  provider.onConnect = async () => {
    console.log('connected');
    const address = await web3Address(web3);
    if (!address) {
      return;
    }
    const approved = await isApproved(web3, address);
    if (approved) {
      await renderItems(address, web3);
    } else {
      await renderApprovalPrompt();
    }
  }

  provider.on("chainChanged", (chainId) => {
    window.location.reload();
  });

  provider.on("connect", async () => {
    console.log('connected');
    const address = await web3Address(web3);
    if (!address) {
      return;
    }
    const approved = await isApproved(web3, address);
    if (approved) {
      await renderItems(address, web3);
    } else {
      await renderApprovalPrompt();
    }
  });

  provider.on("disconnect", (code, reason) => {
    callback();
  });
}

export async function loadWeb3() {
  const eth = window.ethereum;
  if (eth) {
    await switchChain(eth);
    return initWeb3();
  }
  return await initWalletConnect();
}

export async function switchChain(web3) {
    const wasAdded = await web3.request({
        method: 'wallet_switchEthereumChain',
        params: [
        {
            chainId: '0x1',
        },
        ],
    });
}

export async function web3Address(web3) {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts);
  if (accounts.length > 0) return accounts[0];
  if (Web3.utils.isAddress(accounts)) return accounts;
  throw "address not found";
}