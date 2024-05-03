// ConnectWallet.js
import React, { useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { getAuth, signInWithCustomToken } from "firebase/auth";

const injectedConnector = new InjectedConnector({
  supportedChainIds: [1, 5, 80001, 31337, 11155111],
});

const ConnectWallet = ({ onConnected }) => {
  const { activate, deactivate, account, active } = useWeb3React();

  const connect = useCallback(async () => {
    try {
      await activate(injectedConnector);
      localStorage.setItem("isWalletConnected", "true");
      console.log("Wallet activation attempted");
    } catch (e) {
      console.error("Connection Failed", e);
    }
  }, [activate]); // 加入 activate 作为依赖

  useEffect(() => {
    if (account) {
      fetch("https://music-nft-mu.vercel.app/generateToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: account }),
      })
        .then((response) => response.json())
        .then((data) => {
          const auth = getAuth();
          signInWithCustomToken(auth, data.token)
            .then((userCredential) => {
              const user = userCredential.user;
              console.log("User signed in:", user);
            })
            .catch((error) => {
              const errorCode = error.code;
              const errorMessage = error.message;
              console.error(
                "Error signing in with custom token:",
                errorCode,
                errorMessage
              );
            });
        })
        .catch((error) => {
          console.error("Error:", error);
        });
    }
  }, [account]);

  const disconnect = () => {
    deactivate();
    localStorage.removeItem("isWalletConnected");
  };

  /*React.useEffect(() => {
    if (localStorage.getItem("isWalletConnected") === "true" && !active) {
      connect();
    }
  }, [active]);*/

  // 自动连接钱包的逻辑
  useEffect(() => {
    if (localStorage.getItem("isWalletConnected") === "true" && !active) {
      connect();
    }
  }, [active, connect]); // 现在 connect 由 useCallback 处理，可以安全加入依赖

  return (
    <div className="connectWalletContainer">
      {active ? (
        <div>
          <p className="walletAddress">
            Connected with <b>{account}</b>
          </p>
          <button className="disconnectButton" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      ) : (
        <button className="connectButton" onClick={connect}>
          Connect to MetaMask
        </button>
      )}
    </div>
  );
};

export default ConnectWallet;
