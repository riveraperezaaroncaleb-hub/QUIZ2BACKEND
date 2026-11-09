const express = require('express');
const controller = require('../controllers/proveedorController');

const router = express.Router();

router.route('/')
  .get(controller.listar)
  .post(controller.crear);
router.route('/:id')
  .get(controller.obtenerPorId)
  .patch(controller.actualizar)
  .delete(controller.eliminar);

module.exports = router;
