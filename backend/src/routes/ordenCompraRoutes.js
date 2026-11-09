const express = require('express');
const controller = require('../controllers/ordenCompraController');

const router = express.Router();

router.get('/posibles-duplicados', controller.listarPosiblesDuplicados);
router.route('/')
  .get(controller.listar)
  .post(controller.crear);
router.route('/:id')
  .get(controller.obtenerPorId)
  .patch(controller.actualizar)
  .delete(controller.eliminar);

module.exports = router;
