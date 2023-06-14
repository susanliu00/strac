const { google } = require("googleapis");
const express = require("express");
const fs = require("fs");

const { v4: uuidv4 } = require("uuid");
const localtunnel = require("localtunnel");

const port = 8000;
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
})();

async function getChange() {
  console.log("getChanges");
  const pageToken = await drive.changes.getStartPageToken();
  const res = await drive.changes.list({
    pageToken: pageToken.data.startPageToken - 1,
    fields: "*",
  });
  console.log(
    "CHANGED FILE",
    res.data.changes,
    res.data.changes[0].file.trashed
  );
  const id = res.data.changes[0].fileId;
  if (res.data.changes[0].file.trashed) {
    return [id];
  }

  const name = res.data.changes[0].file.name;
  const response = await drive.permissions.list({
    fileId: id,
    fields: "permissions(displayName)",
  });
  const permissions = response.data.permissions;
  return [id, name, permissions];
}

let clients = [];
function eventsHandler(request, response, next) {
  const headers = {
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  };
  response.writeHead(200, headers);
  const clientId = Date.now();
  const newClient = {
    id: clientId,
    response,
  };
  clients.push(newClient);
  request.on("close", () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter((client) => client.id !== clientId);
  });
}

app.get("/events", eventsHandler);

function sendEventsToAll(update) {
  clients.forEach((client) =>
    client.response.write(`data: ${JSON.stringify(update)}\n\n`)
  );
}

async function notifyClients(req, res) {
  if (req.headers["x-goog-resource-state"] != "sync") {
    console.log("event in push notif channel");
    changes = await getChange();
    return sendEventsToAll(changes);
  } else {
    console.log("sync msg");
  }
}

app.post("/notification", notifyClients);

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

app.post("/download", async (req, res) => {
  console.log("starting download");
  const fileId = req.body.id;
  const name = req.body.name;
  const dest = fs.createWriteStream(`./${name}`);
  return drive.files
    .get({ fileId, fileId: "media" }, { responseType: "stream" })
    .then((res) => {
      return new Promise((resolve, reject) => {
        let progress = 0;

        res.data
          .on("end", () => {
            console.log("Done downloading file.");
          })
          .on("error", (err) => {
            console.error("Error downloading file.");
            reject(err);
          })
          .on("data", (d) => {
            progress += d.length;
            if (process.stdout.isTTY) {
              process.stdout.clearLine();
              process.stdout.cursorTo(0);
              process.stdout.write(`Downloaded ${progress} bytes`);
            }
          })
          .pipe(dest);
      });
    });
});

app.get("/files", async (req, res) => {
  console.log("getting files");
  files = await getFiles();
  res.send(JSON.stringify(files));
});

const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
