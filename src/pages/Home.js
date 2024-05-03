import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";
import { Tabs } from "antd";
import { useWeb3React } from "@web3-react/core";
import Moralis from "moralis";
import AlbumABI from "../constants/abi/Album.json";
import AlbumFactoryABI from "../constants/abi/AlbumFactory.json";
import contractAddresses from "../constants/contractAddress.json";

const { TabPane } = Tabs;
const { ethers } = require("ethers");

const Home = () => {
  const [albumData, setAlbumData] = useState([]);
  const [walletConnected, setWalletConnected] = useState(false);
  const [imageStatus, setImageStatus] = useState({});
  const { active, chainId } = useWeb3React();

  useEffect(() => {
    const fetchAlbums = async () => {
      if (!active) {
        console.log("Wallet is not connected");
        setWalletConnected(false);
        return;
      }
      setWalletConnected(true);
      console.log("wallet is connected,fetching albums...");
      // 使用 ethers 提供者
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      // AlbumFactory 合约信息
      const chainIdStr = chainId.toString();
      const factoryAddress = contractAddresses[chainIdStr]?.AlbumFactory;

      if (!factoryAddress) {
        console.error("AlbumFactory address not found for the current network");
        return;
      }
      const factoryContract = new ethers.Contract(
        factoryAddress,
        AlbumFactoryABI,
        provider
      );

      try {
        console.log("Fetching album addresses from contract...");
        // 获取所有专辑合约地址
        const addresses = await factoryContract.getDeployedAlbums();

        // 获取所有专辑的信息
        const albums = await Promise.all(
          addresses.map(async (address) => {
            const albumContract = new ethers.Contract(
              address,
              AlbumABI,
              provider
            );
            const albumInfo = await albumContract.getAlbumInfo();
            console.log("Fetched albumInfo:", albumInfo);

            if (
              !albumInfo.ipfsUri ||
              !albumInfo.ipfsUri.startsWith("ipfs://")
            ) {
              console.error("Invalid or missing IPFS URI:", albumInfo.ipfsUri);
              return null; // Skip this album if the IPFS URI is invalid or missing
            }

            // 将专辑的 IPFS 链接转换为 HTTP 链接
            const albumInfoHttpLink = albumInfo.ipfsUri.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            );

            try {
              const albumJsonResponse = await fetch(albumInfoHttpLink);
              if (!albumJsonResponse.ok) {
                throw new Error(
                  `HTTP error! status: ${albumJsonResponse.status}`
                );
              }
              const albumJson = await albumJsonResponse.json();

              const albumCoverLink = albumJson.image.replace(
                "ipfs://",
                "https://ipfs.io/ipfs/"
              );
              const albumTitle = albumJson.title;

              return {
                address: address,
                title: albumTitle,
                image: albumCoverLink,
                price: albumInfo.price,
                amount: albumInfo.amount,
              };
            } catch (error) {
              console.error(
                "Error fetching or processing album JSON data:",
                error
              );
              return null;
            }
          })
        );
        // 在将数据设置到状态之前，倒序数组
        const sortedAlbums = albums.filter((album) => album !== null).reverse();
        console.log("Fetched and sorted albums:", sortedAlbums);
        setAlbumData(sortedAlbums); // Set the sorted data to the state
      } catch (error) {
        console.error("Error fetching album data:", error);
      }
    };

    fetchAlbums();
  }, [active, chainId]);

  const handleImageLoaded = (albumId) => {
    setImageStatus((prev) => ({ ...prev, [albumId]: "loaded" }));
  };

  const handleImageError = (albumId) => {
    setImageStatus((prev) => ({ ...prev, [albumId]: "error" }));
  };

  return (
    <Tabs defaultActiveKey="1" centered>
      <TabPane tab="ALBUMS" key="1">
        <div className="albums">
          {albumData.map((album) => (
            <Link
              to={`/album/${album.address}`}
              state={album}
              className="albumSelection"
              key={album.address}
            >
              <div className="image-container">
                {imageStatus[album.address] !== "loaded" && (
                  <div>
                    {imageStatus[album.address] === "error"
                      ? "Album Cover"
                      : "Loading..."}
                  </div>
                )}
                <img
                  src={album.image}
                  alt="album cover"
                  style={
                    imageStatus[album.address] === "loaded"
                      ? {}
                      : { display: "none" }
                  }
                  onLoad={() => handleImageLoaded(album.address)}
                  onError={() => handleImageError(album.address)}
                />
              </div>
              <p>{album.title}</p>
            </Link>
          ))}
        </div>
      </TabPane>
    </Tabs>
  );
};

export default Home;
