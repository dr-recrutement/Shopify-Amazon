# Supabase Edge Functions

Snapshot of deployed Edge Functions (project `hfzbykndwsrlxqlqrmjh`).

All functions read `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` and (when they act on behalf of a logged-in user) `SUPABASE_ANON_KEY`, which Supabase injects automatically. Those are listed as "built-in" below. "platform_secrets" means a row in the `public.platform_secrets` table (service-role only), not an Edge Function env var.

| Function | Purpose | verify_jwt | Env / secrets needed |
|---|---|---|---|
| ai-assistant | Generates e-commerce content (product copy, SEO, ads, emails) using the merchant's own Gemini/Claude/OpenAI key, with a quota-limited shared Gemini fallback for pro/enterprise plans | false | built-in; platform_secrets: `gateway_encryption_key`, `platform_gemini_api_key` (optional) |
| cinetpay-checkout | CinetPay hosted Mobile Money checkout (initiate + verify) for a merchant's customers | false | built-in; platform_secrets: `gateway_encryption_key` |
| cloudflare-domains | Domain search, price check and paid registration through Cloudflare Registrar | false | built-in; platform_secrets: `cloudflare_account_id`, `cloudflare_api_token` |
| command-center | Server-to-server REST API for the LIAFRIK Command Center (health, capabilities, tenants list/suspend/reactivate, analytics), authenticated by hashed API keys | false | built-in (keys stored hashed in `command_center_api_keys`) |
| command-center-admin | Super-admin endpoint to create/revoke Command Center API keys, create/test webhooks, and deliver signed webhook events | false | built-in; platform_secrets: `gateway_encryption_key`, `command_center_trigger_secret` |
| create-order | Only place orders are created: server-side pricing, discounts, stock reservation, shipping, tax, then triggers confirmation email | false | built-in |
| domain-transfer-out | Gets lock status and locks/unlocks a Cloudflare-registered domain for transfer out | false | built-in; platform_secrets: `cloudflare_account_id`, `cloudflare_api_token` |
| encrypt-gateway-credentials | AES-GCM encrypts merchant payment gateway credentials before they are stored | false | built-in; platform_secrets: `gateway_encryption_key` |
| flutterwave-checkout | Flutterwave inline popup checkout (initiate + verify) | false | built-in; platform_secrets: `gateway_encryption_key` |
| invite-staff | Invites a staff member via Supabase Auth invite email and records them in `team_members` | false | built-in |
| mercadopago-checkout | Mercado Pago Checkout Pro redirect checkout (initiate + verify) | false | built-in; platform_secrets: `gateway_encryption_key` |
| paypal-checkout | PayPal Orders v2 checkout (get client id, create order, capture and verify) | false | built-in; platform_secrets: `gateway_encryption_key` |
| paystack-checkout | Paystack inline popup checkout (initiate + verify) | false | built-in; platform_secrets: `gateway_encryption_key` |
| payunit-checkout | Payunit hosted checkout for merchant customers (initiate + verify) | false | built-in; platform_secrets: `gateway_encryption_key` |
| payunit-platform-billing | Deprecated stub returning 410 Gone; superseded by `platform-billing` | **true** | none |
| send-email | Sends email via Resend: order confirmations, merchant campaigns, and cron automation | false | built-in; optional env `RESEND_API_KEY`; platform_secrets: `gateway_encryption_key`, `platform_resend_api_key` (fallback), `command_center_trigger_secret` |
| sitemap | Public per-store `sitemap.xml` (storefront home plus published blog pages) | false | built-in (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) |
| stripe-checkout | Stripe PaymentIntents + Elements checkout (get public key, create intent, verify) | false | built-in; platform_secrets: `gateway_encryption_key` |
| test-gateway-connection | "Test connection" call against a merchant's stored Stripe/Flutterwave/Paystack/Payunit credentials | false | built-in; platform_secrets: `gateway_encryption_key` |
| verify-custom-domain | Checks DNS (CNAME/A via Cloudflare DoH) for a merchant's custom domain and updates `dns_status` | false | built-in |
| yoco-checkout | Yoco hosted checkout (initiate + verify) | false | built-in; platform_secrets: `gateway_encryption_key` |

Already present in the repo but not covered by this table: `platform-billing`, `platform-payment-providers-admin`.
