# Radio monitor worker

Always-on process that polls public Icecast/SHOUTcast now-playing metadata. It does **not** archive audio.

Run locally:

```bash
npx --yes tsx workers/radio-monitor/index.ts
```

Required env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Admin → Features must enable **Radio monitor**, and Admin → Radio Monitor settings must set **enabled**. Stations stay candidates until an admin turns monitoring on.

Build image:

```bash
docker build -f workers/radio-monitor/Dockerfile -t dark-charts-radio-monitor .
```

Target host: a small always-on VPS (Hetzner CX22 is enough for a few hundred short metadata probes). Fly.io Machines work. Cloud Run and Vercel are the wrong runtime for this loop.
