# Weekly check-in verification

Verified on 9 November 2026.

## Browser checks

In the local signed-in app, a temporary distance draft was entered without saving:

- Searching for a different member hid the edited row but preserved the draft.
- Review changes included the hidden member, metric, saved value and new value.
- Clearing search restored the edited value.
- A negative distance produced an inline validation error.
- Changing weeks opened the unsaved-changes panel.
- Stay here preserved the selected week and draft.
- Discard and continue cleared the draft and navigated to the next week.
- Returning to the original week showed the original empty distance field and no unsaved changes.

No browser save was submitted against active member records.

## PostgreSQL workflow test

`scripts/check-in-workflow.integration.test.ts` exercises the real check-in save,
snapshot and scoring code against PostgreSQL. It substitutes authentication and
Next.js cache APIs, and routes nested action transactions through one enclosing
serializable transaction. It is not a browser-to-server end-to-end test or an
authentication/concurrency test.

The test creates a temporary block, weeks, session, team and four members. It
verifies all entry types, zero and absent values, audit creation, reload, batch
validation, stale-entry rejection, scoring recalculation, nonduplicated points,
finalization, neighboring weight locks and rejection of inactive-block edits.
All writes are deliberately rolled back, including on assertion failure. The
test also checks that its fixture records are absent afterward and active-block
IDs are unchanged.

The normal suite skips this database test. To run it explicitly in PowerShell,
using the project's configured database connection:

```powershell
$env:RUN_CHECK_IN_DB_TESTS = '1'
try {
    npm test -- --run scripts/check-in-workflow.integration.test.ts
} finally {
    Remove-Item Env:\RUN_CHECK_IN_DB_TESTS
}
```

The database workflow test passed, as did all 211 regular tests, TypeScript and
ESLint. Scoreboard metrics update after recalculation or finalization; saving
check-in entries alone does not recalculate stored scores.
