require('dotenv').config();
const cors = require('cors');
const express = require('express');
const serverless = require('serverless-http');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
// const uuid = require('uuid/v4');
const app = express();
const router = express.Router();
const port = process.env.PORT;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("."));


// Routes
router.get('/', (req, res) => {
  res.json({ message: 'Hello from server!' });
});

router.post('/create-intent', async (req, res) => {
  const intent = await stripe.paymentIntents.create({
    amount: JSON.parse(req.body.amount),
    currency: 'usd',
    // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
    automatic_payment_methods: {enabled: false},
    payment_method_types: ['card'],
  });
  res.json({client_secret: intent.client_secret});
});

router.get('/payment_confirmation', async (req, res) => {
  try {
    const paymentIntentId = req.query.payment_intent; // Assuming you pass paymentIntentId as a query parameter
    // Fetch the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if payment was successful
    if (paymentIntent.status === 'succeeded') {
      // Proceed with your confirmation logic
      res.send({
        message: 'Payment confirmed',
        paymentIntent: paymentIntent,
        code: 0,
      });
    } else {
      // If payment failed or not yet confirmed, redirect to home page or show an error
      res.send({
        message: 'Payment not confirmed',
        paymentIntent: paymentIntent,
        code: -1,
        paymentIntentId: paymentIntentId,
      });
    }
  } catch (error) {
    console.error('Error fetching payment intent:', error);
    res.status(500).send({
      message: 'Error fetching payment intent',
      paymentIntentId: req.query.payment_intent,
      error: error,
      code: -1,
    });
  }

});

app.use('/.netlify/functions/api', router);  // path must route to lambda
module.exports.handler = serverless(app);

// app.listen(port, () => {
//   console.log(`Server listening at http://localhost:${port} with secret key ${process.env.STRIPE_SECRET_KEY}`);
// });