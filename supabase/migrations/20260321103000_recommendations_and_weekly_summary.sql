create or replace function public.get_today_recommendation(
  p_user_id uuid,
  p_primary_goal text default null,
  p_target_date date default (timezone('utc', now()))::date
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_premium boolean := false;
  v_under_practiced_categories text[] := '{}';
  v_repeated_mistake_keys text[] := '{}';
  v_selected jsonb;
begin
  select exists (
    select 1
    from public.subscriptions s
    where s.user_id = p_user_id
      and s.status in ('trialing', 'active')
      and s.current_period_end >= timezone('utc', now())
  ) into v_is_premium;

  with category_counts as (
    select sc.category, count(*)::int as attempts
    from public.practice_sessions ps
    join public.scenarios sc on sc.id = ps.scenario_id
    where ps.user_id = p_user_id
      and ps.created_at >= timezone('utc', now()) - interval '28 days'
    group by sc.category
  ), avg_attempts as (
    select coalesce(avg(attempts), 0) as value
    from category_counts
  )
  select coalesce(array_agg(cc.category), '{}')
  into v_under_practiced_categories
  from category_counts cc
  cross join avg_attempts aa
  where cc.attempts <= aa.value;

  select coalesce(array_agg(m.mistake_key), '{}')
  into v_repeated_mistake_keys
  from (
    select um.mistake_key
    from public.user_mistakes um
    where um.user_id = p_user_id
    order by um.count desc, um.last_seen_at desc
    limit 5
  ) m;

  with scenario_pool as (
    select
      sc.id,
      sc.slug,
      sc.title,
      sc.category,
      sc.is_premium,
      coalesce((
        select array_agg(value::text)
        from jsonb_array_elements_text(coalesce(sc.metadata->'goal_tags', '[]'::jsonb))
      ), '{}'::text[]) as goal_tags,
      coalesce((
        select array_agg(value::text)
        from jsonb_array_elements_text(coalesce(sc.metadata->'mistake_keys', '[]'::jsonb))
      ), '{}'::text[]) as mistake_keys
    from public.scenarios sc
    where sc.is_active = true
      and (v_is_premium or sc.is_premium = false)
  ), scored as (
    select
      sp.*,
      case
        when p_primary_goal is not null and lower(p_primary_goal) = any (
          select lower(tag) from unnest(sp.goal_tags) as tag
        ) then 100 else 0
      end as primary_goal_match,
      case
        when lower(sp.category) = any (select lower(cat) from unnest(v_under_practiced_categories) as cat)
          then 25 else 0
      end as under_practiced_bonus,
      case
        when exists (
          select 1
          from unnest(sp.mistake_keys) mk
          where lower(mk) = any (select lower(rm) from unnest(v_repeated_mistake_keys) as rm)
        ) then 15 else 0
      end as repeated_mistake_bonus
    from scenario_pool sp
  ), ranked as (
    select
      s.*,
      (s.primary_goal_match + s.under_practiced_bonus + s.repeated_mistake_bonus) as recommendation_score,
      hashtextextended(p_user_id::text || ':' || p_target_date::text || ':' || s.id::text, 0) as tie_breaker
    from scored s
  )
  select jsonb_build_object(
    'scenario_id', r.id,
    'slug', r.slug,
    'title', r.title,
    'category', r.category,
    'score', r.recommendation_score,
    'breakdown', jsonb_build_object(
      'primary_goal_match', r.primary_goal_match,
      'under_practiced_category_bonus', r.under_practiced_bonus,
      'repeated_mistake_relevance_bonus', r.repeated_mistake_bonus
    ),
    'context', jsonb_build_object(
      'under_practiced_categories', v_under_practiced_categories,
      'repeated_mistake_keys', v_repeated_mistake_keys,
      'is_premium_user', v_is_premium
    )
  )
  into v_selected
  from ranked r
  order by r.recommendation_score desc, r.tie_breaker asc
  limit 1;

  return coalesce(v_selected, jsonb_build_object('scenario_id', null));
end;
$$;

create or replace function public.get_weekly_summary(
  p_user_id uuid,
  p_target_date date default (timezone('utc', now()))::date
)
returns jsonb
language sql
security definer
set search_path = public
as $$
with period as (
  select p_target_date as period_end, (p_target_date - 6) as period_start
), minutes as (
  select coalesce(sum(extract(epoch from (ps.completed_at - ps.started_at)) / 60), 0)::int as minutes_practiced
  from public.practice_sessions ps
  cross join period p
  where ps.user_id = p_user_id
    and ps.started_at is not null
    and ps.completed_at is not null
    and (ps.completed_at at time zone 'utc')::date between p.period_start and p.period_end
), top_mistakes as (
  select coalesce(jsonb_agg(jsonb_build_object('mistake_key', q.mistake_key, 'count', q.count)), '[]'::jsonb) as items
  from (
    select um.mistake_key, um.count
    from public.user_mistakes um
    where um.user_id = p_user_id
    order by um.count desc, um.last_seen_at desc
    limit 3
  ) q
), category_scores as (
  select sc.category, avg(ps.score)::numeric(5,2) as avg_score
  from public.practice_sessions ps
  join public.scenarios sc on sc.id = ps.scenario_id
  cross join period p
  where ps.user_id = p_user_id
    and ps.score is not null
    and (ps.created_at at time zone 'utc')::date between p.period_start and p.period_end
  group by sc.category
), best as (
  select jsonb_build_object('category', category, 'score', avg_score) as item
  from category_scores
  order by avg_score desc, category asc
  limit 1
), weakest as (
  select jsonb_build_object('category', category, 'score', avg_score) as item
  from category_scores
  order by avg_score asc, category asc
  limit 1
)
select jsonb_build_object(
  'minutes_practiced', (select minutes_practiced from minutes),
  'top_repeated_mistakes', (select items from top_mistakes),
  'best_category_score', coalesce((select item from best), '{}'::jsonb),
  'weakest_category', coalesce((select item from weakest), '{}'::jsonb)
);
$$;
