import React, { useEffect, useState } from "react";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import {
  Routes,
  Route,
  Link,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Web3Provider } from "@ethersproject/providers";
import ConnectWallet from "./components/ConnectWallet";
import Home from "./pages/Home";
import Album from "./pages/Album";
import MyAlbums from "./pages/MyAlbum";
import "./App.css";
import { Layout } from "antd";
import MusicIcon from "./images/music.png";
import { SearchOutlined, DownCircleOutlined } from "@ant-design/icons";
import AudioPlayer from "./components/AudioPlayer";
import Moralis from "moralis";
import ClaimTokens from "./components/ClaimTokens";
import ReleaseAlbum from "./pages/ReleaseAlbum";
// 确保导入 Firebase 的初始化方法和所需的服务
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";

// 你的 Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyCsi2pwEg4jAbM9kjsXNGc4ys09Qb2o3JI",
  authDomain: "music-nft-server-b8ff3.firebaseapp.com",
  databaseURL:
    "https://music-nft-server-b8ff3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "music-nft-server-b8ff3",
  storageBucket: "music-nft-server-b8ff3.appspot.com",
  messagingSenderId: "353145781066",
  appId: "1:353145781066:web:95620524931d0aafa31fb3",
  measurementId: "G-VYGQNYXWFW",
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
// 如果你需要使用 Google Analytics
const analytics = getAnalytics(app);
const auth = getAuth(app);

const getLibrary = (provider) => {
  return new Web3Provider(provider);
};

const { Footer, Sider, Content } = Layout;

const App = () => {
  const { account, active } = useWeb3React();
  const navigate = useNavigate();
  const [nftAlbum, setNftAlbum] = useState();
  const location = useLocation();

  useEffect(() => {
    console.log("Active status on App load:", active); // 初始加载时打印 active 状态
  }, [active]);

  // 初始化 Moralis SDK
  useEffect(() => {
    console.log("App component is mounted!");

    const initializeMoralis = async () => {
      await Moralis.start({
        apiKey: process.env.REACT_APP_MORALIS_API_KEY,
      });
    };

    initializeMoralis();
  }, []);

  return (
    <Web3ReactProvider getLibrary={(provider) => new Web3Provider(provider)}>
      <Layout>
        <Sider width={200} className="sideBar">
          <img src={MusicIcon} alt="Logo" className="logo" />
          <Link
            to="/"
            className={location.pathname === "/" ? "currentLink" : ""}
          >
            <p>Home</p>
          </Link>
          <Link
            to="/my-albums"
            className={location.pathname === "/my-albums" ? "currentLink" : ""}
          >
            <p className="myAlbumsLink">Artists</p>
          </Link>
        </Sider>
        <Content className="contentWindow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/album/:address"
              element={<Album setNftAlbum={setNftAlbum} />}
            />
            <Route path="/my-albums" element={<MyAlbums />} />
            <Route path="/release-album" element={<ReleaseAlbum />} />
          </Routes>
        </Content>
        <Sider width={200}>
          <ConnectWallet />
          <ClaimTokens />
        </Sider>
      </Layout>
      <Footer className="fixedFooter">
        {nftAlbum && <AudioPlayer nftAlbum={nftAlbum} />}
      </Footer>
    </Web3ReactProvider>
  );
};

export default App;
