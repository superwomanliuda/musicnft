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

  const connect = async () => {
    try {
      await activate(injectedConnector);
      localStorage.setItem("isWalletConnected", "true");
      console.log("Wallet activation attempted");
    } catch (e) {
      console.error("Connection Failed", e);
    }
  };

  useEffect(() => {
    if (account) {
      // 发送钱包地址到后端生成自定义令牌
      fetch("https://music-nft-mu.vercel.app/generateToken", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ walletAddress: account }),
      })
        .then((response) => response.json())
        .then((data) => {
          // 使用返回的自定义令牌进行后续操作
          const auth = getAuth();
          signInWithCustomToken(auth, data.token)
            .then((userCredential) => {
              // Signed in
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

  React.useEffect(() => {
    if (localStorage.getItem("isWalletConnected") === "true" && !active) {
      connect();
    }
  }, [active]);

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
