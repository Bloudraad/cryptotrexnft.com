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

export async function initWeb3(eth) {
  const web3 = new Web3(eth);
  await eth.request({ method: 'eth_requestAccounts' })
  eth.on('accountsChanged', async (accounts) => {
      console.log(accounts)
  });
  eth.on('chainChanged', () => {
    window.location.reload();
  });
  return web3;
}

export async function loadWeb3() {
  const eth = window.ethereum;
  if (eth) {
    return await initWeb3(eth);
  }
  return await initWalletConnect();
}

export async function switchChain(eth) {
    try {
        await eth.request({
             method: 'wallet_switchEthereumChain',
             params: [
             {
                 chainId: '0x1',
             },
             ],
         });
    } catch (err) {
        console.error(err)
    }
}

export async function web3Address(web3) {
  const accounts = await web3.eth.getAccounts();
  console.log(accounts);
  if (accounts.length > 0) return accounts[0];
  if (Web3.utils.isAddress(accounts)) return accounts;
  throw "address not found";
}