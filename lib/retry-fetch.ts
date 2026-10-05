type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const clockSkewMessage = "JWT issued at future";

export function createJwtClockSkewRetryFetch(
  baseFetch: FetchLike = fetch,
  delaysMs = [250, 750, 1500],
  wait: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
): FetchLike {
  return async (input, init) => {
    for (let attempt = 0; ; attempt += 1) {
      const response = await baseFetch(input, init);
      if (response.status !== 401 || !((await response.clone().text()).includes(clockSkewMessage))) return response;
      if (attempt >= delaysMs.length) return response;
      await wait(delaysMs[attempt]);
    }
  };
}
