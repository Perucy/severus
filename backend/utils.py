"""
Retry utility for Anthropic API calls.
Handles 529 overloaded and 529/500 transient errors with exponential backoff.
"""

import time
import anthropic


def create_with_retry(client: anthropic.Anthropic, max_retries: int = 4, **kwargs):
    """
    Call client.messages.create with exponential backoff on overload/transient errors.
    Retries on: 529 overloaded, 500 internal, 503 unavailable.
    Raises immediately on: 400 invalid request, 401 auth error, 404 not found.
    """
    delay = 2  # seconds — doubles each retry

    for attempt in range(max_retries + 1):
        try:
            return client.messages.create(**kwargs)

        except anthropic.APIStatusError as e:
            status = e.status_code

            # Don't retry on client errors (our fault)
            if status in (400, 401, 403, 404):
                raise

            # Retry on server/overload errors
            if status in (429, 500, 503, 529) and attempt < max_retries:
                wait = delay * (2 ** attempt)  # 2, 4, 8, 16 seconds
                print(f"[retry] {status} on attempt {attempt+1} — waiting {wait}s")
                time.sleep(wait)
                continue

            raise  # give up after max retries

        except anthropic.APIConnectionError:
            if attempt < max_retries:
                wait = delay * (2 ** attempt)
                print(f"[retry] connection error on attempt {attempt+1} — waiting {wait}s")
                time.sleep(wait)
                continue
            raise