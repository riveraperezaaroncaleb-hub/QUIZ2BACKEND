const express = require('express');
const controller = require('../controllers/detalleOCController');

const router = express.Router({ mergeParams: true });

router.route('/')
  .get(controller.listar)
  .post(controller.crear);
router.route('/:id')
  .get(controller.obtenerPorId)
  .patch(controller.actualizar)
  .delete(controller.eliminar);

module.exports = router;
