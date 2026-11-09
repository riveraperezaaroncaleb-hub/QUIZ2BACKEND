const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');
const { crearToken, getJwtSecret } = require('../services/tokenService');

const ROUNDS_HASH = 12;

function datosPublicos(usuario) {
  return { id: usuario.id, nombre: usuario.nombre, correo: usuario.correo };
}

async function registrar(req, res, next) {
  const { nombre, correo, password } = req.body || {};
  if (
    typeof nombre !== 'string'
    || !nombre.trim()
    || typeof correo !== 'string'
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
    || typeof password !== 'string'
    || password.length < 8
  ) {
    return res.status(400).json({
      error: 'nombre y correo válidos son obligatorios; la contraseña debe tener al menos 8 caracteres.',
    });
  }

  try {
    getJwtSecret();
    const usuario = await Usuario.create({
      nombre: nombre.trim(),
      correo: correo.trim().toLowerCase(),
      passwordHash: await bcrypt.hash(password, ROUNDS_HASH),
    });
    const token = crearToken(usuario);
    return res.status(201).json({ usuario: datosPublicos(usuario), token });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo.' });
    }
    return next(error);
  }
}

async function iniciarSesion(req, res, next) {
  const { correo, password } = req.body || {};
  if (typeof correo !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'correo y password son obligatorios.' });
  }

  try {
    const usuario = await Usuario.findOne({
      where: { correo: correo.trim().toLowerCase() },
    });
    const passwordValido = usuario
      ? await bcrypt.compare(password, usuario.passwordHash)
      : false;
    if (!passwordValido) {
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    return res.json({
      usuario: datosPublicos(usuario),
      token: crearToken(usuario),
    });
  } catch (error) {
    return next(error);
  }
}

async function obtenerSesion(req, res) {
  return res.json({ usuario: req.usuario });
}

module.exports = { registrar, iniciarSesion, obtenerSesion };
