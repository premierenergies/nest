const express = require('express');
const mssql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const https = require('https');
const app = express();

// Database configuration
const dbConfig = {
  user: "SPOT_USER",
  password: "Premier#3801",
  server: "10.0.40.10",
  port: 1433,
  database: "SPOT_UAT",
  options: {
    trustServerCertificate: true,
    encrypt: false,
    connectionTimeout: 60000,
  },
};

// Create and connect MSSQL pool
const pool = new mssql.ConnectionPool(dbConfig);
pool.connect()
  .then(() => {
    console.log('Connected to MSSQL database');
  })
  .catch(err => {
    console.error('Database Connection Failed!', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files for uploaded attachments
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directories exist
const uploadDirs = [
  path.join(__dirname, 'uploads/photos'),
  path.join(__dirname, 'uploads/drawings')
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Multer storage configuration based on attachment type
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const type = req.query.type;
    let uploadPath;
    if (type === 'photo') {
      uploadPath = path.join(__dirname, 'uploads/photos');
    } else if (type === 'drawing') {
      uploadPath = path.join(__dirname, 'uploads/drawings');
    } else {
      return cb(new Error('Invalid attachment type'), null);
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/equipment', async (req, res) => {
  const { line } = req.query;
  try {
    const request = pool.request();
    let query;
    if (line) {
      request.input('line', mssql.VarChar, line);
      query = 'SELECT * FROM EquipmentSpareData WHERE Line = @line ORDER BY SlNo';
    } else {
      query = 'SELECT * FROM EquipmentSpareData ORDER BY SlNo';
    }
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    console.error('Error fetching equipment:', err);
    res.status(500).json({ error: 'Failed to fetch equipment data' });
  }
});

app.get('/api/equipment/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const request = pool.request();
    request.input('id', mssql.Int, id);
    const result = await request.query('SELECT * FROM EquipmentSpareData WHERE SlNo = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Error fetching equipment item:', err);
    res.status(500).json({ error: 'Failed to fetch equipment item' });
  }
});

app.get('/api/equipment/:id/attachments', async (req, res) => {
  const { id } = req.params;
  const { type } = req.query;
  if (!type || (type !== 'photo' && type !== 'drawing')) {
    return res.status(400).json({ error: 'Invalid or missing attachment type' });
  }
  try {
    const request = pool.request();
    request.input('id', mssql.Int, id);
    const result = await request.query('SELECT * FROM EquipmentSpareData WHERE SlNo = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    const equipment = result.recordset[0];
    let attachments = [];
    if (type === 'photo') {
      attachments = equipment.UploadPhotos ? JSON.parse(equipment.UploadPhotos) : [];
    } else {
      attachments = equipment.Drawing ? JSON.parse(equipment.Drawing) : [];
    }
    res.json(attachments);
  } catch (err) {
    console.error('Error fetching attachments:', err);
    res.status(500).json({ error: 'Failed to fetch attachments' });
  }
});

app.post('/api/equipment/:id/upload', upload.array('files'), async (req, res) => {
  const { id } = req.params;
  const { type, mode } = req.query;

  if (!type || (type !== 'photo' && type !== 'drawing')) {
    return res.status(400).json({ error: 'Invalid or missing attachment type' });
  }
  if (!mode || (mode !== 'append' && mode !== 'replace')) {
    return res.status(400).json({ error: 'Invalid or missing mode. Should be "append" or "replace".' });
  }
  try {
    const request = pool.request();
    request.input('id', mssql.Int, id);
    const result = await request.query('SELECT * FROM EquipmentSpareData WHERE SlNo = @id');
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    const equipment = result.recordset[0];
    const columnName = type === 'photo' ? 'UploadPhotos' : 'Drawing';
    let existingAttachments = [];
    if (equipment[columnName]) {
      try {
        existingAttachments = JSON.parse(equipment[columnName]);
      } catch (err) {
        existingAttachments = [];
      }
    }
    if (mode === 'replace' && existingAttachments.length > 0) {
      for (const att of existingAttachments) {
        const filePath = path.join(__dirname, att.url);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
      existingAttachments = [];
    }
    const uploadedFiles = req.files;
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }
    const newAttachments = uploadedFiles.map(file => {
      let fileUrl = '/uploads';
      if (type === 'photo') {
        fileUrl += '/photos/' + file.filename;
      } else {
        fileUrl += '/drawings/' + file.filename;
      }
      return {
        name: file.originalname,
        url: fileUrl,
        type: type
      };
    });
    const updatedAttachments = mode === 'append'
      ? existingAttachments.concat(newAttachments)
      : newAttachments;
    const updateRequest = pool.request();
    updateRequest.input('attachments', mssql.NVarChar(mssql.MAX), JSON.stringify(updatedAttachments));
    updateRequest.input('id', mssql.Int, id);
    const updateQuery = type === 'photo'
      ? 'UPDATE EquipmentSpareData SET UploadPhotos = @attachments WHERE SlNo = @id'
      : 'UPDATE EquipmentSpareData SET Drawing = @attachments WHERE SlNo = @id';
    await updateRequest.query(updateQuery);
    res.json({
      message: `Attachments ${mode === 'replace' ? 'replaced' : 'added'} successfully`,
      attachments: updatedAttachments
    });
  } catch (err) {
    console.error('Error uploading attachments:', err);
    res.status(500).json({ error: 'Failed to upload attachments' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// HTTPS Deployment Section
const PORT = process.env.PORT || 40443;  // Using a common port for both
const HOST = process.env.HOST || "10.0.50.16";

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "certs", "mydomain.key"), "utf8"),
  cert: fs.readFileSync(path.join(__dirname, "certs", "d466aacf3db3f299.crt"), "utf8"),
  ca: fs.readFileSync(path.join(__dirname, "certs", "gd_bundle-g2-g1.crt"), "utf8"),
};

// Start the server
const startServer = async () => {
  try {
    https.createServer(httpsOptions, app).listen(PORT, HOST, () => {
      console.log(`HTTPS Server running at https://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("Error starting the server:", error);
    process.exit(1);
  }
};

startServer();