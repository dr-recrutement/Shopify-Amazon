// Superseded by platform-billing (server-side payment ledger). Kept as a stub because functions cannot be deleted from here.
Deno.serve(() => new Response(JSON.stringify({ error: 'Gone: use platform-billing' }), { status: 410, headers: { 'Content-Type': 'application/json' } }));
