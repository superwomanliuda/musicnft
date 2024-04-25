import React, { useState, useEffect } from "react";
import { useWeb3React } from "@web3-react/core";
import { ethers } from "ethers";
import AlbumFactoryABI from "../constants/abi/AlbumFactory.json";
import contractAddresses from "../constants/contractAddress.json";
import { useNavigate } from "react-router-dom";
import "./ReleaseAlbum.css";

const ReleaseAlbum = () => {
  const { account, library, active, chainId } = useWeb3React();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [albumUri, setAlbumUri] = useState("");
  const [price, setPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [albumAddress, setAlbumAddress] = useState(null);

  const albumFactoryAddress =
    active && chainId
      ? contractAddresses[chainId.toString()]?.AlbumFactory
      : null;

  useEffect(() => {
    if (library) {
      const albumFactoryContract = new ethers.Contract(
        albumFactoryAddress,
        AlbumFactoryABI,
        library
      );

      const eventHandler = (logs) => {
        console.log("Received event logs:", logs);
        const clonedAlbumAddress = logs;
        setAlbumAddress(clonedAlbumAddress);
        setIsSubmitting(false);
        console.log("Album Address:", clonedAlbumAddress);
        alert(
          `Album address created successfully! Address: ${clonedAlbumAddress}. There may be a delay in updating albums list. It will be updated later.`
        );
        navigate("/my-albums");
      };

      albumFactoryContract.on("AlbumCreated", eventHandler);

      return () => {
        albumFactoryContract.off("AlbumCreated", eventHandler);
      };
    }
  }, [library, albumFactoryAddress, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!active || !account) {
      setError("Wallet is not connected, please connect to release albums.");
      return;
    }

    const priceNum = parseFloat(price);
    const amountNum = parseInt(amount, 10);
    if (isNaN(priceNum) || priceNum < 0 || isNaN(amountNum) || amountNum <= 0) {
      setError(
        "Invalid input: Price must be a non-negative number and amount must be a positive integer."
      );
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const signer = library.getSigner(account);
      const albumFactory = new ethers.Contract(
        albumFactoryAddress,
        AlbumFactoryABI,
        signer
      );

      const tx = await albumFactory.cloneAndInitializeAlbum(
        name,
        symbol,
        albumUri,
        ethers.utils.parseUnits(price, 18),
        amountNum
      );
      await tx.wait();
    } catch (error) {
      console.error("Error creating album:", error);
      alert("Failed to create album.");
    } finally {
      //setIsSubmitting(false);
    }
  };

  if (!active) {
    return (
      <div className="wallet-connect-prompt">
        <h2>Wallet is not connected, please connect to release albums.</h2>
      </div>
    );
  }

  return (
    <div className="release-album-container">
      <h2>Mint Album</h2>
      <p>
        Please copy and paste this IPFS URI (
        ipfs://QmXo8W6qWZcafo3UqRT11eCPC3MC63sobgKof2koSJn2UM/metadata/album.json)
        into IPFS URI input box to experience the feature.
      </p>
      {account ? (
        <p style={{ color: "white" }}>NFT Owner: {account}</p>
      ) : (
        <p style={{ color: "white" }}>NFT Owner: Not Connected</p>
      )}
      <form onSubmit={handleSubmit} className="release-album-form">
        <label>NFT Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Please fill out this field"
          required
          disabled={isSubmitting || !active}
        />
        <label>NFT Symbol</label>
        <input
          type="text"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Please fill out this field"
          required
          disabled={isSubmitting || !active}
        />
        <label>IPFS URI</label>
        <input
          type="text"
          value={albumUri}
          onChange={(e) => setAlbumUri(e.target.value)}
          placeholder="Please fill out this field"
          required
          disabled={isSubmitting || !active}
        />
        <label>Price (ETH)</label>
        <input
          type="text"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="Please fill out this field"
          required
          disabled={isSubmitting || !active}
        />
        <label>Amount</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Please fill out this field"
          required
          disabled={isSubmitting || !active}
        />
        <button type="submit" disabled={isSubmitting || !active}>
          {isSubmitting ? "Album minting..." : "Mint Album"}
        </button>
        {error && (
          <div style={{ color: "red", marginTop: "10px" }}>{error}</div>
        )}
      </form>
    </div>
  );
};

export default ReleaseAlbum;
