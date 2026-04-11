# SayReady Plan

This document is the full implementation roadmap for `SayReady` from the current state to a production-ready speaking-practice product.

It is intended to be the single planning document for product scope, engineering priorities, release sequencing, and launch readiness.

## 1. Product vision

SayReady helps learners improve spoken English through structured speaking scenarios, AI feedback, personalized recommendations, and a premium subscription layer.

The product should feel:

- Fast to start
- Calm and focused to use
- Reliable during recording and evaluation
- Clear about progress and next steps
- Worth paying for when users want deeper practice and unlimited access

## 2. Core user journey

The primary user journey is:

1. Discover the app
2. Create an account or sign in
3. Complete onboarding
4. Browse or receive a recommended scenario
5. Start a speaking session
6. Record and submit audio
7. Receive AI evaluation and actionable feedback
8. Retry or continue to another scenario
9. Track progress over time
10. Upgrade when premium value is clear

Everything in this plan supports that loop.

## 3. Current state summary

The repo already contains meaningful implementation across mobile, database, and edge functions.

### Already implemented

- Expo / React Native mobile app shell
- Auth screens and onboarding flow
- Scenario browsing and scenario detail screens
- Session creation and audio upload flow
- Evaluation edge function and recommendation edge function
- Supabase schema, migrations, storage bucket setup, and seed data
- Recommendation wiring on the home screen
- Mobile telemetry plumbing and UI error boundary
- Release checklist and operations docs

### Recently fixed

- Remote edge-function boot issues for `evaluate-session`
- Remote migration alignment issues
- Home recommendation integration
- Auth error handling improvements

### Still incomplete or partially implemented

- Premium purchase flow is not fully wired end to end
- Session evaluation UX needs stronger empty, loading, and recovery states
- Full analytics taxonomy and dashboards are not complete
- Automated test coverage is still thin for the mobile app and backend integration paths
- Launch, growth, and retention systems are only partially in place

## 4. Product goals

### Primary goals

- Deliver a dependable daily speaking-practice experience
- Make AI feedback useful, understandable, and motivating
- Turn free users into subscribers through clear premium value
- Build enough analytics to understand activation, retention, and monetization

### Secondary goals

- Support scalable scenario content growth
- Reduce operational risk with observability and runbooks
- Keep the codebase easy to evolve across mobile, backend, and growth features

## 5. Non-goals for the first major release

These should not block the first strong release unless they become critical.

- Social features
- Community sharing
- Classroom or coach dashboards
- Multi-language UI localization
- Complex gamification systems beyond streaks and progress trends
- Desktop-first experiences

## 6. Guiding principles

- Reliability over novelty
- Minimal friction to first successful evaluation
- Clear, actionable feedback over overly clever AI output
- Instrument important flows before scaling acquisition
- Ship in thin, testable slices

## 7. Full implementation roadmap

## Phase 0: Foundation and environment stability

Goal: make local development, staging, and production environments predictable.

### Tasks

- Standardize environment variable naming across mobile, Supabase, analytics, and billing
- Ensure all required Supabase secrets are documented and deployed
- Verify all edge functions can deploy cleanly from the repo
- Document how to bootstrap a fresh environment from scratch
- Add a definitive environment matrix for local, preview, and production
- Ensure migrations are ordered, reproducible, and free from encoding issues
- Confirm storage buckets, RPC functions, and RLS policies exist in all environments

### Definition of done

- A new developer can boot the stack with docs only
- All edge functions deploy without manual patching
- Database and secret setup is reproducible

## Phase 1: Authentication and onboarding completion

Goal: make the first-run experience reliable and low-friction.

### Tasks

- Finalize sign up, sign in, and password reset flows
- Add clearer user-facing messaging for auth failures and network issues
- Ensure onboarding saves correctly to `profiles`
- Validate route protection for unauthenticated and incomplete-onboarding users
- Add telemetry for onboarding dropoff and completion
- Handle email confirmation states cleanly if enabled in Supabase

### Definition of done

