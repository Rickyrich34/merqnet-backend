// createAndAttachPaymentMethod.js
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createAndAttachPaymentMethod() {
  try {
    console.log("🔄 Creando nuevo método de pago de prueba...");

    // 1. Crear el método de pago
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4242424242424242',
        exp_month: 12,
        exp_year: 2026,
        cvc: '123',
      },
    });

    console.log("✅ Método creado:", paymentMethod.id);

    // 2. ID del cliente ya existente en Stripe
    const customerId = 'cus_S6jPUwCwDjl7rR';

    // 3. Adjuntar el método de pago al cliente
    await stripe.paymentMethods.attach(paymentMethod.id, {
      customer: customerId,
    });

    // 4. Establecer como predeterminado
    await stripe.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.id,
      },
    });

    console.log("🔐 Método de pago adjuntado correctamente.");
    console.log("🔑 Usa este ID en tu HTML:", paymentMethod.id);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

createAndAttachPaymentMethod();