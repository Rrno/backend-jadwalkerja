// Baris "sakti" untuk mencegah error ERR_STREAM_PREMATURE_CLOSE
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Load credentials
const googleCredentials = JSON.parse(process.env.GOOGLE_CREDS_JSON);
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const auth = new google.auth.JWT(
  googleCredentials.client_email,
  null,
  googleCredentials.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

const sheets = google.sheets({ version: 'v4', auth });

app.post('/api/sync/upload', async (req, res) => {
  const { username, email, attendanceData } = req.body; 
  
  try {
    const rows = attendanceData.map(item => [
      username || "Anonim",
      email || "Tidak ada email",
      item.tanggal,
      item.status,
      item.wage,
      item.bon
    ]);

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:F', 
      valueInputOption: 'USER_ENTERED',
      resource: { values: rows },
    });

    res.status(200).json({ success: true, message: "Sinkronisasi Berhasil" });
  } catch (error) {
    console.error("Error Google Sheets:", error);
    res.status(500).json({ success: false, message: "Gagal menulis ke Google Sheets", error: error.message });
  }
});

// Port Railway yang fleksibel
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server backend berjalan di port ${PORT}`);
});
