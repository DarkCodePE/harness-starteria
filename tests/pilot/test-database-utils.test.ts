import { describe, expect, it } from 'vitest';
import {
  assertDisposableDatabaseName,
  parseDatabaseName,
} from '../../front/scripts/database/test-database-utils';

describe('test database utils', () => {
  it('parses database name from URL', () => {
    expect(parseDatabaseName('postgresql://postgres:postgres@localhost:55433/starteria_e2e')).toBe('starteria_e2e');
  });

  it('rejects protected database names', () => {
    expect(() => assertDisposableDatabaseName('postgres')).toThrow(/protected/);
    expect(() => assertDisposableDatabaseName('template0')).toThrow(/protected/);
    expect(() => assertDisposableDatabaseName('template1')).toThrow(/protected/);
    expect(() => assertDisposableDatabaseName('starteria_db')).toThrow(/protected/);
  });

  it('rejects names outside the disposable allowlist', () => {
    expect(() => assertDisposableDatabaseName('customer_prod')).toThrow(/non-disposable/);
  });

  it('allows only declared disposable databases', () => {
    expect(() => assertDisposableDatabaseName('starteria_e2e')).not.toThrow();
    expect(() => assertDisposableDatabaseName('starteria_pilot_dry_run')).not.toThrow();
  });

  it('rejects unsafe identifiers', () => {
    expect(() => assertDisposableDatabaseName('starteria-e2e')).toThrow(/Unsafe/);
    expect(() => assertDisposableDatabaseName('starteria_e2e;drop')).toThrow(/Unsafe/);
  });
});
