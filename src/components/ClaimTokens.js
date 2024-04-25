import React, { useState, useEffect } from "react";
import { message, Button } from "antd";
import { useWeb3React } from "@web3-react/core";
import LalaTokenABI from "../constants/abi/LalaToken.json";
import contractAddresses from "../constants/contractAddress.json";

const { ethers } = require("ethers");

const ClaimTokens = () => {
  const { active, account, library, chainId } = useWeb3React();
  const [claimCounts, setClaimCounts] = useState({});
  const [isClaiming, setIsClaiming] = useState(false);

  useEffect(() => {
    if (!active) {
      message.error("Wallet is not connected.");
    }
  }, [active]);

  const handleClaimTokens = async () => {
    if (!active || !account) {
      message.error("Wallet is not connected.");
      return;
    }

    setIsClaiming(true);

    const lalaTokenAddress = contractAddresses[chainId]?.LalaToken;
    console.log("lalatokenaddress:", lalaTokenAddress);
    if (!lalaTokenAddress) {
      message.error("LalaToken address not found for the current network.");
      setIsClaiming(false);
      return;
    }

    const tokenContract = new ethers.Contract(
      lalaTokenAddress,
      LalaTokenABI,
      library.getSigner()
    );

    try {
      const isBlacklisted = await tokenContract.blacklist(account);
      if (isBlacklisted) {
        message.error("Your account is blacklisted.");
        setIsClaiming(false);
        return;
      }

      const currentClaimCount = claimCounts[account] || 0;
      if (currentClaimCount >= 10) {
        message.error("You have reached the maximum claim limit.");
        setIsClaiming(false);
        return;
      }

      const tx = await tokenContract.claimTokens(
        account,
        ethers.utils.parseUnits("5", "ether")
      );
      console.log("Transaction object:", tx);

      if (typeof tx.wait !== "function") {
        console.error("tx.wait is not a function. Transaction object:", tx);
        return;
      }

      const receipt = await tx.wait();
      console.log("Transaction receipt:", receipt);

      setClaimCounts({
        ...claimCounts,
        [account]: currentClaimCount + 1,
      });
      message.success("Successfully claimed 5 tokens!");
    } catch (error) {
      console.error("Error occurred:", error);
      console.error("Error stack:", error.stack);
      message.error("An error occurred while claiming tokens.");
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <Button
      type="primary"
      onClick={handleClaimTokens}
      disabled={!active || isClaiming}
      loading={isClaiming}
    >
      Claim Tokens
    </Button>
  );
};

export default ClaimTokens;
