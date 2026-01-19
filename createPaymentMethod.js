require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createPaymentMethod() {
  try {
    console.log('🟢 Creando método de pago...');
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });

    console.log('✅ PaymentMethod creado:\n', paymentMethod);
  } catch (error) {
    console.error('❌ Error creando el método de pago:\n', error.message);
  }
}

createPaymentMethod();
