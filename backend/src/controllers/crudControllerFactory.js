function createCrudController(model, options = {}) {
  const {
    fields = [],
    include = [],
    order = [['id', 'ASC']],
    parentParam,
    parentForeignKey,
    parentModel,
  } = options;

  function getValues(body = {}) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
    return Object.fromEntries(
      fields
        .filter((field) => Object.prototype.hasOwnProperty.call(body, field))
        .map((field) => [field, body[field]]),
    );
  }

  function buscarPorSolicitud(req, options = {}) {
    const where = { id: req.params.id };
    if (parentParam) where[parentForeignKey] = req.params[parentParam];
    return model.findOne({ where, ...options });
  }

  async function listar(req, res, next) {
    try {
      const where = parentParam
        ? { [parentForeignKey]: req.params[parentParam] }
        : undefined;
      const rows = await model.findAll({ where, include, order });
      return res.json({ total: rows.length, datos: rows });
    } catch (error) {
      return next(error);
    }
  }

  async function obtenerPorId(req, res, next) {
    try {
      const row = await buscarPorSolicitud(req, { include });
      if (!row) return res.status(404).json({ error: 'Registro no encontrado.' });
      return res.json(row);
    } catch (error) {
      return next(error);
    }
  }

  async function crear(req, res, next) {
    try {
      const values = getValues(req.body);
      if (parentParam) {
        if (parentModel) {
          const parent = await parentModel.findByPk(req.params[parentParam]);
          if (!parent) return res.status(404).json({ error: 'Registro relacionado no encontrado.' });
        }
        values[parentForeignKey] = req.params[parentParam];
      }

      const row = await model.create(values);
      const result = include.length
        ? await model.findByPk(row.id, { include })
        : row;
      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  }

  async function actualizar(req, res, next) {
    try {
      const row = await buscarPorSolicitud(req);
      if (!row) return res.status(404).json({ error: 'Registro no encontrado.' });

      const values = getValues(req.body);
      if (Object.keys(values).length === 0) {
        return res.status(400).json({ error: 'Envía al menos un campo válido para actualizar.' });
      }

      await row.update(values);
      const result = include.length
        ? await model.findByPk(row.id, { include })
        : row;
      return res.json(result);
    } catch (error) {
      return next(error);
    }
  }

  async function eliminar(req, res, next) {
    try {
      const row = await buscarPorSolicitud(req);
      if (!row) return res.status(404).json({ error: 'Registro no encontrado.' });

      await row.destroy();
      return res.status(204).end();
    } catch (error) {
      return next(error);
    }
  }

  return { listar, obtenerPorId, crear, actualizar, eliminar };
}

module.exports = createCrudController;
