const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const app = express();
app.use(cors());
app.use(express.json());

const PRINTFUL_TOKEN = process.env.PRINTFUL_TOKEN;

// ── PRODUCT PRICES ──
const PRICES = {
  "Crop Top": 3800,
  "Unisex Tee": 3200,
  "Women's Tee": 3400,
  "Hoodie": 5800,
  "Crewneck": 4600,
  "Tank Top": 2800,
  "Phone Case": 2800,
  "Tote Bag": 3000,
  "Hat / Cap": 4200,
  "Tumbler": 3800,
};

const SHIPPING = {
  "Crop Top": 399, "Unisex Tee": 399, "Women's Tee": 399,
  "Hoodie": 599, "Crewneck": 599, "Tank Top": 399,
  "Phone Case": 399, "Tote Bag": 399, "Hat / Cap": 499, "Tumbler": 599,
};

// ── CREATE STRIPE CHECKOUT ──
app.post("/create-checkout", async (req, res) => {
  try {
    const { product, letters, org, letterColor, garmentColor, font, size, qty, successUrl, cancelUrl } = req.body;

    let unitPrice = PRICES[product] || 3200;
    const shipping = SHIPPING[product] || 399;
    if (qty >= 10) unitPrice = Math.round(unitPrice * 0.9);

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${product} — ${letters} (${org})`,
              description: `Size: ${size} | Font: ${font} | Colors: ${letterColor} on ${garmentColor}`,
            },
            unit_amount: unitPrice,
          },
          quantity: qty,
        },
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Shipping" },
            unit_amount: shipping,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl + "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: cancelUrl,
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: { product, letters, org, letterColor, garmentColor, font, size, qty: String(qty) },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ── STRIPE WEBHOOK → PRINTFUL ──
app.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { product, letters, letterColor, garmentColor, qty } = session.metadata;
    const shipping = session.shipping_details;

    try {
      await fetch("https://api.printful.com/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRINTFUL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: {
            name: shipping.name,
            address1: shipping.address.line1,
            address2: shipping.address.line2 || "",
            city: shipping.address.city,
            state_code: shipping.address.state,
            zip: shipping.address.postal_code,
            country_code: shipping.address.country,
            email: session.customer_details.email,
          },
          items: [
            {
              variant_id: 1,
              quantity: parseInt(qty),
              name: `${product} — ${letters}`,
              files: [
                {
                  type: "front",
                  url: `https://via.placeholder.com/600x600/${garmentColor.replace("#", "")}/${letterColor.replace("#", "")}?text=${encodeURIComponent(letters)}`,
                },
              ],
            },
          ],
        }),
      });
      console.log("Printful order created for", letters);
    } catch (err) {
      console.error("Printful error:", err);
    }
  }

  res.json({ received: true });
});

// ── HEALTH CHECK ──
app.get("/", (req, res) => res.send("UniFit backend running!"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
