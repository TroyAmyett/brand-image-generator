---
active: true
iteration: 1
max_iterations: 30
completion_promise: "COMPLETE"
started_at: "2026-01-17T05:00:35Z"
---

Implement Canvas-AgentPM Federation Phase 4 - Account Linking.

IMPORTANT CONTEXT:
* Shared Supabase project: https://ilxgrlnwjtdpikpjocll.supabase.co
* AgentPM Identity Service has OAuth2 endpoints ready (oauth.ts)
* user_api_keys table stores encrypted keys (AES-256-GCM client-side)
* Same ENCRYPTION_KEY used across all tools
* Token format: flt_at_xxx (access), flt_rt_xxx (refresh)

Requirements:
* Add Link to AgentPM button in Canvas Settings for standalone users
* Implement account linking flow:
  - Generate state parameter with canvas_user_id and linking intent
  - Redirect to AgentPM /oauth/authorize with scope 'link:account'
  - Handle callback at /auth/agentpm/link-callback
  - Verify email match between Canvas and AgentPM user
  - Update Canvas user record: set auth_source='agentpm', agentpm_user_id
* Implement key migration prompt:
  - After successful link, check for local API keys in user_api_keys
  - Show modal listing keys with checkboxes (provider name + key hint)
  - On confirm: keys already in shared Supabase, just update user_id reference
  - Delete duplicate keys if any exist in AgentPM
  - Note: Since same Supabase, migration is just re-associating user_id
* Add Unlink from AgentPM option in Settings:
  - Show confirmation dialog with warning
  - Reset auth_source to 'standalone'
  - Clear agentpm_user_id and tokens
  - Keys remain associated with Canvas user (no data loss)
* Prevent linking to AgentPM account already linked to another Canvas user
* Add entries to an audit_log or activity feed for link/unlink events

Success criteria:
* Standalone Canvas user can link to their AgentPM account
* Key migration prompt appears and works (even if just re-associating)
* User can unlink and revert to standalone mode
* Proper email verification or confirmation before linking
* Clear warnings before destructive actions
* No linter errors
* No console errors

Output <promise>COMPLETE</promise> when done.
