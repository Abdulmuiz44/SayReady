# Privacy & Data Retention Policy

This document defines SayReady's default retention windows for practice data and user privacy workflows.

## Audio retention (TTL)

- **Default:** Uploaded session audio files are retained for **30 days** from upload.
- **Extended retention opt-in:** Users may opt in to keep audio longer for longitudinal coaching features.
- **Deletion behavior:**
  - If no opt-in exists, audio is eligible for automated deletion after the 30-day TTL.
  - If account deletion is requested, associated audio assets are prioritized for immediate purge.

## Transcript and evaluation retention

- Practice transcripts, scores, and feedback are retained for **365 days** by default.
- After 365 days, records are eligible for deletion or irreversible anonymization according to internal lifecycle jobs.
- Users can trigger immediate deletion through the account deletion flow.

## Data export

- Users can request a machine-readable export of profile-linked data.
- Exports are generated as JSON bundles and delivered through a short-lived signed URL.

## Account deletion

- Deletion requests are queued first for auditability.
- The system then hard-deletes profile-linked rows and associated storage assets.
- Operational metadata about the deletion request (status/timestamps) may remain for compliance and abuse prevention.
