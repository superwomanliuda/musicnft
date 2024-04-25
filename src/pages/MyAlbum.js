import React, { useState, useEffect } from "react";
import {
  getDatabase,
  ref,
  query,
  orderByChild,
  equalTo,
  onValue,
} from "firebase/database";
import { useWeb3React } from "@web3-react/core";
import { Link, useNavigate } from "react-router-dom";
import "./MyAlbum.css";

const MyAlbums = () => {
  const navigate = useNavigate();
  const [albums, setAlbums] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { account, active } = useWeb3React();
  console.log("account address:", account);

  const handleReleaseAlbumClick = () => {
    navigate("/release-album");
  };

  useEffect(() => {
    const fetchAlbums = async () => {
      /*if (!account) {
        setIsLoading(false);
        return;
      }*/
      if (!active) {
        console.log("Wallet is not connected");
        setIsLoading(false);
        return;
      }

      const db = getDatabase();
      const lowerCaseAccount = account.toLowerCase();
      const albumsRef = query(
        ref(db, "albums"),
        orderByChild("ownerAddress"),
        equalTo(lowerCaseAccount)
      );
      console.log("Firebase query created, waiting for data...");

      onValue(albumsRef, async (snapshot) => {
        console.log("Firebase data received:", snapshot.val());
        const data = snapshot.val();
        if (!data) {
          console.log("No albums found for this account.");
          setIsLoading(false);
          return;
        }

        const loadedAlbums = await Promise.all(
          Object.keys(data).map(async (key) => {
            const album = data[key];
            const albumInfoHttpLink = album.ipfsUri.replace(
              "ipfs://",
              "https://ipfs.io/ipfs/"
            );

            try {
              const albumJsonResponse = await fetch(albumInfoHttpLink);
              const albumJson = await albumJsonResponse.json();
              return {
                id: key,
                title: albumJson.title,
                image: albumJson.image.replace(
                  "ipfs://",
                  "https://ipfs.io/ipfs/"
                ),
                address: album.albumAddress,
              };
            } catch (error) {
              console.error("Error fetching album JSON from IPFS:", error);
              return null;
            }
          })
        );

        console.log("Loaded albums:", loadedAlbums);
        setAlbums(loadedAlbums.filter((album) => album !== null));
        setIsLoading(false);
      });
    };

    fetchAlbums();
  }, [account, active]);

  return (
    <div className="myAlbumsContainer">
      <h1 className="myAlbumsTitle">Album List</h1>
      <button onClick={handleReleaseAlbumClick} className="releaseAlbumButton">
        Mint Albums
      </button>
      <div className="album-list">
        {isLoading ? (
          <div className="loading-message">Loading...</div>
        ) : !active ? (
          <div className="wallet-connect-prompt">
            Wallet is not connected, please connect wallet to view albums.
          </div>
        ) : albums.length > 0 ? (
          albums.map((album, index) => (
            <Link
              to={`/album/${album.address}`}
              state={{ ...album }}
              key={index}
            >
              <div className="album">
                <img src={album.image} alt={album.title} />
                <div className="album-details">
                  <div className="album-title">{album.title}</div>
                  <div>{album.address}</div>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <div className="no-albums-message">
            No albums found for your wallet address.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAlbums;
