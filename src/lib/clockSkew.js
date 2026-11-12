// "JWT issued at future" (PostgREST code PGRST303) means the access token's
// issue time is later than the clock of the service verifying it - a clock
// skew between Supabase's own services, not a wrong password or a missing
// account. It clears by itself once the verifying clock catches up (seconds
// to a few minutes), so the right reaction is to WAIT and retry with the
// same token - not to treat the failed query as "this user has no data".
//
// Deliberately no refreshSession() between attempts: a fresh token gets a
// fresh, later issue time, which would restart the very wait we're
// sitting out.
export function isClockSkewError(e) {
  const msg = String(e?.message || e?.details || e || '').toLowerCase();
  return e?.code === 'PGRST303' || msg.includes('issued at future') || msg.includes('issued in the future');
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ~17 s in total before giving up and letting the caller show a real error.
export const CLOCK_SKEW_DELAYS_MS = [1500, 3000, 5000, 8000];

// `run` must return a Supabase-style { data, error } result. Retries only
// while the error is the clock-skew one; any other result (success or a
// different error) is returned immediately and untouched.
export async function retryOnClockSkew(run, delays = CLOCK_SKEW_DELAYS_MS) {
  let result = await run();
  for (let i = 0; i < delays.length && result?.error && isClockSkewError(result.error); i++) {
    await sleep(delays[i]);
    result = await run();
  }
  return result;
}