- New users can complete onboarding without manual intervention
- Returning users land in the correct screen state every time
- Auth failures are understandable and recoverable

## Phase 2: Scenario discovery and recommendation quality

Goal: help users quickly find the next best speaking session.

### Tasks

- Finalize scenario catalog structure and metadata
- Improve category, difficulty, and premium labeling in UI
- Expand recommendation logic inputs using goals, weak areas, history, and repeated mistakes
- Improve the home screen to explain why something is recommended
- Add fallback behavior when recommendation service is unavailable
- Create admin/content workflow for adding new scenarios and rubrics

### Definition of done

- Users can browse and understand scenario choices easily
- The home recommendation is useful, explainable, and reliable
- Scenario metadata supports future personalization work

## Phase 3: Recording and session UX

Goal: make the core speaking interaction smooth and trustworthy.

### Tasks

- Improve microphone permission handling across mobile and web
- Add stronger recording state feedback
- Add upload progress and retry messaging
- Prevent duplicate submissions and stale attempt states
- Improve error handling for audio upload failures
- Make the retry-once flow explicit and user friendly
- Handle canceled sessions gracefully

### Definition of done

- Recording feels reliable on supported platforms
- Users understand what is happening during upload and evaluation
- Session errors have clear recovery paths

## Phase 4: AI evaluation quality and trust

Goal: produce high-confidence speaking feedback that is useful to learners.

### Tasks

- Validate all AI outputs against schema before persistence
- Improve rubric structure for more consistent scores
- Tune Mistral transcription and evaluation model settings
- Add monitoring for evaluation timeout, malformed output, and provider failures
- Improve feedback mapping from raw AI output into learner-friendly UI language
- Add fallback messaging when evaluation fails or times out
- Review score calibration against expected proficiency levels

### Definition of done

- Evaluation failures are rare and measurable
- Feedback is readable, actionable, and consistent
- Score behavior is defensible and stable

## Phase 5: Progress, retention, and habit formation

Goal: make users feel improvement and want to come back.

### Tasks

- Expand progress screen with trends, streak context, and category breakdowns
- Show weekly summary and repeated mistakes clearly
- Add “next recommended action” after each session
- Improve session history details and replay context
- Add lightweight motivation elements such as streak recovery or milestone states
- Consider reminders or nudges for inactive users

### Definition of done

- Users can see evidence of improvement
- Progress screens reinforce daily usage
- History and summary views support retention, not just reporting

## Phase 6: Premium monetization and subscriptions

Goal: make premium access functional and commercially meaningful.

### Tasks

- Fully wire the paywall CTA to RevenueCat purchase and restore flows
- Sync subscription state from device to backend reliably
- Gate premium scenarios and premium capabilities consistently
- Add premium-specific recommendation and usage rules
- Track paywall impression, purchase start, success, restore, and churn signals
- Design a premium value proposition that is obvious in-product
- Add entitlement recovery and reconciliation flows

### Definition of done

- Purchases and restores work end to end
- Premium access is enforced correctly
- Monetization analytics are available for decision making

## Phase 7: Analytics, observability, and operations

Goal: make the system measurable and supportable.

### Tasks

- Finalize event taxonomy for activation, retention, session quality, and billing
- Connect mobile telemetry to useful dashboards
- Ensure edge functions emit actionable logs and error codes
- Create standard dashboards for auth, evaluation, recommendation, and paywall funnels
- Add error-rate monitoring and basic alerting
- Expand runbooks for auth failures, edge-function failures, and billing incidents

### Definition of done

- Key flows have measurable conversion and failure rates
- Operational incidents can be triaged quickly
- Product decisions can be made from actual usage data

## Phase 8: Testing and quality assurance

Goal: reduce regressions and increase release confidence.

### Tasks

- Add unit tests for recommendation and auth helpers where gaps remain
- Add tests for telemetry helper behavior and key guards
- Add integration tests for critical Supabase RPC and edge-function contracts
- Add smoke tests for sign in, onboarding, scenario start, and evaluation submission
- Define a lightweight staging validation checklist per release
- Add CI coverage for the most important paths

