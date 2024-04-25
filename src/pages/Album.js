import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import Opensea from "../images/opensea.png"; // 保留 Opensea 图片导入
import { ClockCircleOutlined } from "@ant-design/icons"; // 保留 ClockCircleOutlined 图标导入
import { useWeb3React } from "@web3-react/core"; // 保留 useWeb3React 钩子导入
import Moralis from "moralis";
import { ethers } from "ethers"; // etherv5的导入
import "./Album.css";
import AlbumABI from "../constants/abi/Album.json";
import LalaTokenABI from "../constants/abi/LalaToken.json";
import contractAddresses from "../constants/contractAddress.json";
import { Spin, Alert, message } from "antd";
import WithdrawToken from "../components/WithdrawToken";

const Album = ({ setNftAlbum }) => {
  const location = useLocation();
  const { state: albumDetails } = location;
  const [album, setAlbum] = useState([]);
  const { account, active, library, chainId } = useWeb3React();
  const [albumMetadata, setAlbumMetadata] = useState(null);
  const [price, setPrice] = useState(0); // 新增，用于存储专辑价格
  //const rpcUrl = "http://127.0.0.1:8545/";
  //"https://polygon-mumbai.g.alchemy.com/v2/Pb1I4GCYY0914_r0zCsVA7U7aoLVSS-6";
  //const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
  const [isApproving, setIsApproving] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [successAlert, setSuccessAlert] = useState(false);
  const [error, setError] = useState("");
  const [availableNFTsCount, setAvailableNFTsCount] = useState(0);
  const [isOwner, setIsOwner] = useState(false);

  const lalaTokenAddress = contractAddresses[chainId]?.LalaToken || "";

  useEffect(() => {
    const checkOwner = async () => {
      if (!albumDetails.address || !account) return;
      const albumContract = new ethers.Contract(
        albumDetails.address,
        AlbumABI,
        library
      );
      const owner = await albumContract.owner();
      setIsOwner(owner === account);
    };

    checkOwner();
  }, [account, albumDetails.address, library, chainId]);

  useEffect(() => {
    const fetchAlbumInfoAndAvailableNFTs = async () => {
      if (active && albumDetails?.address) {
        const albumContract = new ethers.Contract(
          albumDetails.address,
          AlbumABI,
          library
        );
        try {
          // 获取专辑信息
          const albumInfo = await albumContract.getAlbumInfo();
          setPrice(albumInfo.price.toString());
          // 获取可出售NFT数量
          const availableCount = await albumContract.getAvailableTokensCount();
          setAvailableNFTsCount(availableCount.toNumber());
        } catch (error) {
          console.error(
            "Error fetching album info and available NFTs count:",
            error
          );
        }
      }
    };

    fetchAlbumInfoAndAvailableNFTs();
  }, [active, albumDetails?.address, library, chainId]);

  useEffect(() => {
    const fetchAlbumData = async () => {
      if (active && albumDetails?.address) {
        try {
          // 通过 Moralis 获取专辑的 NFT 数据
          const response = await Moralis.EvmApi.nft.getContractNFTs({
            address: albumDetails.address,
            chain: "0xaa36a7",
            format: "decimal",
          });
          // Assuming the first NFT contains the entire album metadata
          const albumMetadata = response.raw.result[0]?.metadata
            ? JSON.parse(response.raw.result[0].metadata)
            : null;
          console.log("albummetadate:", albumMetadata); // 打印日志来检查数据结构
          // Check if albumMetadata and songs exist
          if (albumMetadata && Array.isArray(albumMetadata.songs)) {
            const songs = albumMetadata.songs.map((song, index) => {
              // Ensure each song has name and url, and convert IPFS urls to HTTP urls
              const songUrl = song.url
                ? song.url.replace("ipfs://", "https://ipfs.io/ipfs/")
                : "default_song_url";
              const songName = song.name || `Track ${index + 1}`;

              return {
                name: songName,
                url: songUrl,
                duration: song.duration || "0:00", // Provide a default value if undefined
              };
            });

            console.log("Formatted Songs:", songs); // Debug: Print the songs array
            setAlbum(songs); // Update the album state with formatted songs array
            setAlbumMetadata(albumMetadata);
          }
        } catch (error) {
          console.error("Error fetching album data:", error);
        }
      }
    };

    fetchAlbumData();
  }, [albumDetails?.address, chainId]);

  useEffect(() => {
    if (active && albumDetails?.address) {
      const albumContract = new ethers.Contract(
        albumDetails.address,
        AlbumABI,
        library
      );

      const onNFTSold = (tokenId) => {
        console.log(`NFT with tokenId ${tokenId} was sold.`);
        // 这里可以根据业务需求调用getAvailableTokensCount来更新界面上的可售NFT数量
        fetchAvailableNFTsCount();
      };

      // 设置事件监听器
      albumContract.on("NFTSold", onNFTSold);

      // 返回一个清理函数，以便在组件卸载时移除监听器
      return () => {
        albumContract.off("NFTSold", onNFTSold);
      };
    }
  }, [active, albumDetails?.address, library, chainId]);

  const fetchAvailableNFTsCount = async () => {
    if (active && albumDetails?.address) {
      const albumContract = new ethers.Contract(
        albumDetails.address,
        AlbumABI,
        library
      );
      try {
        const availableCount = await albumContract.getAvailableTokensCount();
        setAvailableNFTsCount(availableCount.toNumber());
      } catch (error) {
        console.error("Error fetching available NFTs count:", error);
      }
    }
  };

  const handlePlayAlbum = () => {
    if (album.length > 0 && albumMetadata) {
      // 创建一个新的数组，其中包含歌曲信息和专辑封面以及艺术家信息
      const albumWithDetails = album.map((track) => ({
        ...track,
        coverImage: albumMetadata.image.replace(
          "ipfs://",
          "https://ipfs.io/ipfs/"
        ),
        artistName: albumMetadata.artist,
      }));

      setNftAlbum(albumWithDetails); // 设置整个专辑，包括封面图和艺术家名称
    }
  };

  const handleBuyNFT = async () => {
    if (!active || !account) {
      console.error("Wallet not connected");
      return;
    }
    setIsBuying(true);

    try {
      const web3Provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = web3Provider.getSigner();
      const lalaTokenContract = new ethers.Contract(
        lalaTokenAddress,
        LalaTokenABI,
        signer
      );

      console.log("Price for approval:", price);
      setIsApproving(true);
      const approveTx = await lalaTokenContract.approve(
        albumDetails.address,
        price
      );
      await approveTx.wait();
      setIsApproving(false);
      setIsApproved(true);

      const albumContract = new ethers.Contract(
        albumDetails.address,
        AlbumABI,
        signer
      );
      const buyNftTx = await albumContract.buyNFT({ gasLimit: 2000000 });
      const receipt = await buyNftTx.wait();
      console.log("receipt:", receipt);
      // 检查交易状态
      if (receipt.status === 1) {
        console.log("NFT purchased successfully");
        setSuccessAlert(true);
      } else {
        console.error("Purchase failed");
        setError("Purchase failed. Please try again.");
      }
    } catch (error) {
      console.error("Error occurred:", error);
      setError("Purchase failed.");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <>
      <div className="albumContent">
        <div className="topBan">
          <img
            src={albumDetails.image}
            alt="albumcover"
            className="albumCover"
          ></img>
          <div className="albumDeets">
            <div>ALBUM</div>
            {/* 使用条件渲染，确保 albumDetails.title 有值时才渲染 */}
            {albumMetadata && (
              <>
                <div className="title">{albumMetadata.title}</div>
                <div className="artist">{albumMetadata.artist}</div>
                <div>
                  {albumMetadata.year} • {album.length} Songs
                </div>
              </>
            )}
          </div>
        </div>
        <div className="topBan">
          <div className="playButton" onClick={handlePlayAlbum}>
            PLAY
          </div>
          <div
            className="openButton"
            onClick={() =>
              window.open(
                `https://testnets.opensea.io/assets/sepolia/${albumDetails.address}/1`
              )
            }
          >
            OpenSea
            <img src={Opensea} className="openLogo" />
          </div>
        </div>
        <div className="tableHeader">
          <div className="numberHeader">#</div>
          <div className="titleHeader">TITLE</div>
          <div className="numberHeader">
            <ClockCircleOutlined />
          </div>
        </div>
        {album.map((song, i) => (
          <div className="tableContent" key={i}>
            <div className="numberHeader">{i + 1}</div>
            <div
              className="titleHeader"
              style={{ color: "rgb(205, 203, 203)" }}
            >
              {song.name}
            </div>
            <div className="numberHeader">{song.duration}</div>
          </div>
        ))}
        {isBuying && <Spin tip="Purchasing NFT..."></Spin>}
        {/* 成功的 Alert */}
        {successAlert && (
          <Alert
            message="NFT purchased successfully!"
            type="success"
            closable
            onClose={() => setSuccessAlert(false)}
          />
        )}
        {/* 错误的 Alert */}
        {error && (
          <Alert
            message={error}
            type="error"
            closable
            onClose={() => setError("")}
          />
        )}
        <div className="purchaseInfo">
          <p className="nftInfoText">Price: {price} LalaTokens(wei)</p>
          <p className="nftInfoText">Available NFTs: {availableNFTsCount}</p>
          <button
            onClick={handleBuyNFT}
            disabled={isBuying || !active || !availableNFTsCount}
          >
            {isBuying ? "Buying..." : "Buy NFT"}
          </button>
          {isOwner && <WithdrawToken albumAddress={albumDetails.address} />}
        </div>
      </div>
    </>
  );
};

export default Album;
