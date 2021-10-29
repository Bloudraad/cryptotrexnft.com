import Web3 from "web3";

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

async function addToken(web3) {
  const tokenAddress = process.env.TA;
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

window.onload = loadWeb3;

const addTokenBtn = document.getElementById("addTokenBtn");
addTokenBtn.addEventListener("click", async () => {
  await addToken(window.ethereum);
});
