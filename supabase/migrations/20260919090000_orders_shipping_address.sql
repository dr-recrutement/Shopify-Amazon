/*
# Real shipping address on orders

## Summary
The public checkout form collects and requires a phone number, but
nothing anywhere persisted it — it was validated client-side then
silently discarded, never reaching submitPublicCheckout / the orders
table. There was also no shipping address field on the checkout form
at all, meaning a merchant had no way to know where to actually
deliver a physical order beyond an optional email.

Adds customer_phone, shipping_address and shipping_city as nullable
text columns — backward compatible, no existing row is affected.
*/

ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_address text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_city text;
