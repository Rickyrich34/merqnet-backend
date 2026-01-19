const express = require('express');
const router = express.Router();

// Controladores — puedes implementarlos después
// const { viewProfile, updateProfile, addPaymentMethod, addShippingAddress } = require('../controllers/profileController');

// Ruta base: ver perfil
router.get('/view/:userId', (req, res) => {
  res.status(200).json({ message: 'View profile endpoint placeholder' });
});

// Ruta: actualizar perfil
router.put('/update/:userId', (req, res) => {
  res.status(200).json({ message: 'Update profile endpoint placeholder' });
});

// Ruta: añadir método de pago
router.post('/payment-methods/:userId', (req, res) => {
  res.status(200).json({ message: 'Add payment method endpoint placeholder' });
});

// Ruta: añadir dirección de envío
router.post('/shipping-addresses/:userId', (req, res) => {
  res.status(200).json({ message: 'Add shipping address endpoint placeholder' });
});

module.exports = router;
