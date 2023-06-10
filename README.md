# How to run
1. Start server by running `node server.js` in strac/app/server
2. Run `npm start` in strac/app/src
3. Perform file operations at `https://drive.google.com/drive/folders/12jB1TZnLgaAsI8WpKoi4TesSxSI_6_ul?usp=sharing`

# How it works
- The backend authenticates with Google Drive API using a service account called strac-195@strac-389317.iam.gserviceaccount.com
- Uses LocalTunnel to set up a webhook endpoint to receive push notifications from Google Drive API whenever changes occur to files where strac-195@strac-389317.iam.gserviceaccount.com is a user
- Whenever it receives a push notification it communicates via websocket to frontend to rerender the file and file permissions
