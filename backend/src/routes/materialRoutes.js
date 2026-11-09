const express = require('express');
const controller = require('../controllers/materialController');

const router = express.Router();

router.get('/alertas/reorden', controller.listarAlertasReorden);
router.get('/materiales/:id/stock', controller.obtenerStock);
router.route('/materiales')
  .get(controller.listar)
  .post(controller.crear);
router.route('/materiales/:id')
  .get(controller.obtenerPorId)
  .patch(controller.actualizar)
  .delete(controller.eliminar);

module.exports = router;
