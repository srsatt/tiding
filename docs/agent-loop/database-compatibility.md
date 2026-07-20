# Database Compatibility

The application must be backward compatible with the current Inker SQLite
database.

## Source Rules

Clean-room code may not read GPL migrations or repository code. It may use:

- `sqlite3 existing.db .schema` output.
- `pragma table_info(...)` output.
- `pragma foreign_key_list(...)` output.
- Redacted sample rows created by the owner.
- Black-box behavior notes.

Store factual schema input under `docs/compat/schema-observations/`.

## Required Behavior

- Open an existing `data/inker.db` without destructive migration.
- Detect the schema version or observed table set.
- Fail closed with a clear error if the DB is unsupported.
- Preserve existing rows and unknown columns.
- Use additive migrations only, and only after creating a timestamped backup.
- Keep compatibility tests against copied fixture databases.

## Repository Expectations

Create thin repository modules for:

- Screen designs.
- Screen widgets.
- Widget templates.
- Custom widgets.
- Data sources.
- Render artifacts or cache metadata if this already exists.

Repositories must:

- Select explicit columns.
- Preserve JSON config fields without lossy parsing.
- Validate JSON before writing.
- Keep timestamps in the same format as the existing DB, once observed.
- Avoid global mutable database state outside the connection module.

## Compatibility Tests

Create tests that:

- Open a fixture copy of the current DB.
- List screen designs.
- List widgets for a design.
- Read custom widget config.
- Read data source cached data and error fields.
- Insert/update/delete a new test-only record, then roll it back or run on a
  copied fixture.
- Verify unknown columns survive writes.

## Migration Policy

Before any migration:

1. Copy the DB to `data/backups/YYYYMMDD-HHMMSS-inker.db`.
2. Run schema validation.
3. Apply only additive changes.
4. Run compatibility checks.
5. Log migration details.

Never drop or rewrite tables during the overnight build.

