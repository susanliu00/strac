const { google } = require("googleapis");
const express = require("express");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const localtunnel = require("localtunnel");
var bodyParser = require("body-parser");

const port = 3000;
const app = express();
app.use(bodyParser.json());

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
  console.log("pageToken:");
  console.log(pageToken);
  tunnel_url = tunnel.url;
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

function getFiles() {
  files = [];
  drive.files.list(
    {
      pageSize: 10,
      fields: "nextPageToken, files(name, id)",
    },
    (err, res) => {
      if (err) return console.error("The API returned an error:", err.message);

      files = res.data.files;
    }
  );

  res = {};

  files.forEach((file) => {
    drive.permissions.list(
      { fileId: file.id, fields: "permissions(displayName)" },
      (err, res) => {
        if (err)
          return console.error("The API returned an error:", err.message);
        const permissions = res.data.permissions;
        res[file.id] = permissions;
      }
    );
  });
  return res;
}

// drive.files.list(
//   {
//     pageSize: 10,
//     fields: "nextPageToken, files(name, id)",
//   },
//   (err, res) => {
//     if (err) return console.error("The API returned an error:", err.message);

//     const files = res.data.files;
//     console.log("FILES", files);
//     if (files.length) {
//       console.log("Files:");
//       files.forEach(async (file) => {
//         console.log(`${file.name} (${file.id})`);

//         await drive.permissions.list(
//           { fileId: file.id, fields: "permissions(displayName)" },
//           (err, res) => {
//             if (err)
//               return console.error("The API returned an error:", err.message);
//             const permissions = res.data.permissions;
//             console.log("User Access:");
//             permissions.forEach((p) => {
//               console.log(`${p.displayName}`);
//             });
//           }
//         );
//       });
//     } else {
//       console.log("No files found.");
//     }
//   }
// );

app.post("/notification", (req, res) => {
  //   const channelId = req.headers["x-goog-channel-id"];
  //   const resourceId = req.headers["x-goog-resource-id"];
  //   const state = req.headers["x-goog-resource-state"];
  //   const notification = req.body;
  //   console.log("Received push notification:");
  //   console.log("Channel ID:", channelId);
  //   console.log("Resource ID:", resourceId);
  //   console.log("Change Type:", state);
  //   console.log(req.headers);
  //   console.log(req);
  //   console.log(res);
  // Handle the push notification
  // Process the notification data as per your application's requirements

  res.sendStatus(200);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
