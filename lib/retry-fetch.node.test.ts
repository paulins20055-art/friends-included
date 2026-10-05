import assert from "node:assert/strict";
import test from "node:test";
import { createJwtClockSkewRetryFetch } from "./retry-fetch.ts";

test("retries the transient Supabase clock-skew response", async () => {
  let calls = 0;
  const waits: number[] = [];
  const fakeFetch = async () => {
    calls += 1;
    return calls < 3
      ? new Response('{"message":"JWT issued at future"}', { status: 401 })
      : new Response('{"ok":true}', { status: 200 });
  };
  const retryingFetch = createJwtClockSkewRetryFetch(fakeFetch, [10, 20, 30], async (ms) => { waits.push(ms); });
  const response = await retryingFetch("https://example.test");
  assert.equal(response.status, 200);
  assert.equal(calls, 3);
  assert.deepEqual(waits, [10, 20]);
});

test("does not retry unrelated authentication failures", async () => {
  let calls = 0;
  const retryingFetch = createJwtClockSkewRetryFetch(async () => {
    calls += 1;
    return new Response('{"message":"invalid token"}', { status: 401 });
  }, [10], async () => {});
  const response = await retryingFetch("https://example.test");
  assert.equal(response.status, 401);
  assert.equal(calls, 1);
});
