import logo from "./logo.svg";
import "./App.css";
import axios from "axios";
import React, { useEffect, useState } from "react";

let url = "http://localhost:8000";

const File = ({ backendData, close, open, files }) => {
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
              close();
              axios
                .post(`${url}/download`, {
                  id: backendData[0],
                  name: backendData[1][0],
                })
                .then((res) => console.log(res));
              files();
              open();
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
  const [eventSource, setEventSource] = useState(null);

  const getFiles = () => {
    console.log("getting files");
    axios.get(`${url}/files`).then((data) => {
      setFiles(data.data);
      console.log("FILES", data.data);
    });
  };

  useEffect(() => {
    getFiles();
  }, []);

  const openEventSource = () => {
    console.log("opening eventsource");
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

    setEventSource(events);
  };

  useEffect(() => {
    openEventSource();
  }, []);

  const closeEventSource = () => {
    console.log("closing eventsource");
    if (eventSource) {
      eventSource.close();
      setEventSource(null);
    }
  };

  return (
    <div className="App">
      {Object.entries(files).map(([id, perm]) => {
        return (
          <File
            backendData={[id, perm]}
            close={closeEventSource}
            open={openEventSource}
            files={getFiles}
          />
        );
      })}
    </div>
  );
}

export default App;
