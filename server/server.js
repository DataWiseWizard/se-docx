const path = require('path');
const fs = require('fs');
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const winston = require('winston');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const documentRoutes = require('./routes/documentRoutes');
const authRoutes = require('./routes/authRoutes');
const auditRoutes = require('./routes/auditRoutes');
const folderRoutes = require('./routes/folderRoutes');
const app = express();

connectDB();

app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: [process.env.CLIENT_URL,
    'http://localhost:5173',
    'https://vault.pinch.site'
  ],
  credentials: true
}));


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({ format: winston.format.simple() })
  ],
});

app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/folders', folderRoutes);


const distPath = path.join(__dirname, '../client/dist');

if (fs.existsSync(distPath)) {
  console.log(`✅ Frontend build found at: ${distPath}`);
} else {
  console.error(`❌ CRITICAL ERROR: Frontend build NOT found at: ${distPath}`);
  console.error(`   Did you run 'npm run build' in the client folder?`);
}

app.use(express.static(distPath));

app.get(/.*/, (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API Endpoint Not Found' });
  }

  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send(`
      <h1>Server Error</h1>
      <p>Frontend is missing. The server cannot find <code>index.html</code>.</p>
      <p>Path looked for: <code>${indexPath}</code></p>
    `);
  }
});


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`[Server] Running on port ${PORT}`);
  logger.info(`[Server] Environment: ${process.env.NODE_ENV || 'undefined'}`);
});