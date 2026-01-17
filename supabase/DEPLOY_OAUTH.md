# Deploying OAuth Edge Functions to AgentPM Supabase

The OAuth functionality requires Edge Functions deployed to the AgentPM Supabase project.

## Prerequisites

1. Supabase CLI installed: `npm install -g supabase`
2. Access to the AgentPM Supabase project (`ilxgrlnwjtdpikpjocll`)

## Step 1: Run Database Migrations

First, run the SQL migrations against the Supabase project:

```bash
# Connect to the Supabase SQL editor or use psql
# Run these in order:

# 1. Tool registrations (if not already done)
supabase/migrations/001_register_canvas_tool.sql

# 2. OAuth tables
supabase/migrations/002_oauth_tables.sql
```

Or via Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/ilxgrlnwjtdpikpjocll
2. Navigate to SQL Editor
3. Run `001_register_canvas_tool.sql` first
4. Run `002_oauth_tables.sql` second

## Step 2: Deploy the Edge Function

```bash
# Link to the project (one-time setup)
supabase link --project-ref ilxgrlnwjtdpikpjocll

# Deploy the OAuth function
supabase functions deploy oauth --project-ref ilxgrlnwjtdpikpjocll
```

## Step 3: Verify Deployment

Test the endpoints:

```bash
# Test authorize endpoint (should return HTML login page)
curl "https://ilxgrlnwjtdpikpjocll.supabase.co/functions/v1/oauth/authorize?client_id=canvas-funnelists-dev&redirect_uri=http://localhost:3000/auth/callback&response_type=code&scope=read:profile"

# Test token endpoint (should return error for missing params)
curl -X POST "https://ilxgrlnwjtdpikpjocll.supabase.co/functions/v1/oauth/token" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Environment Variables

The Edge Function uses these environment variables (already configured in Supabase):
- `SUPABASE_URL` - Auto-set by Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Auto-set by Supabase

## Troubleshooting

### "Requested function was not found"
The Edge Function hasn't been deployed. Run:
```bash
supabase functions deploy oauth --project-ref ilxgrlnwjtdpikpjocll
```

### "Invalid client_id"
The tool registration hasn't been created. Run `001_register_canvas_tool.sql`.

### Token exchange fails
Check that `002_oauth_tables.sql` has been run to create the necessary tables.

## Local Development

For local testing without deploying to Supabase, you can:

1. Start local Supabase:
   ```bash
   supabase start
   ```

2. Serve the function locally:
   ```bash
   supabase functions serve oauth
   ```

3. Update the Canvas app to point to local endpoint:
   ```env
   NEXT_PUBLIC_AGENTPM_SUPABASE_URL=http://localhost:54321
   ```
