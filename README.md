# Friends Included finance system

Day 4 homework application connecting a Vercel-hosted Next.js site, Supabase, Telegram and Google Sheets. Website and bot submissions use the same server-side services and calculations.

## What is implemented

- Demonstration-role selector for all five fictional employees
- Server-enforced permissions for manager, salespeople and expense reporter
- Pending sales, manager approval and editable commission splits
- Immediate company-level expense recognition and later project allocation
- Assignment formulas, 10% commission pool and deterministic cent rounding
- Financial dashboard, pending queues and transaction audit table
- Telegram submission commands, confirmations and decision notifications
- Google Sheets upsert by reference, with visible failed-sync state
- Duplicate references and repeated approvals blocked by the database and service layer
- Automated checks for the supplied Test 1 and cumulative Test 2 totals

## Local setup

1. Create a Supabase project and run `supabase/schema.sql` in its SQL editor.
2. Create a Google spreadsheet with the tabs and headers in `supabase/google-sheets-headers.md`. Share it with your Google service account as Editor.
3. Copy `.env.example` to `.env.local` and add your credentials. Never commit this file.
4. Install dependencies with `pnpm install`.
5. Run `pnpm test`, then `pnpm dev`.

## Telegram commands

```text
/sale S01|Olivia Rose|A|One proud uncle and an emotional grandmother|1000|50|30|20
/expense E01|Rented suit and fake pearl necklace for the relatives|Materials|120|A
```

After deploying to Vercel, register this webhook URL with Telegram:

```text
https://YOUR-VERCEL-DOMAIN/api/telegram/webhook
```

Include `TELEGRAM_WEBHOOK_SECRET` as the `secret_token` when calling Telegram's `setWebhook` method.

## Security

Supabase service-role, Telegram bot and Google service-account credentials are server-only environment variables. The browser calls application routes and never receives those secrets. Row-level security is enabled and no direct browser table policies are created.
