const express = require('express');
const router = express.Router();
const { getLatestNews } = require('../controllers/news.controller');

router.get('/', getLatestNews);

module.exports = router;
