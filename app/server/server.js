const http = require("http");
const { google } = require("googleapis");
const express = require("express");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const localtunnel = require("localtunnel");
var bodyParser = require("body-parser");
const WebSocket = require("ws");

const port = 8000;
const app = express();
app.use(bodyParser.json());

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
const wss = new WebSocket.Server({ server });
const clients = new Set();
wss.on("connection", (ws) => {
  clients.add(ws);

  ws.on("message", (message) => {
    console.log("Received message:", message);
  });
});

function sendUpdateToClients(updateData) {
  const payload = JSON.stringify(updateData);

  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

const credentials = require("./credentials.json");

const scopes = ["https://www.googleapis.com/auth/drive"];

const auth = new google.auth.JWT(
  credentials.client_email,
  null,
  credentials.private_key,
  scopes
);

const drive = google.drive({ version: "v3", auth });

(async () => {
  const tunnel = await localtunnel({ port: port });
  const pageToken = await drive.changes.getStartPageToken();
  const tunnel_url = tunnel.url;
  console.log(tunnel_url);

  const watchRequest = {
    requestBody: {
      id: uuidv4(),
      type: "web_hook",
      address: `${tunnel_url}/notification`,
    },
    pageToken: pageToken.data.startPageToken,
  };

  drive.changes.watch(watchRequest, (err, response) => {
    if (err) {
      console.error("Error creating push notification channel:", err);
      return;
    }

    console.log(
      "Push notification channel created successfully:",
      response.data
    );
  });
  app.get("/localtunnel", (req, res) => {
    console.log("URL:", tunnel_url);
    res.json({ url: tunnel_url });
  });
})();

app.use(express.static("src"));

async function getFiles() {
  const result = {};

  const response = await drive.files.list({
    pageSize: 10,
    fields: "nextPageToken, files(name, id)",
  });
  const files = response.data.files;
  for (const file of files) {
    const fileId = file.id;
    const response1 = await drive.permissions.list({
      fileId: file.id,
      fields: "permissions(displayName)",
    });
    const permissions = response1.data.permissions;
    result[fileId] = [file.name, permissions];
  }

  console.log("RESULT", result);
  return result;
}

app.post("/notification", (req, res) => {
  sendUpdateToClients(getFiles());
  console.log("here");
  res.sendStatus(200);
});
