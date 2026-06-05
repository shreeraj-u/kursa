# Market intelligence APIs

Kursa’s market layer powers salary bands, hiring demand, sample job listings, and skill gaps in Aria chat, career paths, and observations.

## How it works

1. On cache miss or expiry, [`refreshMarketSnapshot`](../../apps/server/src/services/market-ingest.service.ts) calls external providers in parallel.
2. Results are stored in `market_snapshot` (per user + role/location key) for 24h in development, 7 days in production.
3. [`getMarketContextForProfile`](../../apps/server/src/services/market.service.ts) refreshes when needed and is used by `assembleAdvisorContext`.

Debug endpoint (authenticated): `GET /api/v1/market/context`

## Provider matrix

| Provider | API key? | What you get | Env vars |
|----------|----------|--------------|----------|
| **Remote OK** | No | Remote job listings | — |
| **Arbeitnow** | No | EU/remote job listings | — |
| **CareerOneStop** (USDOL) | Free registration | US jobs + wage percentiles | `CAREERONESTOP_USER_ID`, `CAREERONESTOP_API_TOKEN` |
| **BLS Public API** | Free registration | OEWS median wages (with SOC from O*NET or title guess) | `BLS_API_KEY` |
| **Adzuna** | Free dev tier | Local US jobs + salary hints | `ADZUNA_APP_ID`, `ADZUNA_APP_KEY` |
| **O*NET Web Services** | Free account | Standard occupation title/code | `ONET_USERNAME`, `ONET_PASSWORD` |
| **Heuristic wage** | No | Title-based estimate when no wage API succeeds | — |

### Signup links

- CareerOneStop: https://www.careeronestop.org/Developers/WebAPI/registration.aspx
- BLS: https://www.bls.gov/developers/
- Adzuna: https://developer.adzuna.com/
- O*NET: https://services.onetcenter.org/

## Zero-key mode

With no env keys configured, users still get:

- Job samples from Remote OK and Arbeitnow (filtered by target role)
- Heuristic salary bands from role title
- `sources` in context: `remoteok`, `arbeitnow`, `heuristic_wage`

Aria is instructed to treat heuristic wages as estimates, not official benchmarks.

## Disable market

```bash
MARKET_ENABLED=false
```

## Related docs

- [BACKEND_INTELLIGENCE_AND_PROFILING.md](./BACKEND_INTELLIGENCE_AND_PROFILING.md)
- [LLM_STRATEGY.md](./LLM_STRATEGY.md)
