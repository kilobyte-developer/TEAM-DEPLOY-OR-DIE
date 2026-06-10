# User Story LLM Upgrade Report

## Files Modified

- `app/api/generate-userstory-tests/route.ts`
- `lib/testgenai-types.ts`
- `.env.example`
- `backend/prompts/generate_test_cases.md`

## Provider Flow

User-story generation now follows this order:

1. OpenAI with `gpt-4.1-mini`
2. Gemini with `gemini-2.5-flash-lite`
3. Local deterministic acceptance-criteria parser

The route catches provider errors and continues to the next provider. If both external providers fail or are not configured, the local generator still returns test cases.

Returned provider metadata is additive and keeps the existing response contract intact:

```json
{
  "provider": {
    "provider": "openai",
    "model": "gpt-4.1-mini"
  }
}
```

Local fallback returns:

```json
{
  "provider": {
    "provider": "local"
  }
}
```

## OpenAI Integration Summary

The user-story route calls OpenAI only when `OPENAI_API_KEY` is configured. The prompt requires strict JSON and instructs the model to parse each acceptance criterion into concrete positive, negative, and boundary or edge tests.

## Gemini Fallback Summary

If OpenAI is unavailable, misconfigured, returns an error, or returns invalid JSON, the route attempts Gemini with `gemini-2.5-flash-lite`. Gemini receives the same QA-focused prompt and JSON schema requirement.

## Local Fallback Summary

The local fallback extracts acceptance criteria, detects monetary limits, numeric thresholds, time windows, OTP rules, existence checks, sufficient-balance checks, document requirements, duplicate windows, and outcome requirements. It generates one positive and one negative case per rule, plus boundary cases where applicable.

## Sample Generated User Story Output

For UPI transfer acceptance criteria:

- Amount > 0
- Daily limit = ₹50,000
- OTP required above ₹25,000
- OTP expires after 5 minutes
- Recipient must exist
- Sufficient balance required

The deterministic fallback produces cases such as:

- Positive: Accept transfer amount above the minimum with amount ₹1.
- Negative: Reject zero or negative amount.
- Boundary: Reject amount exactly ₹0 because the rule requires amount greater than 0.
- Positive: Allow daily transfers of ₹49,999.
- Negative: Reject daily transfers of ₹50,001.
- Boundary: Apply exact policy at ₹50,000.
- Positive: Transfer ₹30,000 with valid OTP.
- Negative: Reject ₹30,000 without OTP.
- Boundary: Trigger exact threshold policy at ₹25,000.
- Positive: Accept OTP before 5 minutes.
- Negative: Reject OTP after 5 minutes.
- Boundary: Apply expiry policy exactly at 5 minutes.
- Positive: Accept existing recipient.
- Negative: Reject non-existent recipient.
- Positive: Allow transaction with sufficient balance.
- Negative: Reject transaction with insufficient balance.
