import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
// import { w3cwebsocket as WebSocket } from "websocket";
import React, { useEffect, useState } from "react";

let url = "http://localhost:8000";
const File = ({ backendData }) => {
  return (
    <div className="file">
      {/* <h2>Id: {backendData[0]}</h2> */}
      <div>
        <h3>Name: {backendData[1][0]}</h3>
        <h3>Users</h3>
        {backendData[1][1].map((u) => {
          return <div>{u.displayName}</div>;
        })}
        <div className="download">
          <button
            onClick={() => {
              axios
                .post(`${url}/download`, {
                  id: backendData[0],
                  name: backendData[1][0],
                })
                .then((res) => console.log(res));
              console.log("clickede");
            }}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [files, setFiles] = useState({});
  const events = new EventSource(`${url}/events`);

  useEffect(() => {
    axios.get(`${url}/files`).then((data) => {
      setFiles(data.data);
      console.log("FILES", data.data);
    });
  });

  useEffect(() => {
    events.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      console.log("PARSED", parsedData);
      if (parsedData.length === 1) {
        const remove = { ...files };
        delete remove[parsedData[0]];
        console.log("REMOVED", remove);
        setFiles(remove);
      } else {
        const key = parsedData[0];
        setFiles({ ...files, [key]: [parsedData[1], parsedData[2]] });
      }
    };
  });

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
