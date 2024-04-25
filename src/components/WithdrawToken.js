import React, { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import { Button, Modal } from "antd";
import LalaTokenABI from "../constants/abi/LalaToken.json";
import AlbumABI from "../constants/abi/Album.json";
import contractAddresses from "../constants/contractAddress.json";
import "./WithdrawToken.css";

const { formatEther } = ethers.utils;

const WithdrawToken = ({ albumAddress }) => {
  const { account, library, chainId } = useWeb3React();
  const [balance, setBalance] = useState("0");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState("");

  const lalaTokenAddress = contractAddresses[chainId]?.LalaToken;

  const fetchBalance = async () => {
    console.log("starting fetch lltk balance:");
    if (!account || !albumAddress || !lalaTokenAddress) return;

    const lalaTokenContract = new ethers.Contract(
      lalaTokenAddress,
      LalaTokenABI,
      library
    );
    const balance = await lalaTokenContract.balanceOf(albumAddress);
    setBalance(formatEther(balance));
  };

  useEffect(() => {
    fetchBalance();
  }, [account, library, albumAddress, lalaTokenAddress, chainId]);

  const showModal = (content) => {
    setModalContent(content);
    setIsModalVisible(true);
  };

  const handleOk = () => {
    setIsModalVisible(false);
    //window.location.reload(); // 刷新页面
  };

  useEffect(() => {
    if (library && account && albumAddress) {
      const signer = library.getSigner(account);
      const albumContract = new ethers.Contract(albumAddress, AlbumABI, signer);

      const onWithdrawToken = (amount, to) => {
        console.log(
          `Withdrawn ${ethers.utils.formatEther(amount)} LalaTokens to ${to}`
        );
        fetchBalance(); // 调用 fetchBalance 函数来更新余额
      };

      albumContract.on("WithdrawToken", onWithdrawToken);

      // 清理函数，用于组件卸载时移除事件监听器
      return () => {
        albumContract.off("WithdrawToken", onWithdrawToken);
      };
    }
  }, [library, account, albumAddress]);

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleWithdraw = async () => {
    if (!account || !albumAddress || !lalaTokenAddress) return;

    setIsWithdrawing(true);

    const signer = library.getSigner(account);
    const albumContract = new ethers.Contract(albumAddress, AlbumABI, signer);
    try {
      await albumContract.withdrawLalaTokens();
      showModal(
        "Withdrawal successful: There may be a delay in updating the balance. It will be updated once the transaction is confirmed."
      );
      await fetchBalance();
    } catch (error) {
      console.error("Withdrawal failed:", error);
      showModal("Withdrawal failed.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div>
      <div>
        <p className="nftInfoText">Your Total earning: {balance} LalaToken</p>
      </div>
      <Button
        type="primary"
        onClick={handleWithdraw}
        disabled={!account || isWithdrawing}
        loading={isWithdrawing}
      >
        Withdraw
      </Button>
      <Modal
        title="Withdrawal Result"
        visible={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        footer={[
          <Button key="submit" type="primary" onClick={handleOk}>
            Close
          </Button>,
        ]}
      >
        <p>{modalContent}</p>
      </Modal>
    </div>
  );
};

export default WithdrawToken;
