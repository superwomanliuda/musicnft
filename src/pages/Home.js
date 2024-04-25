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
  const { active, chainId } = useWeb3React();

  useEffect(() => {
    const fetchAlbums = async () => {
      /*if (!active) {
        console.log("Wallet is not connected");
        return (
          <div className="wallet-connect-prompt">
            Please connect your wallet to view albums.
          </div>
        );
      }*/
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

            // 将专辑的 IPFS 链接转换为 HTTP 链接
            const albumInfoHttpLink = albumInfo.ipfsUri.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            );

            // 获取专辑 JSON 数据
            const albumJsonResponse = await fetch(albumInfoHttpLink);
            const albumJson = await albumJsonResponse.json();

            // 从 JSON 数据中提取专辑封面和标题
            const albumCoverLink = albumJson.image.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            );
            const albumTitle = albumJson.title;

            return {
              address: address,
              title: albumTitle, // 使用 JSON 中的标题
              image: albumCoverLink, // 使用 JSON 中的封面图片链接
              price: albumInfo.price,
              amount: albumInfo.amount,
            };
          })
        );
        console.log("Fetched albums:", albums);
        setAlbumData(albums);
      } catch (error) {
        console.error("Error fetching album data:", error);
      }
    };

    fetchAlbums();
  }, [active, chainId]);

  return (
    <Tabs defaultActiveKey="1" centered>
      <TabPane tab="ALBUMS" key="1">
        <h1 className="featuredTitle">Latest</h1>
        {!walletConnected ? (
          <div className="wallet-connect-prompt">
            Please connect your wallet to view albums.
          </div>
        ) : (
          <div className="albums">
            {albumData.map((album) => (
              <Link
                to={`/album/${album.address}`}
                state={album}
                className="albumSelection"
                key={album.address}
              >
                <img
                  src={album.image}
                  alt="album cover"
                  style={{ width: "150px", marginBottom: "10px" }}
                />
                <p>{album.title}</p>
              </Link>
            ))}
          </div>
        )}
      </TabPane>
    </Tabs>
  );
};

export default Home;
