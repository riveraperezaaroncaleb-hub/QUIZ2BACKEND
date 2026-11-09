const jwt = require('jsonwebtoken');

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (
    !secret
    || secret.startsWith('reemplaza_con_')
    || Buffer.byteLength(secret, 'utf8') < 32
  ) {
    throw new Error('JWT_SECRET debe configurarse con un secreto privado de al menos 32 caracteres.');
  }
  return secret;
}

function crearToken(usuario) {
  return jwt.sign(
    { correo: usuario.correo },
    getJwtSecret(),
    {
      subject: String(usuario.id),
      expiresIn: process.env.JWT_EXPIRES_IN || '1h',
      issuer: 'inventario-constructora-del-valle',
      audience: 'inventario-api',
    },
  );
}

module.exports = { crearToken, getJwtSecret };
