const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load Google Credentials dari Environment Variables Railway
const googleCredentials = JSON.parse(process.env.GOOGLE_CREDS_JSON);
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const auth = new google.auth.JWT(
  googleCredentials.client_email,
  null,
  googleCredentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

// Endpoint Autentikasi Dummy (Bisa dikembangkan dengan JWT & Database asli)
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (username === "admin" && password === "password123") {
    res.status(200).json({ success: true, token: "dummy-jwt-token", message: "Login Berhasil" });
  } else {
    res.status(401).json({ success: false, message: "Username atau password salah" });
  }
});

// Endpoint untuk Sinkronisasi Upload Data dari Android Room
app.post('/api/sync/upload', async (req, res) => {
  const { attendanceData } = req.body; 
  // Struktur data diharapkan: [{ tanggal: "2026-07-04", status: "Hadir", wage: 80000, bon: 0 }]
  
  try {
    const rows = attendanceData.map(item => [
      item.tanggal,
      item.status,
      item.wage,
      item.bon
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    res.status(200).json({ success: true, message: "Data berhasil disinkronkan ke Google Sheets" });
  } catch (error) {
    console.error("Error Google Sheets:", error);
    res.status(500).json({ success: false, message: "Gagal menulis ke Google Sheets", error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server backend berjalan di port ${PORT}`);
});