### Definition of done

- Critical user paths have automated verification
- Releases have repeatable manual smoke coverage
- Regressions are caught earlier in development

## Phase 9: Performance, accessibility, and polish

Goal: make the app feel refined and inclusive.

### Tasks

- Review loading states and reduce avoidable waiting
- Improve accessibility labels, color contrast, and focus behavior
- Optimize large lists and expensive render paths
- Review typography, spacing, and visual consistency across screens
- Improve empty and error states throughout the app
- Ensure the app behaves well on small and mid-size devices

### Definition of done

- The app is pleasant and usable across devices
- Core flows meet baseline accessibility expectations
- Performance issues do not distract from the learning experience

## Phase 10: Release readiness and launch

Goal: ship confidently to real users.

### Tasks

- Finalize semantic versioning and changelog workflow
- Confirm release checklist is complete and current
- Prepare preview and production deployment process for mobile builds
- Validate secrets and environment configuration before each release
- Prepare support responses for common auth, audio, and billing issues
- Define launch metrics for activation, day-1 retention, evaluation completion, and paywall conversion

### Definition of done

- The team can release without guesswork
- Rollback procedures are documented and tested conceptually
- Launch health can be monitored in near real time

## 8. Cross-cutting backlog

These items span multiple phases and should be revisited regularly.

### Content and pedagogy

- Expand scenario library by goal, level, and category
- Improve rubrics for different learner levels
- Add clearer mistake taxonomies and recommendation logic

### Data and schema

- Keep `profiles`, `practice_sessions`, `session_attempts`, `feedback_items`, and `user_mistakes` aligned with app needs
- Review indexes and RLS policies as usage grows
- Add migration checks before releases

### Developer experience

- Keep setup docs current
- Reduce flaky environment assumptions
- Improve scripts for deploy, verify, and rollback

## 9. Suggested milestone order

This is the recommended execution order.

### Milestone 1: Stabilize the core loop

- Auth works
- Onboarding works
- Scenario start works
- Evaluate recording works reliably

### Milestone 2: Improve retention and trust

- Better progress screens
- Better history and summary views
- Better AI feedback clarity

### Milestone 3: Monetize correctly

- Paywall wired end to end
- Subscription sync stable
- Premium gating correct

### Milestone 4: Launch readiness

- Telemetry dashboards live
- Release checklist proven
- CI and smoke coverage in place

## 10. Risks and mitigations

### Risk: AI provider instability

- Mitigation: retries, better logging, user-facing fallback states, provider configuration monitoring

### Risk: auth or Supabase environment drift

- Mitigation: environment matrix, secrets checklist, migration discipline, preview verification

### Risk: low trust in evaluation scores

- Mitigation: rubric calibration, clearer feedback wording, stable schema validation, quality review loop

### Risk: weak premium conversion

- Mitigation: stronger premium value articulation, better paywall placement, measurement of funnel steps

### Risk: shipping too much before the core loop is solid

- Mitigation: prioritize reliability and activation before growth or advanced features

## 11. Definition of product readiness

SayReady is ready for a strong public release when:

- A new user can sign up, onboard, start a session, record, and receive feedback without manual support
- Recommendation, progress, and history make the next action obvious
- Premium purchase and restore work correctly
- Edge-function failures are observable and rare
- Mobile telemetry gives enough visibility into activation and dropoff
- Release and rollback procedures are documented and repeatable

## 12. Immediate next priorities

These should be tackled next, in order.

1. Re-test the full evaluation flow from mobile after the remote edge-function fix
2. Fully wire the paywall and RevenueCat purchase flow
3. Strengthen session evaluation UX and failure messaging
4. Expand automated test coverage for the critical journey
5. Build dashboards for auth, evaluation, and paywall conversion

## 13. Plan maintenance rules

- Update this file whenever scope or sequence changes materially
- Reflect shipped work by moving items from future scope into completed docs or changelog entries
- Keep this document strategic; use issue trackers or task lists for day-to-day implementation details

