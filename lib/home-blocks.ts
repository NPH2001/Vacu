import rawHomeBlocks from '@/data/home-blocks.json';
import { blockListSchema, type BlockEntry } from '@/lib/blocks';

/**
 * The homepage's default block layout, shared by two callers:
 *  - the `/` route, as a fallback when the `home` page row does not exist yet;
 *  - scripts/ensure-home-page.mjs, which seeds that row on migrate.
 *
 * Kept in data/home-blocks.json (not code) precisely so the plain-JS seed
 * script can read the same source without importing TypeScript.
 */
// safeParse, not parse: the homepage's whole promise is that `/` always renders,
// so a future schema tightening that leaves the JSON out of range must degrade
// to an empty layout, not crash `/` with a 500 at boot.
const parsed = blockListSchema.safeParse(rawHomeBlocks);
if (!parsed.success) {
  console.error('[home-blocks] data/home-blocks.json does not match blockListSchema:', parsed.error.issues[0]);
}
export const DEFAULT_HOME_BLOCKS: BlockEntry[] = parsed.success ? parsed.data : [];
