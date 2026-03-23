# Incidents Runbook

## Triage checklist

1. Verify edge function error volume and recent deploys.
2. Query recent `function_logs` to identify top `error_code` values.
3. Correlate with `practice_sessions.failure_reason_code` and `session_attempts.status`.
4. If needed, run recovery SQL for stuck processing sessions.

## Quick SQL snippets

```sql
-- Recent evaluate-session failures
select
  created_at,
  request_id,
  user_id,
  error_code,
  latency_ms
from public.function_logs
where function_name = 'evaluate-session'
  and status = 'failed'
order by created_at desc
limit 200;
```

```sql
-- Failure reason distribution for last 24h
select
  failure_reason_code,
  count(*)
from public.practice_sessions
where updated_at >= timezone('utc', now()) - interval '24 hours'
  and status = 'failed'
group by failure_reason_code
order by count(*) desc;
```

```sql
-- Idempotency collisions (same session + attempt)
select
  session_id,
  attempt_number,
  count(*)
from public.session_attempts
group by session_id, attempt_number
having count(*) > 1;
```

```sql
-- Slow function invocations (> 20s)
select
  created_at,
  request_id,
  user_id,
  latency_ms,
  error_code
from public.function_logs
where function_name = 'evaluate-session'
  and latency_ms > 20000
order by created_at desc;
```
