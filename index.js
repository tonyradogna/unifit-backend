const express = require("express");
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));
 
const app = express();
 
const RAILWAY_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : "https://unifit-backend-production.up.railway.app";
 
app.use((req, res, next) => {
  if (req.path === '/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});
 
app.use((req, res, next) => {
  if (req.path === '/webhook') {
    express.raw({ type: 'application/json' })(req, res, next);
  } else {
    express.json()(req, res, next);
  }
});
 
const PRINTFUL_TOKEN = process.env.PRINTFUL_TOKEN;
 
const PRICES = {
  "Crop Top":    3200,
  "Unisex Tee":  2700,
  "Women's Tee": 2900,
  "Hoodie":      4800,
  "Crewneck":    3800,
  "Tank Top":    2400,
  "Phone Case":  2600,
  "Tote Bag":    2600,
};
 
const SHIPPING = {
  "Crop Top": 399, "Unisex Tee": 399, "Women's Tee": 399,
  "Hoodie": 599, "Crewneck": 599, "Tank Top": 399,
  "Phone Case": 399, "Tote Bag": 399,
};
 
const COUPONS = {
  "FIRST20":   { percent: 20 },
  "CHAPTER10": { percent: 10 },
  "WELCOME15": { percent: 15 },
};
 
const FONT_CSS_URLS = {
  "Cinzel, serif":                "https://fonts.googleapis.com/css2?family=Cinzel:wght@700&display=swap",
  "Bebas Neue, sans-serif":       "https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap",
  "Permanent Marker, cursive":    "https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap",
  "Roboto Condensed, sans-serif": "https://fonts.googleapis.com/css2?family=Roboto+Condensed:wght@700&display=swap",
};
 
const FONT_FAMILY_MAP = {
  "Cinzel, serif":                "Cinzel",
  "Bebas Neue, sans-serif":       "Bebas Neue",
  "Permanent Marker, cursive":    "Permanent Marker",
  "Roboto Condensed, sans-serif": "Roboto Condensed",
};
 
// ── VARIANT TABLES (sourced directly from Printful API) ──
 
// Unisex Tee: Bella+Canvas 3001 (product 71)
const UNISEX_TEE = {
  "Black":       { XS:9527,  S:4016,  M:4017,  L:4018,  XL:4019,  "2XL":4020  },
  "White":       { XS:9526,  S:4011,  M:4012,  L:4013,  XL:4014,  "2XL":4015  },
  "Navy":        { XS:9546,  S:4111,  M:4112,  L:4113,  XL:4114,  "2XL":4115  },
  "Team Purple": { XS:9557,  S:4166,  M:4167,  L:4168,  XL:4169,  "2XL":4170  },
  "Gold":        {           S:4081,  M:4082,  L:4083,  XL:4084,  "2XL":4085  },
  "Red":         { XS:9552,  S:4141,  M:4142,  L:4143,  XL:4144,  "2XL":4145  },
  "Ash":         {           S:4026,  M:4027,  L:4028,  XL:4029,  "2XL":4030  },
  "Soft Cream":  { XS:9554,  S:4151,  M:4152,  L:4153,  XL:4154,  "2XL":4155  },
  "Forest":      {           S:8451,  M:8452,  L:8453,  XL:8454,  "2XL":8455  },
  "Baby Blue":   { XS:9531,  S:4036,  M:4037,  L:4038,  XL:4039,  "2XL":4040  },
  "Pink":        {           S:4136,  M:4137,  L:4138,  XL:4139,  "2XL":4140  },
  "Maroon":      { XS:9545,  S:4106,  M:4107,  L:4108,  XL:4109,  "2XL":4110  },
  "Maroon":      { XS:9545,  S:4106,  M:4107,  L:4108,  XL:4109,  "2XL":4110  },
};
 
// Women's Tee: Bella+Canvas 6400 Women's Relaxed T-Shirt (product 360)
const WOMENS_TEE = {
  "Black":              { S:10187, M:10188, L:10189, XL:10190, "2XL":10191 },
  "White":              { S:10252, M:10253, L:10254, XL:10255, "2XL":10256 },
  "Navy":               { S:10235, M:10236, L:10237, XL:10238, "2XL":10239 },
  "Pink":               { S:10241, M:10242, L:10243, XL:10244, "2XL":10245 },
  "Heather Mauve":      { S:10205, M:10206, L:10207, XL:10208, "2XL":10209 },
  "Athletic Heather":   { S:10176, M:10177, L:10178, XL:10179, "2XL":10180 },
  "Dark Grey Heather":  { S:10193, M:10194, L:10195, XL:10196, "2XL":10197 },
  "Heather Blue Lagoon":{ S:14258, M:14259, L:14260, XL:14261, "2XL":14262 },
  "Heather Red":        { S:14268, M:14269, L:14270, XL:14271, "2XL":14272 },
  "Heather Stone":      { S:14273, M:14274, L:14275, XL:14276, "2XL":14277 },
  "Leaf":               { S:10225, M:10226, L:10227, XL:10228, "2XL":10229 },
};
 
// Hoodie: Cotton Heritage M2580 (product 380)
const HOODIE = {
  "Black":           { S:10779, M:10780, L:10781, XL:10782, "2XL":10783 },
  "White":           { S:10774, M:10775, L:10776, XL:10777, "2XL":10778 },
  "Navy Blazer":     { S:11491, M:11492, L:11493, XL:11494, "2XL":11495 },
  "Purple":          { S:13911, M:13912, L:13913, XL:13914, "2XL":13915 },
  "Team Gold":       { S:24999, M:25000, L:25001, XL:25002, "2XL":25003 },
  "Team Red":        { S:20278, M:20279, L:20280, XL:20281, "2XL":20282 },
  "Carbon Grey":     { S:10784, M:10785, L:10786, XL:10787, "2XL":10788 },
  "Bone":            { S:20284, M:20285, L:20286, XL:20287, "2XL":20288 },
  "Forest Green":    { S:16162, M:16163, L:16164, XL:16165, "2XL":16166 },
  "Sky Blue":        { S:13917, M:13918, L:13919, XL:13920, "2XL":13921 },
  "Light Pink":      { S:24993, M:24994, L:24995, XL:24996, "2XL":24997 },
  "Maroon":          { S:11486, M:11487, L:11488, XL:11489, "2XL":11490 },
  "Dusty Rose":      { S:13887, M:13888, L:13889, XL:13890, "2XL":13891 },
  "Team Royal":      { S:13905, M:13906, L:13907, XL:13908, "2XL":13909 },
  "Vintage Black":   { S:20272, M:20273, L:20274, XL:20275, "2XL":20276 },
  "Oatmeal Heather": { S:24975, M:24976, L:24977, XL:24978, "2XL":24979 },
  "Lavender":        { S:25005, M:25006, L:25007, XL:25008, "2XL":25009 },
  "Charcoal Heather":{ S:11481, M:11482, L:11483, XL:11484, "2XL":11485 },
};
 
// Crewneck: Gildan 18000 (product 145)
const CREWNECK = {
  "Black":      { S:5438,  M:5439,  L:5440,  XL:5441,  "2XL":5442  },
  "White":      { S:5418,  M:5419,  L:5420,  XL:5421,  "2XL":5422  },
  "Navy":       { S:5458,  M:5459,  L:5460,  XL:5461,  "2XL":5462  },
  "Purple":     { S:5508,  M:5509,  L:5510,  XL:5511,  "2XL":5512  },
  "Gold":       { S:5498,  M:5499,  L:5500,  XL:5501,  "2XL":5502  },
  "Red":        { S:5488,  M:5489,  L:5490,  XL:5491,  "2XL":5492  },
  "Ash":        { S:18755, M:18756, L:18757, XL:18758, "2XL":18759 },
  "Sport Grey": { S:5468,  M:5469,  L:5470,  XL:5471,  "2XL":5472  },
  "Maroon":     { S:5478,  M:5479,  L:5480,  XL:5481,  "2XL":5482  },
  "Sand":       { S:12997, M:12998, L:12999, XL:13000, "2XL":13001 },
  "Irish Green":{ S:5428,  M:5429,  L:5430,  XL:5431,  "2XL":5432  },
};
 
// Tank Top: Next Level 6733 Racerback (product 163)
const TANK = {
  "Heather White":{ XS:6621, S:6622, M:6623, L:6624, XL:6625 },
  "Black":        { XS:6629, S:6630, M:6631, L:6632, XL:6633 },
  "White":        { XS:6634, S:6635, M:6636, L:6637, XL:6638 },
  "Navy":         { XS:6643, S:6644, M:6645, L:6646, XL:6647 },
  "Hot Pink":     {          S:6609, M:6610, L:6611, XL:6612 },
  "Purple":       {          S:6613, M:6614, L:6615, XL:6616 },
  "Royal":        {          S:6617, M:6618, L:6619, XL:6620 },
};
 
// Crop Top: All-Over Print Crop Top (product 200) — White only, print is the design
const CROP_TOP = {
  "White": { XS:7812, S:7813, M:7814, L:7815, XL:7816 },
};
 
// Tote Bag: All-Over Print Large Tote w/ Pocket (product 274) — no size
const TOTE = {
  "Black":  9039,
  "Red":    9040,
  "Yellow": 9041,
};
 
// Map site garment hex → Printful color name per product
function resolveColor(hex, product) {
  const h = (hex || "#000000").toLowerCase();
 
  const maps = {
    "Unisex Tee": {
      "#000000":"Black","#ffffff":"White","#1a1a2e":"Navy","#5b2d8e":"Team Purple",
      "#c0a44a":"Gold","#ff6b6b":"Red","#808080":"Ash","#fdf8f0":"Soft Cream",
      "#2e8b57":"Forest","#87ceeb":"Baby Blue","#ff69b4":"Pink","#800000":"Maroon",
    },
    "Women's Tee": {
      "#000000":"Black","#ffffff":"White","#1a1a2e":"Navy","#ff69b4":"Pink",
      "#b07080":"Heather Mauve","#808080":"Athletic Heather","#555555":"Dark Grey Heather",
      "#4a90d9":"Heather Blue Lagoon","#c0392b":"Heather Red","#999999":"Heather Stone",
      "#228b22":"Leaf",
    },
    "Hoodie": {
      "#000000":"Black","#ffffff":"White","#1a1a2e":"Navy Blazer","#5b2d8e":"Purple",
      "#c0a44a":"Team Gold","#ff6b6b":"Team Red","#808080":"Carbon Grey",
      "#fdf8f0":"Oatmeal Heather","#2e8b57":"Forest Green","#87ceeb":"Sky Blue",
      "#ff69b4":"Light Pink","#800000":"Maroon","#c17e80":"Dusty Rose",
      "#4169e1":"Team Royal","#1a1a1a":"Vintage Black","#c8a2c8":"Lavender",
      "#555555":"Charcoal Heather",
    },
    "Crewneck": {
      "#000000":"Black","#ffffff":"White","#1a1a2e":"Navy","#5b2d8e":"Purple",
      "#c0a44a":"Gold","#ff6b6b":"Red","#808080":"Ash","#d2b48c":"Sand",
      "#800000":"Maroon","#228b22":"Irish Green","#999999":"Sport Grey",
    },
    "Tank Top": {
      "#000000":"Black","#ffffff":"White","#1a1a2e":"Navy","#ff69b4":"Hot Pink",
      "#5b2d8e":"Purple","#4169e1":"Royal","#e8e8e8":"Heather White",
    },
  };
 
  const productMap = maps[product] || maps["Unisex Tee"];
  return productMap[h] || Object.values(productMap)[0];
}
 
function getVariantId(product, garmentColor, size) {
  const sz = (size || "M").toUpperCase();
 
  if (product === "Tote Bag") {
    const colorMap = { "#000000":"Black","#ff0000":"Red","#ffff00":"Yellow","#1a1a2e":"Black" };
    const c = colorMap[(garmentColor||"").toLowerCase()] || "Black";
    return TOTE[c] || TOTE["Black"];
  }
 
  if (product === "Crop Top") {
    return CROP_TOP["White"][sz] || CROP_TOP["White"]["M"];
  }
 
  if (product === "Phone Case") {
    // Phone cases require store-specific product setup in Printful dashboard
    // Return null to skip Printful order for now
    return null;
  }
 
  const tableMap = {
    "Unisex Tee":  UNISEX_TEE,
    "Women's Tee": WOMENS_TEE,
    "Hoodie":      HOODIE,
    "Crewneck":    CREWNECK,
    "Tank Top":    TANK,
  };
 
  const table = tableMap[product];
  if (!table) return null;
 
  const colorName = resolveColor(garmentColor, product);
  const colorRow = table[colorName] || table[Object.keys(table)[0]];
  return colorRow[sz] || colorRow["M"] || colorRow[Object.keys(colorRow)[0]];
}
 
// ── PRINT IMAGE ENDPOINT ──
app.get("/print-image", (req, res) => {
  const letters    = (req.query.letters || "XO").slice(0, 6);
  const color      = /^#[0-9a-fA-F]{3,6}$/.test(req.query.color || "") ? req.query.color : "#000000";
  const fontKey    = req.query.font || "Cinzel, serif";
  const fontFamily = FONT_FAMILY_MAP[fontKey] || "Cinzel";
  const fontCssUrl = FONT_CSS_URLS[fontKey] || FONT_CSS_URLS["Cinzel, serif"];
  const size       = 1200;
  const fontSize   = letters.length <= 2 ? 520 : letters.length <= 3 ? 380 : 280;
 
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <style>@import url('${fontCssUrl}');</style>
  </defs>
  <rect width="${size}" height="${size}" fill="none"/>
  <text
    x="50%"
    y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="'${fontFamily}', serif"
    font-size="${fontSize}"
    font-weight="700"
    fill="${color}"
    letter-spacing="8"
  >${letters}</text>
</svg>`;
 
  res.setHeader("Content-Type", "image/svg+xml");
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.send(svg);
});
 
// ── CHECKOUT ──
app.post("/create-checkout", async (req, res) => {
  try {
    const {
      product, letters, org, letterColor, garmentColor,
      font, size, qty, couponCode, successUrl, cancelUrl
    } = req.body;
 
    let unitPrice = PRICES[product] || 2700;
    const shipping = SHIPPING[product] || 399;
    const orderSubtotal = unitPrice * qty;
 
    let discountPercent = 0;
    if (qty >= 10) discountPercent = 10;
    if (couponCode && COUPONS[couponCode.toUpperCase()]) {
      const cp = COUPONS[couponCode.toUpperCase()].percent;
      if (cp > discountPercent) discountPercent = cp;
    }
    if (discountPercent > 0) {
      unitPrice = Math.round(unitPrice * (1 - discountPercent / 100));
    }
 
    const FREE_SHIPPING_RATE_ID = 'shr_1TISpSIwB9tX8XNuZyxzEpbb';
    const qualifiesForFreeShipping = orderSubtotal >= 10000;
 
    const lineItems = [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `${product} — ${letters} (${org})`,
          description: `Size: ${size} | Font: ${font} | Colors: ${letterColor} on ${garmentColor}`,
        },
        unit_amount: unitPrice,
      },
      quantity: qty,
    }];
 
    if (!qualifiesForFreeShipping) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Shipping" },
          unit_amount: shipping,
        },
        quantity: 1,
      });
    }
 
    const sessionConfig = {
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      allow_promotion_codes: true,
      success_url: successUrl + "?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: cancelUrl,
      shipping_address_collection: { allowed_countries: ["US"] },
      metadata: {
        product, letters, org, letterColor, garmentColor,
        font, size, qty: String(qty), couponCode: couponCode || ""
      },
    };
 
    if (qualifiesForFreeShipping) {
      sessionConfig.shipping_options = [{ shipping_rate: FREE_SHIPPING_RATE_ID }];
    }
 
    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    res.status(500).json({ error: err.message });
  }
});
 
// ── WEBHOOK → PRINTFUL ORDER ──
app.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
 
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
 
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { product, letters, letterColor, garmentColor, font, size, qty } = session.metadata;
 
    const shippingInfo = session.collected_information?.shipping_details || session.shipping_details || {};
    const address = shippingInfo.address || {};
    const customerName = shippingInfo.name || session.customer_details?.name || "Customer";
    const customerEmail = session.customer_details?.email || "";
 
    const printImageUrl = `${RAILWAY_URL}/print-image?letters=${encodeURIComponent(letters)}&color=${encodeURIComponent(letterColor)}&font=${encodeURIComponent(font || "Cinzel, serif")}`;
    console.log("Print image URL:", printImageUrl);
 
    const variantId = getVariantId(product, garmentColor, size);
    console.log(`Variant: product=${product} color=${garmentColor} size=${size} → ${variantId}`);
 
    if (!variantId) {
      console.error(`No variant ID for ${product}/${garmentColor}/${size} — skipping Printful order`);
      return res.json({ received: true });
    }
 
    try {
      const response = await fetch("https://api.printful.com/orders", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PRINTFUL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirm: true,
          recipient: {
            name: customerName,
            address1: address.line1 || "",
            address2: address.line2 || "",
            city: address.city || "",
            state_code: address.state || "",
            zip: address.postal_code || "",
            country_code: address.country || "US",
            email: customerEmail,
          },
          items: [{
            variant_id: variantId,
            quantity: parseInt(qty),
            name: `${product} — ${letters}`,
            files: [{
              type: "default",
              url: printImageUrl,
            }],
          }],
        }),
      });
 
      const data = await response.json();
      console.log("Printful order result:", JSON.stringify(data));
    } catch (err) {
      console.error("Printful error:", err);
    }
  }
 
  res.json({ received: true });
});
 
// ── SESSION RETRIEVAL ──
app.get("/session/:id", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.params.id);
    const meta = session.metadata;
    const shipping = session.collected_information?.shipping_details || session.shipping_details || {};
    res.json({
      product: meta.product,
      org: meta.org,
      letters: meta.letters,
      size: meta.size,
      qty: meta.qty,
      name: shipping.name || session.customer_details?.name || "",
      email: session.customer_details?.email || "",
      total: (session.amount_total / 100).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
 
app.get("/", (req, res) => res.send("CampusFit backend running!"));
 
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
