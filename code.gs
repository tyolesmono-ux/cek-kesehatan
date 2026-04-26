/**
 * KONFIGURASI UTAMA
 * Pastikan Anda mengganti FOLDER_ID dengan ID folder Google Drive tempat file akan disimpan.
 */
const CONFIG = {
  SHEET_NAME: "Data Pendataan",
  FOLDER_ID: "1s6PNBeYOXW4tfbovQ1C2l9fOIyqkRWvx",
  ADMIN_PASSWORD: "Zalina_99"
};

/**
 * Fungsi inisialisasi awal.
 * Jalankan fungsi ini SEKALI SECARA MANUAL dari editor untuk membuat header kolom di Spreadsheet.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  
  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.SHEET_NAME);
    const headers = [
      "Timestamp", "NIP", "Nama", "Gender", "Status Hamil", 
      "Kehadiran", "Alasan Absen", "Nominal Bayar", "URL Bukti Bayar", "Keterangan"
    ];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    sheet.setFrozenRows(1);
  }
}

/**
 * ENDPOINT GET (API Dashboard & Master Data)
 * action=master -> Publik (Tanpa password)
 * action=dashboard -> Privat (Butuh password)
 */
function doGet(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : null;
    const pwd = e && e.parameter ? e.parameter.pwd : null;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    let masterPeserta = [];
    const sheetPeserta = ss.getSheetByName("Data_Peserta");
    if (sheetPeserta) {
      const pData = sheetPeserta.getDataRange().getValues();
      if (pData.length > 1) {
        const pRows = pData.slice(1);
        masterPeserta = pRows.map(r => ({
          nama: String(r[1] || "").trim(),
          unit: String(r[2] || "").trim()
        })).filter(p => p.nama !== "");
      }
    }

    // 1. Endpoint Publik (Hanya Master Data & Status Nama)
    if (action === "master") {
      let submittedNames = [];
      const sheetData = ss.getSheetByName(CONFIG.SHEET_NAME);
      if (sheetData) {
        const sData = sheetData.getDataRange().getValues();
        if (sData.length > 1) {
          const idxNama = sData[0].indexOf("Nama");
          if (idxNama !== -1) {
             submittedNames = sData.slice(1).map(r => String(r[idxNama] || "").trim());
          }
        }
      }
      
      return createJsonResponse({
        status: "success",
        data: {
          masterPeserta: masterPeserta,
          submittedNames: submittedNames
        }
      });
    }

    // 2. Proteksi Password untuk Dashboard
    if (pwd !== CONFIG.ADMIN_PASSWORD) {
      return createJsonResponse({ 
        status: "unauthorized", 
        message: "Password salah atau akses ditolak." 
      });
    }

    // Default Dashboard API (Sudah lolos password)
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    // Jika data kosong (hanya header atau tidak ada data)
    if (data.length <= 1) {
       return createJsonResponse({
          status: "success",
          data: { total: 0, hadir: 0, absen: 0, totalDana: 0, headers: [], rows: [], masterPeserta: masterPeserta }
       });
    }

    const headers = data[0];
    const rows = data.slice(1);
    
    let total = rows.length;
    let hadir = 0;
    let absen = 0;
    let totalDana = 0;
    
    const idxKehadiran = headers.indexOf("Kehadiran");
    const idxDana = headers.indexOf("Nominal Bayar");
    
    rows.forEach(row => {
      // Hitung Kehadiran (Case-insensitive)
      const kehadiran = String(row[idxKehadiran] || "").toLowerCase().trim();
      if (kehadiran === "hadir") {
        hadir++;
      } else if (kehadiran === "absen" || kehadiran === "tidak hadir") {
        absen++;
      }
      
      // Hitung Total Dana
      const dana = parseFloat(row[idxDana]) || 0;
      totalDana += dana;
    });
    
    return createJsonResponse({
      status: "success",
      data: {
        total: total,
        hadir: hadir,
        absen: absen,
        totalDana: totalDana,
        headers: headers,
        rows: rows,
        masterPeserta: masterPeserta
      }
    });
    
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * ENDPOINT POST (API Submit Data)
 * Menerima payload JSON dari frontend untuk disimpan ke Sheet dan upload file.
 */
function doPost(e) {
  try {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    if (!sheet) {
      setup();
      sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
    }
    
    // Parsing payload dari request
    // Frontend disarankan mengirim menggunakan method 'POST' dengan format JSON text
    let payload;
    try {
      payload = JSON.parse(e.postData.contents);
    } catch(err) {
      return createJsonResponse({ status: "error", message: "Format payload harus berupa JSON." });
    }
    
    // 1. Validasi NIP (wajib 18 digit angka)
    const nip = payload.nip || "";
    if (!/^\d{18}$/.test(nip)) {
      return createJsonResponse({
        status: "error",
        message: "NIP tidak valid. Harus terdiri dari tepat 18 digit angka."
      });
    }
    
    // 2. Proses Upload File Bukti Bayar ke Google Drive (Jika Ada)
    let fileUrl = "";
    if (payload.fileBase64 && payload.fileName && payload.mimeType) {
      fileUrl = uploadFileToDrive(payload.fileBase64, payload.fileName, payload.mimeType);
    }
    
    // 3. Susun data untuk disimpan ke baris baru
    const timestamp = new Date();
    const rowData = [
      timestamp,
      "'" + nip, // Ditambahkan single quote agar NIP tidak berubah format menjadi angka scientific di Excel/Sheet
      payload.nama || "",
      payload.gender || "",
      payload.statusHamil || "",
      payload.kehadiran || "",
      payload.alasanAbsen || "",
      payload.nominalBayar || 0,
      fileUrl,
      payload.keterangan || ""
    ];
    
    // Simpan ke spreadsheet
    sheet.appendRow(rowData);
    
    return createJsonResponse({
      status: "success",
      message: "Data tes kesehatan berhasil disimpan.",
      data: {
        nip: nip,
        fileUrl: fileUrl
      }
    });
    
  } catch (error) {
    return createJsonResponse({ status: "error", message: error.toString() });
  }
}

/**
 * Fungsi Bantuan: Upload file base64 ke Google Drive
 */
function uploadFileToDrive(base64Data, filename, mimeType) {
  try {
    const folder = DriveApp.getFolderById(CONFIG.FOLDER_ID);
    
    // Hapus prefix mimeType pada base64 jika terbawa dari frontend (contoh: "data:image/jpeg;base64,...")
    const cleanBase64 = base64Data.split(',').pop(); 
    
    const decodedData = Utilities.base64Decode(cleanBase64);
    const blob = Utilities.newBlob(decodedData, mimeType, filename);
    const file = folder.createFile(blob);
    
    // Opsional: Atur file agar siapa saja yang memiliki link bisa melihatnya (Viewer)
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return file.getUrl();
  } catch (error) {
    throw new Error("Gagal mengupload file ke Drive: " + error.toString());
  }
}

/**
 * Fungsi Bantuan: Buat response standard JSON
 */
function createJsonResponse(responseObject) {
  return ContentService.createTextOutput(JSON.stringify(responseObject))
    .setMimeType(ContentService.MimeType.JSON);
}