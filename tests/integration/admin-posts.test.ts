import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { bootPg, stopPg, type TestDb } from '../helpers/pg-test-base';

let authed = true;
const ADMIN = { id: '', email: 'admin@vacu.com.vn', name: 'Chị Hiền', role: 'admin' as const };

vi.mock('@/lib/session', () => ({
  getCurrentUser: async () => (authed ? ADMIN : null),
  requireAdmin: async () => {
    if (!authed) throw new Error('unauthorized');
    return ADMIN;
  },
  requireRole: async () => {
    if (!authed) throw new Error('unauthorized');
    return ADMIN;
  },
  SESSION_COOKIE: 'ntx_session',
  setSessionCookie: async () => {},
  clearSessionCookie: async () => {},
  getSession: async () => null,
}));

let ctx: TestDb;

beforeAll(async () => {
  ctx = await bootPg();
  const { db } = await import('@/db/client');
  const { postCategories, users } = await import('@/db/schema');

  const [u] = await db.insert(users).values({
    email: 'admin@vacu.com.vn', passwordHash: 'x', name: 'Chị Hiền', role: 'admin',
  }).returning();
  ADMIN.id = u.id;

  await db.insert(postCategories).values([
    { id: 'meo-bep', name: 'Mẹo nhà bếp' },
    { id: 'tin-trai', name: 'Tin nông trại' },
  ]);
}, 180_000);

afterAll(async () => { await stopPg(ctx); }, 60_000);

function form(o: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(o)) fd.set(k, v);
  return fd;
}

const base = () => ({
  id: 'bai-mau',
  title: 'Bài mẫu',
  contentHtml: '<p>Nội dung</p>',
  status: 'draft',
});

// Server actions end in redirect(), which throws — the assertions look at the
// database state the action left behind.
describe('createPost', () => {
  it('rejects an invalid slug', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const res = await createPost(null, form({ ...base(), id: 'Chữ Hoa Có Dấu' }));
    expect(res?.error).toBeTruthy();
  });

  it('blocks unauthenticated writes', async () => {
    authed = false;
    const { createPost } = await import('@/app/admin/actions/posts');
    await expect(createPost(null, form({ ...base(), id: 'khong-duoc' }))).rejects.toThrow();
    authed = true;

    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');
    expect(await db.select().from(posts).where(eq(posts.id, 'khong-duoc'))).toHaveLength(0);
  });

  it('sanitizes hostile HTML before it reaches the database', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPost(null, form({
      ...base(),
      id: 'bai-xss',
      contentHtml: '<p onclick="evil()">Chào</p><script>alert(1)</script><a href="javascript:x()">l</a>',
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'bai-xss'));
    // Stored clean, so every render site is safe without re-sanitizing.
    expect(row.contentHtml).not.toContain('<script');
    expect(row.contentHtml).not.toContain('onclick');
    expect(row.contentHtml).not.toContain('javascript:');
    expect(row.contentHtml).toContain('Chào');
  });

  it('derives excerpt and meta description from the body when left blank', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPost(null, form({
      ...base(),
      id: 'bai-tu-tom-tat',
      contentHtml: '<h2>Tiêu đề</h2><p>Đoạn mở đầu của bài viết.</p>',
      excerpt: '',
      metaDescription: '',
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'bai-tu-tom-tat'));
    expect(row.excerpt).toBe('Tiêu đề Đoạn mở đầu của bài viết.');
    expect(row.metaDescription).toBe(row.excerpt);
  });

  /**
   * The whole path, because this is where the bug actually surfaced: the editor
   * encodes "&" as "&amp;", and excerpt/meta are rendered as text. Anything left
   * encoded here reaches the reader as literal "&amp;" on the card and in
   * Google's snippet.
   */
  it('stores a derived excerpt with real characters, not HTML entities', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPost(null, form({
      ...base(),
      id: 'bai-ky-tu-dac-biet',
      // Exactly what Tiptap submits for: Rau & Củ / Hàng "sạch" giá < 50k
      contentHtml: '<h2>Rau &amp; Củ</h2><p>Hàng &quot;sạch&quot; giá &lt; 50k</p>',
      excerpt: '',
      metaDescription: '',
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'bai-ky-tu-dac-biet'));
    expect(row.excerpt).toBe('Rau & Củ Hàng "sạch" giá < 50k');
    expect(row.excerpt).not.toContain('&amp;');
    expect(row.excerpt).not.toContain('&lt;');
    expect(row.metaDescription).toBe(row.excerpt);

    // The body itself stays escaped — it is rendered as HTML, so decoding it
    // there would turn typed-out tags into live markup.
    expect(row.contentHtml).toContain('&amp;');
  });

  it('stamps the signed-in admin as the author', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPost(null, form({ ...base(), id: 'bai-tac-gia' }))).rejects.toThrow();
    const [row] = await db.select().from(posts).where(eq(posts.id, 'bai-tac-gia'));
    expect(row.authorId).toBe(ADMIN.id);
    expect(row.authorName).toBe('Chị Hiền');
  });

  it('reports a duplicate slug in plain language', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    await expect(createPost(null, form({ ...base(), id: 'bai-trung' }))).rejects.toThrow();
    const res = await createPost(null, form({ ...base(), id: 'bai-trung', title: 'Khác' }));
    expect(res?.error).toMatch(/đường dẫn/i);
  });
});

