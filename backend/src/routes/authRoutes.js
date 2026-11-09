const express = require('express');
const { registrar, iniciarSesion, obtenerSesion } = require('../controllers/authController');
const autenticar = require('../middleware/autenticar');

const router = express.Router();

router.post('/register', registrar);
router.post('/login', iniciarSesion);
router.get('/me', autenticar, obtenerSesion);

module.exports = router;
