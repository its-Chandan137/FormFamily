import { describe, it } from 'vitest';

describe('resolveForm', () => {
  it.todo('merges from root to leaf applying overrides unless locked');
  it.todo('inserts own items after anchors and accumulates locks');
  it.todo(
    'resolves against ancestors published versions only (chain provided)',
  );
  it.todo('child cannot change a locked field');
  it.todo(
    'hidden inherited field remains in position so unhiding restores layout',
  );
});