/**
 * Publication is `status='published' AND published_at <= now()`. These pin the
 * mapping from form input to that rule, since getting it wrong either hides a
 * published post forever or leaks a scheduled one early.
 */
describe('publish scheduling', () => {
  it('publishing without a time sets published_at to now so the post is live', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const before = Date.now();
    await expect(createPost(null, form({
      ...base(), id: 'dang-ngay', status: 'published', publishedAt: '',
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'dang-ngay'));
    expect(row.status).toBe('published');
    expect(row.publishedAt).not.toBeNull();
    // Without this, a published post would sit at published_at = null and never
    // satisfy the visibility rule.
    expect(row.publishedAt!.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(row.publishedAt!.getTime()).toBeLessThanOrEqual(Date.now() + 1000);

    const { getPublishedPost } = await import('@/lib/posts');
    expect(await getPublishedPost('dang-ngay')).not.toBeNull();
  });

  it('keeps a future-dated post out of public queries until its time', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const future = new Date(Date.now() + 3 * 86400_000);

    await expect(createPost(null, form({
      ...base(), id: 'hen-gio', title: 'Bí mật', status: 'published',
      publishedAt: future.toISOString(),
    }))).rejects.toThrow();

    const { getPublishedPost, getPublishedPosts } = await import('@/lib/posts');
    expect(await getPublishedPost('hen-gio')).toBeNull();
    const { rows } = await getPublishedPosts();
    expect(rows.map((r) => r.id)).not.toContain('hen-gio');

    // Admin-side lookup still sees it, which is what the preview relies on.
    const { getAnyPost } = await import('@/lib/posts');
    expect((await getAnyPost('hen-gio'))?.title).toBe('Bí mật');
  });

  it('keeps the original publish date when a live post is edited', async () => {
    const { createPost, updatePost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Published six months ago.
    const original = new Date(Date.now() - 180 * 86400_000);
    await expect(createPost(null, form({
      ...base(), id: 'sua-bai-cu', title: 'Bài cũ', status: 'published',
      publishedAt: original.toISOString(),
    }))).rejects.toThrow();

    // A typo fix today. The form's "Đăng ngay" mode submits an empty
    // publishedAt, which must not be read as "re-publish now".
    await expect(updatePost('sua-bai-cu', null, form({
      ...base(), id: 'sua-bai-cu', title: 'Bài cũ (đã sửa)', status: 'published',
      publishedAt: '',
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'sua-bai-cu'));
    expect(row.title).toBe('Bài cũ (đã sửa)');
    // Same instant as before the edit — otherwise the article shows today's
    // date and jumps to the top of /tin-tuc, which orders by publishedAt desc.
    expect(row.publishedAt!.toISOString()).toBe(original.toISOString());
  });

  it('"Đăng ngay" on a SCHEDULED (future) post publishes it now, not on the scheduled date', async () => {
    const { createPost, updatePost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    // Scheduled three days out — currently hidden from the public.
    const future = new Date(Date.now() + 3 * 86400_000);
    await expect(createPost(null, form({
      ...base(), id: 'hen-roi-dang-ngay', title: 'Hẹn rồi đăng ngay', status: 'published',
      publishedAt: future.toISOString(),
    }))).rejects.toThrow();

    // Admin changes their mind and hits "Đăng ngay" (empty publishedAt). The
    // old code fell back to the future date and left it hidden — it must go live.
    const at = Date.now();
    await expect(updatePost('hen-roi-dang-ngay', null, form({
      ...base(), id: 'hen-roi-dang-ngay', title: 'Hẹn rồi đăng ngay', status: 'published',
      publishedAt: '',
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'hen-roi-dang-ngay'));
    expect(row.publishedAt!.getTime()).toBeGreaterThanOrEqual(at - 1000);
    expect(row.publishedAt!.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    const { getPublishedPost } = await import('@/lib/posts');
    expect(await getPublishedPost('hen-roi-dang-ngay')).not.toBeNull(); // now live
  });

  it('stamps now when a draft is published for the first time', async () => {
    const { createPost, updatePost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPost(null, form({ ...base(), id: 'nhap-roi-dang', status: 'draft' })))
      .rejects.toThrow();
    const [before] = await db.select().from(posts).where(eq(posts.id, 'nhap-roi-dang'));
    expect(before.publishedAt).toBeNull();

    const at = Date.now();
    await expect(updatePost('nhap-roi-dang', null, form({
      ...base(), id: 'nhap-roi-dang', status: 'published', publishedAt: '',
    }))).rejects.toThrow();

    // No previous date to keep, so "Đăng ngay" means now.
    const [row] = await db.select().from(posts).where(eq(posts.id, 'nhap-roi-dang'));
    expect(row.publishedAt!.getTime()).toBeGreaterThanOrEqual(at - 1000);
    expect(row.publishedAt!.getTime()).toBeLessThanOrEqual(Date.now() + 1000);

    const { getPublishedPost } = await import('@/lib/posts');
    expect(await getPublishedPost('nhap-roi-dang')).not.toBeNull();
  });

  it('an explicit time still wins over the stored one, so a post can be backdated', async () => {
    const { createPost, updatePost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPost(null, form({
      ...base(), id: 'doi-ngay', status: 'published', publishedAt: '',
    }))).rejects.toThrow();

    // Preserving the old date must not make the date un-editable.
    const backdated = new Date(Date.now() - 30 * 86400_000);
    await expect(updatePost('doi-ngay', null, form({
      ...base(), id: 'doi-ngay', status: 'published', publishedAt: backdated.toISOString(),
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'doi-ngay'));
    expect(row.publishedAt!.toISOString()).toBe(backdated.toISOString());
  });

  it('honours the exact instant it was given, independent of server timezone', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    const when = new Date(Date.now() + 86400_000);
    await expect(createPost(null, form({
      ...base(), id: 'dung-gio', status: 'published', publishedAt: when.toISOString(),
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'dung-gio'));
    expect(row.publishedAt!.toISOString()).toBe(when.toISOString());
  });

  it('never exposes a draft, even one with a past publish date', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    await expect(createPost(null, form({
      ...base(), id: 'nhap-co-ngay', status: 'draft',
      publishedAt: new Date(Date.now() - 86400_000).toISOString(),
    }))).rejects.toThrow();

    const { getPublishedPost } = await import('@/lib/posts');
    expect(await getPublishedPost('nhap-co-ngay')).toBeNull();
  });
});

describe('updatePost / deletePost', () => {
  it('unpublishing hides a live post again', async () => {
    const { createPost, updatePost } = await import('@/app/admin/actions/posts');
    const { getPublishedPost } = await import('@/lib/posts');

    await expect(createPost(null, form({
      ...base(), id: 'go-xuong', status: 'published', publishedAt: '',
    }))).rejects.toThrow();
    expect(await getPublishedPost('go-xuong')).not.toBeNull();

    await expect(updatePost('go-xuong', null, form({
      ...base(), id: 'go-xuong', status: 'draft',
    }))).rejects.toThrow();
    expect(await getPublishedPost('go-xuong')).toBeNull();
  });

  it('parses comma-separated tags, trimming blanks', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPost(null, form({
      ...base(), id: 'bai-the', tags: '  rau sạch , ,mẹo bếp,  ',
    }))).rejects.toThrow();

    const [row] = await db.select().from(posts).where(eq(posts.id, 'bai-the'));
    expect(row.tags).toEqual(['rau sạch', 'mẹo bếp']);
  });

  it('deletes a post and blocks unauthenticated deletes', async () => {
    const { createPost, deletePost } = await import('@/app/admin/actions/posts');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPost(null, form({ ...base(), id: 'sap-xoa' }))).rejects.toThrow();

    authed = false;
    await expect(deletePost('sap-xoa')).rejects.toThrow();
    authed = true;
    expect(await db.select().from(posts).where(eq(posts.id, 'sap-xoa'))).toHaveLength(1);

    await expect(deletePost('sap-xoa')).rejects.toThrow();
    expect(await db.select().from(posts).where(eq(posts.id, 'sap-xoa'))).toHaveLength(0);
  });
});

describe('post categories', () => {
  it('deleting a category keeps its posts but clears the link', async () => {
    const { createPost } = await import('@/app/admin/actions/posts');
    const { createPostCategory, deletePostCategory } = await import('@/app/admin/actions/post-categories');
    const { db } = await import('@/db/client');
    const { posts } = await import('@/db/schema');
    const { eq } = await import('drizzle-orm');

    await expect(createPostCategory(null, form({ id: 'tam-thoi', name: 'Tạm thời' }))).rejects.toThrow();
    await expect(createPost(null, form({
      ...base(), id: 'bai-trong-muc', categoryId: 'tam-thoi', status: 'published', publishedAt: '',
    }))).rejects.toThrow();

    await expect(deletePostCategory('tam-thoi')).rejects.toThrow();

    // ON DELETE SET NULL: removing a category must not take published articles
    // down with it.
    const [row] = await db.select().from(posts).where(eq(posts.id, 'bai-trong-muc'));
    expect(row).toBeDefined();
    expect(row.categoryId).toBeNull();

    const { getPublishedPost } = await import('@/lib/posts');
    expect(await getPublishedPost('bai-trong-muc')).not.toBeNull();
  });
});
