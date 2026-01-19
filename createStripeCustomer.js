const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createTestPaymentMethod() {
  console.log('🟢 Creando método de pago de prueba...');

  try {
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });

    console.log('✅ Método de pago creado:', paymentMethod.id);
  } catch (error) {
    console.error('❌ Error creando el método de pago:', error.message);
  }
}

createTestPaymentMethod();
