const express = require('express');
const controller = require('../controllers/movimientoController');

const router = express.Router();

router.get('/', controller.listar);
router.get('/:id', controller.obtenerPorId);
router.post('/', controller.registrarMovimiento);

module.exports = router;
