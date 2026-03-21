# Recovery Runbook

## Manual cleanup for stuck `processing` sessions

Use this when `practice_sessions` remain in `processing` for more than 15 minutes.

```sql
-- 1) Inspect candidates
select
  ps.id,
  ps.user_id,
  ps.updated_at,
  ps.failure_reason_code,
  sa.id as session_attempt_id,
  sa.status as attempt_status
from public.practice_sessions ps
left join public.session_attempts sa on sa.session_id = ps.id
where ps.status = 'processing'
  and ps.updated_at < timezone('utc', now()) - interval '15 minutes'
order by ps.updated_at asc;
```

```sql
-- 2) Mark sessions as failed
update public.practice_sessions
set
  status = 'failed',
  failure_reason_code = 'processing_stuck_timeout',
  updated_at = timezone('utc', now())
where status = 'processing'
  and updated_at < timezone('utc', now()) - interval '15 minutes';
```

```sql
-- 3) Mark corresponding attempts as failed (if any)
update public.session_attempts sa
set
  status = 'failed',
  updated_at = timezone('utc', now())
from public.practice_sessions ps
where sa.session_id = ps.id
  and ps.status = 'failed'
  and ps.failure_reason_code = 'processing_stuck_timeout'
  and sa.status = 'processing';
```
