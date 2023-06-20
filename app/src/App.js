import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import React, { useEffect, useState } from "react";

let url = "http://localhost:8000";

const File = ({ backendData }) => {
  return (
    <div className="file">
      <div>
        <h3 className="name-header">{backendData[1][0]}</h3>
        <div className="users">
          <h3 className="users-header">Users</h3>
          <ul>
            {backendData[1][1].map((u) => {
              return <div>{u.displayName}</div>;
            })}
          </ul>
        </div>

        <div className="download">
          <button
            onClick={() => {
              axios
                .post(`${url}/download`, {
                  id: backendData[0],
                  name: backendData[1][0],
                })
                .then((res) => console.log(res));
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

  useEffect(() => {
    axios.get(`${url}/files`).then((data) => {
      setFiles(data.data);
      console.log("FILES", data.data);
    });
  }, [files]);

  useEffect(() => {
    const events = new EventSource(`${url}/events`);
    events.onmessage = (event) => {
      const parsedData = JSON.parse(event.data);
      if (parsedData.length === 1) {
        const remove = { ...files };
        delete remove[parsedData[0]];
        setFiles(remove);
      } else {
        const key = parsedData[0];
        setFiles({ ...files, [key]: [parsedData[1], parsedData[2]] });
      }
    };
  }, [files]);

  return (
    <div className="App">
      {Object.entries(files).map(([id, perm]) => {
        return <File backendData={[id, perm]} />;
      })}
    </div>
  );
}

export default App;
