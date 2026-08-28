export const SAMPLE_EVENTS = `[
  {
    "id": "evt-101",
    "group_id": "checkout-errors",
    "message": "card declined",
    "exception": { "type": "PaymentError", "value": "card declined" },
    "frames": [
      { "function": "charge", "module": "checkout", "filename": "src/pay.rs", "lineno": 42, "in_app": true }
    ]
  },
  {
    "id": "evt-102",
    "group_id": "checkout-errors",
    "message": "cart currency missing",
    "exception": { "type": "ValidationError", "value": "currency missing" },
    "frames": [
      { "function": "total", "module": "cart", "filename": "src/cart.rs", "lineno": 18, "in_app": true }
    ]
  },
  {
    "id": "evt-103",
    "group_id": "payment-retries",
    "message": "card declined",
    "exception": { "type": "PaymentError", "value": "card declined" },
    "frames": [
      { "function": "charge", "module": "checkout", "filename": "src/pay.rs", "lineno": 51, "in_app": true }
    ]
  }
]`;

export const SAMPLE_RULE = `# Prefer the exception class and visible application path.
exception.type + frames.in_app
?? message`;
