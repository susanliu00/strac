import logo from "./logo.svg";
import "./App.css";
import { w3cwebsocket as WebSocket } from "websocket";
import React, { useEffect, useState } from "react";

const File = ({ backendData }) => {
  return (
    <div className="file">
      <h2>Name: {backendData[0]}</h2>
      <div>
        <h3>Users</h3>
        {backendData[2].map((u) => {
          return <div>u.displayName</div>;
        })}
        <div className="download">
          <button onClick={() => {}}>Download</button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [files, setFiles] = useState({});
  const [websocketURL, setWebsocketURL] = useState("");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:3000");
  }, []);

  useEffect(() => {
    const socket = new WebSocket(websocketURL);
    socket.onopen = () => {
      console.log("WebSocket connection established.");
    };

    socket.onmessage = (event) => {
      console.log("Received message:", event.data);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket connection closed.");
    };

    return () => {
      socket.close();
    };
  }, [websocketURL]);

  return (
    <div className="App">
      {Object.entries(files).map(([id, perm]) => {
        return <File backendData={[id, perm]} />;
      })}
    </div>
  );
}

export default App;
