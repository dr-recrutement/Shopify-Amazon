/*
# vendor_payment_gateways: missing client_id column

## Summary
The Settings UI already collects a third credential field ("Merchant ID
/ Service ID" for CinetPay, "Client ID" for PayPal, "Application Token"
for PayUnit) but nothing ever persisted it — pushCloudGateway only wrote
apiKey/apiSecret. Adding client_id_encrypted so this third credential is
actually saved for every gateway that needs one, not silently dropped.
*/

ALTER TABLE vendor_payment_gateways ADD COLUMN IF NOT EXISTS client_id_encrypted text;
