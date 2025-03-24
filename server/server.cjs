// server.cjs
const express = require('express');
const mssql = require('mssql');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const https = require('https');
const dotenv = require('dotenv');
dotenv.config();

const { Client } = require("@microsoft/microsoft-graph-client");
const { ClientSecretCredential } = require("@azure/identity");
require("isomorphic-fetch");

const app = express();

// Use CORS with specific origins and methods
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://14.194.111.58:3000",
    "http://spot.premierenergies.com",
    "http://spot.premierenergies.com:3000",
    "http://spot.premierenergies.com/login",
    "https://14.194.111.58:3000",
    "https://spot.premierenergies.com",
    "https://spot.premierenergies.com:3000",
    "https://spot.premierenergies.com/login"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
}));
app.options("*", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve static files from the "dist" folder
app.use(express.static(path.join(__dirname, 'dist')));

// Serve static files for uploaded attachments
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// For equipment endpoints (current project)
const dbConfigUAT = {
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

// For authentication endpoints (old project)
const authDbConfig = {
  user: "SPOT_USER",
  password: "Premier#3801",
  server: "10.0.40.10",
  port: 1433,
  database: "SPOT",
  options: {
    trustServerCertificate: true,
    encrypt: false,
    connectionTimeout: 60000,
  },
};

// Create and connect MSSQL pool for equipment endpoints
const pool = new mssql.ConnectionPool(dbConfigUAT);
pool.connect()
  .then(() => {
    console.log('Connected to SPOT_UAT database');
  })
  .catch(err => {
    console.error('Database Connection Failed!', err);
    process.exit(1);
  });

const uploadDirs = [
  path.join(__dirname, 'uploads/photos'),
  path.join(__dirname, 'uploads/drawings')
];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

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
const uploadMulter = multer({ storage: storage });

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

app.post('/api/equipment/:id/upload', uploadMulter.array('files'), async (req, res) => {
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

// Microsoft Graph configuration for sending emails
const CLIENT_ID = "3d310826-2173-44e5-b9a2-b21e940b67f7";
const TENANT_ID = "1c3de7f3-f8d1-41d3-8583-2517cf3ba3b1";
const CLIENT_SECRET = "2e78Q~yX92LfwTTOg4EYBjNQrXrZ2z5di1Kvebog";
const SENDER_EMAIL = "spot@premierenergies.com";

const credential = new ClientSecretCredential(TENANT_ID, CLIENT_ID, CLIENT_SECRET);
const graphClient = Client.initWithMiddleware({
  authProvider: {
    getAccessToken: async () => {
      const tokenResponse = await credential.getToken("https://graph.microsoft.com/.default");
      return tokenResponse.token;
    },
  },
});

// Function to send an email using Microsoft Graph API
async function sendEmail(toEmail, subject, content, attachments = []) {
  try {
    const message = {
      subject: subject,
      body: {
        contentType: "HTML",
        content: content,
      },
      toRecipients: [
        {
          emailAddress: {
            address: toEmail,
          },
        },
      ],
    };

    if (attachments && attachments.length > 0) {
      message.attachments = attachments.map((file) => ({
        "@odata.type": "#microsoft.graph.fileAttachment",
        Name: file.originalname,
        ContentType: file.mimetype,
        ContentBytes: fs.readFileSync(file.path, { encoding: "base64" }),
      }));
    }

    await graphClient
      .api(`/users/${SENDER_EMAIL}/sendMail`)
      .post({ message, saveToSentItems: "true" });

    console.log(`Email sent to ${toEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// POST /api/send-otp
app.post("/api/send-otp", async (req, res) => {
  const { email } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    await mssql.connect(authDbConfig);

    const loginCheck = await mssql.query`SELECT LPassword FROM Login WHERE Username = ${fullEmail}`;
    if (
      loginCheck.recordset.length > 0 &&
      loginCheck.recordset[0].LPassword !== null
    ) {
      return res.status(400).json({
        message:
          "An account associated with this email already exists, please login instead",
      });
    }

    const result = await mssql.query`SELECT EmpID FROM EMP WHERE EmpEmail = ${fullEmail} AND ActiveFlag = 1`;
    if (result.recordset.length > 0) {
      const empID = result.recordset[0].EmpID;
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiryTime = new Date(Date.now() + 5 * 60000);
      await mssql.query`
          MERGE Login AS target
          USING (SELECT ${fullEmail} AS Username) AS source
          ON (target.Username = source.Username)
          WHEN MATCHED THEN 
            UPDATE SET OTP = ${otp}, OTP_Expiry = ${expiryTime}
          WHEN NOT MATCHED THEN
            INSERT (Username, OTP, OTP_Expiry, LEmpID)
            VALUES (${fullEmail}, ${otp}, ${expiryTime}, ${empID});
      `;
      const subject = "Your OTP Code";
      const content = `<p>Your OTP code is: <strong>${otp}</strong></p>`;
      await sendEmail(fullEmail, subject, content);
      res.status(200).json({ message: "OTP sent successfully" });
    } else {
      res.status(404).json({
        message:
          "We do not have a @premierenergies email address registered for you. If you have a company email ID, please contact HR to get it updated or contact your manager to raise a ticket on your behalf.",
      });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/verify-otp
app.post("/api/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    await mssql.connect(authDbConfig);
    const result = await mssql.query`
        SELECT OTP, OTP_Expiry FROM Login WHERE Username = ${fullEmail} AND OTP = ${otp}
      `;
    if (result.recordset.length > 0) {
      const otpExpiry = result.recordset[0].OTP_Expiry;
      const currentTime = new Date();
      if (currentTime < otpExpiry) {
        res.status(200).json({ message: "OTP verified successfully" });
      } else {
        res.status(400).json({ message: "OTP has expired. Please request a new one." });
      }
    } else {
      res.status(400).json({ message: "Invalid OTP" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/register
app.post("/api/register", async (req, res) => {
  const { email, password } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    await mssql.connect(authDbConfig);
    const checkResult = await mssql.query`
      SELECT LPassword FROM Login WHERE Username = ${fullEmail}
    `;
    if (
      checkResult.recordset.length > 0 &&
      checkResult.recordset[0].LPassword !== null
    ) {
      return res.status(400).json({
        message: "An account already exists with this account",
      });
    }
    const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])(?=.{8,})/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({
        message:
          "Password must be at least 8 characters long and contain at least one number and one special character.",
      });
    }
    await mssql.query`
      UPDATE Login SET LPassword = ${password}
      WHERE Username = ${fullEmail}
    `;
    res.status(200).json({ message: "Registration completed successfully" });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    await mssql.connect(authDbConfig);
    const result = await mssql.query`
        SELECT * FROM Login WHERE Username = ${fullEmail} AND LPassword = ${password}
      `;
    if (result.recordset.length > 0) {
      res.status(200).json({
        message: "Login successful",
        empID: result.recordset[0].LEmpID,
      });
    } else {
      res.status(401).json({ message: "Your Username or Password are incorrect" });
    }
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/forgot-password
app.post("/api/forgot-password", async (req, res) => {
  const { email, password } = req.body;
  const fullEmail = `${email}@premierenergies.com`;

  try {
    await mssql.connect(authDbConfig);
    await mssql.query`
      UPDATE Login SET LPassword = ${password}
      WHERE Username = ${fullEmail}
    `;
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/logout
app.post("/api/logout", (req, res) => {
  // Invalidate session if applicable.
  res.status(200).json({ message: "Logout successful" });
});


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


const PORT = process.env.PORT || 40443;
const HOST = process.env.HOST || "0.0.0.0";

const httpsOptions = {
  key: fs.readFileSync(path.join(__dirname, "certs", "mydomain.key"), "utf8"),
  cert: fs.readFileSync(path.join(__dirname, "certs", "d466aacf3db3f299.crt"), "utf8"),
  ca: fs.readFileSync(path.join(__dirname, "certs", "gd_bundle-g2-g1.crt"), "utf8"),
};

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
