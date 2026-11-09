const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { getJwtSecret } = require('../services/tokenService');

async function autenticar(req, res, next) {
  const authorization = req.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Se requiere un token Bearer.' });
  }

  try {
    const token = authorization.slice('Bearer '.length).trim();
    if (!token) return res.status(401).json({ error: 'Token no proporcionado.' });

    let payload;
    try {
      payload = jwt.verify(token, getJwtSecret(), {
        issuer: 'inventario-constructora-del-valle',
        audience: 'inventario-api',
      });
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token inválido o expirado.' });
      }
      throw error;
    }

    if (!payload || typeof payload !== 'object' || !payload.sub) {
      return res.status(401).json({ error: 'Token inválido.' });
    }

    const usuario = await Usuario.findByPk(payload.sub, {
      attributes: ['id', 'nombre', 'correo'],
    });
    if (!usuario) return res.status(401).json({ error: 'La cuenta del token ya no está disponible.' });

    req.usuario = usuario;
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = autenticar;
