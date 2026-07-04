// Baris ini untuk mencegah error koneksi ke Google API
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const express = require('express');
const { google } = require('googleapis');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

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
  
  if (!attendanceData || attendanceData.length === 0) {
    return res.status(400).json({ success: false, message: "Data kosong" });
  }

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server backend berjalan di port ${PORT}`);
});
