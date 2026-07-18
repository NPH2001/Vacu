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
export const DEFAULT_HOME_BLOCKS: BlockEntry[] = blockListSchema.parse(rawHomeBlocks);
