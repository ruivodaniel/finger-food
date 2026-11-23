import type { Theme } from '../../../../../../../../../shared/libs/ui/types';
import { useThemeCSSInjection } from '../_core/useThemeCSSInjection';
import { FIXTURES } from '../_fixtures/generated';
import { COMPONENT_FIXTURES } from '../_fixtures/components';
import { getSnapshotFixtures } from '../../_snapshots/reader';

type Props = {
  draft: Theme;
  fixtureId: string;
};

/**
 * Three fixture sources, one preview surface:
 *  - COMPONENT_FIXTURES      — real React components from `_fixtures/elements/**.tsx`
 *  - FIXTURES                — handcrafted body fragments (`_fixtures/html/*`)
 *  - getSnapshotFixtures()   — Playwright snapshots, body-stripped
 *                              (`sandbox/_snapshots/cache/*`)
 *
 * Component fixtures render as JSX. HTML/snapshot fixtures render via
 * dangerouslySetInnerHTML so the inspect tool can walk the live DOM
 * (iframes would hide it).
 *
 * Component fixtures take precedence when ids collide — they're the source
 * of truth for element previews.
 */
export function Preview({ draft, fixtureId }: Props) {
  const css = useThemeCSSInjection(draft);
  const componentFixture = COMPONENT_FIXTURES.find((f) => f.id === fixtureId);

  if (componentFixture) {
    const { Component } = componentFixture;
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <div className="h-full overflow-auto">
          <Component />
        </div>
      </>
    );
  }

  const htmlFixtures = [...FIXTURES, ...getSnapshotFixtures()];
  const fixture = htmlFixtures.find((f) => f.id === fixtureId) ?? htmlFixtures[0];

  if (!fixture) {
    return (
      <div className="flex items-center justify-center h-full text-zinc-400 text-sm p-6">
        No fixtures — add a component fixture under{' '}
        <code className="mx-1 font-mono text-xs">_fixtures/elements/</code>
        or HTML under{' '}
        <code className="mx-1 font-mono text-xs">_fixtures/html/</code>.
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="h-full"
        dangerouslySetInnerHTML={{ __html: fixture.html }}
      />
    </>
  );
}
