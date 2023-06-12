import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
// import { w3cwebsocket as WebSocket } from "websocket";
import React, { useEffect, useState } from "react";

let url = "http://localhost:8000";
const File = ({ backendData }) => {
  return (
    <div className="file">
      <h2>Id: {backendData[0]}</h2>
      <h2>Name: {backendData[1][0]}</h2>
      <div>
        <h3>Users</h3>
        {backendData[1][1].map((u) => {
          return <div>{u.displayName}</div>;
        })}
        {/* <div className="download">
          <button
            onClick={() => {
              fetch("/download", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ backendData }),
              })
                .then((response) => {
                  if (response.ok) {
                    return response.json();
                  } else {
                    throw new Error("Error initiating file download");
                  }
                })
                .then((data) => {
                  window.open(data.url);
                })
                .catch((error) => {
                  console.error(error);
                });
            }}
          >
            Download
          </button>
        </div> */}
      </div>
    </div>
  );
};

function App() {
  const [files, setFiles] = useState({});
  useEffect(() => {
    axios.get(`${url}/files`).then((data) => {
      setFiles(data.data);
      console.log("FILES", data.data);
    });
  }, []);

  useEffect(() => {
    const events = new EventSource(`${url}/events`);

    events.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      console.log(parsedData);
      console.log("parsed");
    };
  }, []);

  return (
    <div className="App">
      {Object.entries(files).map(([id, perm]) => {
        console.log(id, perm);
        return <File backendData={[id, perm]} />;
      })}
    </div>
  );
}

export default App;
