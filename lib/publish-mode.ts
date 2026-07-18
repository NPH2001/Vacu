export type PublishMode = 'draft' | 'now' | 'schedule';

/**
 * Lives outside the editor component because server pages derive it and pass it
 * in: reading the clock while rendering is impure and would let the server and
 * client disagree about whether a post is scheduled.
 *
 * Mirrors livePosts() in lib/posts.ts — "scheduled" is not a stored state, just
 * a published row whose publish time hasn't arrived.
 */
export function publishModeOf(status: string, publishedAt: Date | null, now: Date): PublishMode {
  if (status !== 'published') return 'draft';
  return publishedAt && publishedAt.getTime() > now.getTime() ? 'schedule' : 'now';
}
