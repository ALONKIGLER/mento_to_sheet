const express = require("express");
const app = express();
const cors = require("cors");

app.use(cors());
app.use(express.json());

/**
 * @license
 * Copyright Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
// [START sheets_quickstart]

const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

// If modifying these scopes, delete token.json.
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = "token.json";

// Load client secrets from a local file.
fs.readFile("credentials.json", (err, content) => {
  if (err) return console.log("Error loading client secret file:", err);
  // Authorize a client with credentials, then call the Google Sheets API.
  authorize(JSON.parse(content), writeData);
});

/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, data) {
  const { client_secret, client_id, redirect_uris } = credentials.web;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback, data);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client, data);
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url:", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the code from that page here: ", (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err)
        return console.error(
          "Error while trying to retrieve access token",
          err
        );
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log("Token stored to", TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/**
 * Prints the names and majors of students in a sample spreadsheet:
 * @see https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 * @param {google.auth.OAuth2} auth The authenticated Google OAuth client.
 */
function listMajors(auth) {
  const sheets = google.sheets({ version: "v4", auth });
  sheets.spreadsheets.values.get(
    {
      spreadsheetId: "1PUBAErPVfhRe-eRjDMUJNps9x46DunQMQYs2oSMtirE",
      range: "Class Data!A2:E",
    },
    (err, res) => {
      if (err) return console.log("The API returned an error: " + err);
      const rows = res.data.values;
      if (rows.length) {
        console.log("Name, Major:");
        // Print columns A and E, which correspond to indices 0 and 4.
        rows.map((row) => {
          console.log(`${row[0]}, ${row[4]}`);
        });
      } else {
        console.log("No data found.");
      }
    }
  );
}
// [END sheets_quickstart]

module.exports = {
  SCOPES,
  listMajors,
};

function writeData(auth, data) {
  const sheets = google.sheets({ version: "v4", auth });

  if (data) {
    const values = [
      [
        data.firstName,
        data.link,
        data.year,
        data.email,
        data.phone,
        data.selectedOption,
      ],
    ];
    const resource = {
      values,
    };
    sheets.spreadsheets.values.append(
      {
        spreadsheetId: "1PUBAErPVfhRe-eRjDMUJNps9x46DunQMQYs2oSMtirE",
        range: "Sheet1",
        valueInputOption: "RAW",
        resource: resource,
      },
      (err, result) => {
        if (err) {
          // Handle error
          console.log(err);
        } else {
          console.log(
            "%d cells updated on range: %s",
            result.data.updates.updatedCells,
            result.data.updates.updatedRange
          );
        }
      }
    );
  } else {
    const values = [["data.firstName", "data.link"]];
    const resource = {
      values,
    };
    sheets.spreadsheets.values.append(
      {
        spreadsheetId: "1PUBAErPVfhRe-eRjDMUJNps9x46DunQMQYs2oSMtirE",
        range: "Sheet1",
        valueInputOption: "RAW",
        resource: resource,
      },
      (err, result) => {
        if (err) {
          // Handle error
          console.log(err);
        } else {
          console.log(
            "%d cells updated on range: %s",
            result.data.updates.updatedCells,
            result.data.updates.updatedRange
          );
        }
      }
    );
  }
}

app.get("/", (req, res) => {
  res.send("Hello,the service is live 🎉!");
});

app.post("/", (req, res) => {
  const data = req.body;
  console.log(data);
  if (!data) {
    res.status(400).send("No data provided");
    return;
  }

  fs.readFile("credentials.json", (err, content) => {
    if (err) {
      console.log("Error loading client secret file:", err);
      res.status(500).send("Error loading client secret file");
      return;
    }

    authorize(JSON.parse(content), writeData, data);
    res.send("Data write process initiated");
  });
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
