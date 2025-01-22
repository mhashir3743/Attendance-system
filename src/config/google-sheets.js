const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const path = require('path');
const fs = require('fs');

// Load credentials from file
const credentials = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'credentials.json'), 'utf8')
);

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const SPREADSHEET_ID = 'your-spreadsheet-id'; // Get this from your Google Sheet URL

const auth = new JWT({
  email: credentials.client_email,
  key: credentials.private_key,
  scopes: SCOPES,
});

const sheets = google.sheets({ version: 'v4', auth });

module.exports = { sheets, SPREADSHEET_ID }; 