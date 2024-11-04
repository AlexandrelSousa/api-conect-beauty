// /api/app.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const cors = require('./middleware/cors');
const upload = require('./config/multer');
const pool = require('./db');

dotenv.config();

const app = express();

app.use(express.json());

// CORS Middleware
app.use((req, res, next) => cors(req, res, next));

// Test Route
app.get('/', (req, res) => res.send('API is running'));

module.exports = app;
