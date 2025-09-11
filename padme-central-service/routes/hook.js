const express = require('express');
var router = express.Router();

const hookController = require('../controllers').hook;
const harborUtil = require('../utils').harbor;

router.post('/', harborUtil.authWebhookSecret, hookController.handler);

module.exports = router;
