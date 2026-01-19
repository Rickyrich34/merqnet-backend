const jwt = require('jsonwebtoken');

// Middleware para verificar si el usuario está autenticado
const verifyToken = (req, res, next) => {
  // Obtener el token del encabezado 'Authorization'
  const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  // Verificar el token con la clave secreta
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }

    // Guardamos el userId decodificado en la solicitud para usarlo en las rutas protegidas
    req.userId = decoded.userId;
    next(); // Si el token es válido, pasamos al siguiente middleware o ruta
  });
};

module.exports = verifyToken;
