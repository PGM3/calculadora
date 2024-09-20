const express = require('express')
const router = express.Router()
const controller = require('../controllers/index.controller')

//RUTAS

//app.use(requiere('./routes/index.routes'))

router.get('/', controller.index)

module.exports = router