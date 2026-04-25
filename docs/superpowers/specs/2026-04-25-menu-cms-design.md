# Menu CMS — Design

**Date:** 2026-04-25
**Status:** Approved
**Author:** Vacu / brainstorming session

## Problem

Site navigation is currently hardcoded:

- **Header menu:** static `links` array in `components/Navbar.tsx:8-15` (Trang chủ, Nông sản, Nông dân, Đơn hàng, Câu chuyện, Liên hệ).
- **Footer:** the "Danh mục" column reads from the `categories` table, but there is no admin-editable list of free-form footer links.

Admin needs to manage both menus from the CMS without code changes.

## Scope

### In scope

- Single CMS-managed flat menu list (no submenus / nesting).
- Two display locations: `header` and `footer`.
- Per-item: label, href, open-in-new-tab toggle, sort order.
- One admin section ("Menu") with location filter to manage both.
- Idempotent seed for the header (matches the labels the user gave); footer starts empty.

### Out of scope

- Submenus / nested items.
- Conditional visibility (login state, role).
- Visibility scheduling.
- Per-language / i18n menus.
- Replacing the existing footer "Danh mục" column (it still renders top 5 categories).

## Approach (chosen: Approach 1)

Single table `menu_items` with a `location` enum column. One admin page filters by location. Single sidebar entry. Mirrors the existing pattern used for `value_props`, `delivery_slots`, etc.

### Alternatives considered

- **Two tables (`header_menu` / `footer_menu`):** rejected — doubles boilerplate, awkward to extend if a new location is added later.
- **JSONB columns on `site_info`:** rejected — breaks the pattern used by every other list-style CMS resource in the project, awkward for sortOrder and per-row CRUD.

## Schema

Add to `db/schema.ts`:

```ts
export const menuItems = pgTable('menu_items', {
  id: serial('id').primaryKey(),
  location: text('location', { enum: ['header', 'footer'] }).notNull(),
  label: text('label').notNull(),
  href: text('href').notNull(),
  openInNewTab: boolean('open_in_new_tab').notNull().default(false),
  sortOrder: integer('sort_order').default(0).notNull(),
});

export type MenuItemRow = typeof menuItems.$inferSelect;
```

Migration: generate via `drizzle-kit generate` — produces a new SQL file under `drizzle/`. No data backfill needed (seed handles initial rows).

## Data layer

Add to `lib/data.ts`:

```ts
export async function getMenu(location: 'header' | 'footer') {
  return db.select().from(menuItems)
    .where(eq(menuItems.location, location))
    .orderBy(asc(menuItems.sortOrder), asc(menuItems.id));
}
```

## Public render path

### `app/(public)/layout.tsx`

Fetch both menus alongside existing data:

```ts
const [info, categories, headerMenu, footerMenu] = await Promise.all([
  getSiteInfo(), getAllCategories(),
  getMenu('header'), getMenu('footer'),
]);
return (
  <CartProvider>
    <Navbar info={info} items={headerMenu} />
    <main>{children}</main>
    <Footer info={info} categories={categories} quickLinks={footerMenu} />
    <CartDrawer />
  </CartProvider>
);
```

### `components/Navbar.tsx`

- Remove the hardcoded `links` array.
- Accept `items: MenuItemRow[]` prop.
- Render desktop and mobile lists from `items`.
- For each link: `target={item.openInNewTab ? '_blank' : undefined}` and `rel="noopener noreferrer"` when `_blank`.
- If `items` is empty, render no `<ul>` (header still shows logo / cart / CTA button).

### `components/Footer.tsx`

- Accept new prop `quickLinks: MenuItemRow[]`.
- Add a fourth content column **"Liên kết nhanh"** before the "Liên hệ" column.
- Only render the new column when `quickLinks.length > 0`. When empty, footer keeps the current 3-column appearance (brand `md:col-span-2`, Danh mục, Liên hệ — total 4).
- When the new column renders: drop brand from `md:col-span-2` to `md:col-span-1` so totals remain 4 (brand 1 + Danh mục 1 + Quick links 1 + Liên hệ 1). Brand block content stays the same; description wraps tighter.
- Same `target`/`rel` handling as Navbar.

## Admin

### Sidebar (`components/admin/Sidebar.tsx`)

Add to the "Nội dung" section:

```ts
{ href: '/admin/menu', label: 'Menu', icon: '☰' },
```

### Pages (follow the `value-props` pattern)

- `app/admin/(shell)/menu/page.tsx` — list view.
  - Filter by `location` (tabs/segmented control: "Header" / "Footer"), default Header.
  - Search by `label`.
  - Sort by `sortOrder` (default) or `label`.
  - Pagination + page size selector.
  - Bulk delete via checkbox + `BulkDeleteForm`.
  - Each row shows: label, href, "↗" badge if `openInNewTab`, sortOrder.
- `app/admin/(shell)/menu/new/page.tsx` — create form.
  - Fields: `location` (radio Header/Footer), `label`, `href`, `openInNewTab` (checkbox), `sortOrder` (number).
- `app/admin/(shell)/menu/[id]/page.tsx` — edit form (same fields) + delete.

### Server actions (`app/admin/actions/menu.ts`)

- `createMenuItem(formData)`
- `updateMenuItem(id, formData)`
- `deleteMenuItem(id)`
- `bulkDeleteMenuItems(formData)` — accepts the `ids` checkbox group

Validation:

- `label`: non-empty, trimmed.
- `href`: non-empty, trimmed. Accept any string (internal `/path`, `?query`, or full URL).
- `location`: must be `'header' | 'footer'`.
- `sortOrder`: integer, default 0.

Use `revalidatePath('/admin/menu')` and the public layout path after each mutation.

## Seed

### `scripts/seed.mjs` (boot-time, idempotent)

Add a block after the FAQ seed:

```js
if ((await tableCount('menu_items')) === 0) {
  console.log('Seeding menu_items…');
  const HEADER = [
    { label: 'Trang chủ',          href: '/' },
    { label: 'Rau Sạch Hữu Cơ',    href: '/products?c=rau-cu' },
    { label: 'Gà ăn thảo dược',    href: '/products?c=trung-thit' },
    { label: 'Cá Tầm Nga',         href: '/products' },
    { label: 'Thực phẩm bổ sung',  href: '/products' },
    { label: 'Câu chuyện',         href: '/about' },
    { label: 'Liên hệ',            href: '/contact' },
  ];
  for (const [i, m] of HEADER.entries()) {
    await client.query(
      `INSERT INTO menu_items (location, label, href, sort_order)
       VALUES ('header', $1, $2, $3)`,
      [m.label, m.href, (i + 1) * 10],
    );
  }
}
```

Footer: not seeded (admin will add as needed).

### `db/seed.ts` (TS version)

Add the equivalent block so both seed paths stay in sync.

## Tests

- `tests/admin/menu.test.ts` — integration tests for the four server actions (create / update / delete / bulkDelete), modeled on the existing `value-props` action tests.
- Smoke check the public layout renders when:
  - Header menu has rows.
  - Header menu is empty (no `<ul>` crash).
  - Footer menu is empty (column not rendered).

## Edge cases

- **Empty header:** Navbar still renders (logo + cart + CTA). No console error from mapping `[]`.
- **Empty footer:** "Liên kết nhanh" column hidden; layout falls back to 3 columns.
- **External href:** `<Link>` handles `https://…` URLs; `target="_blank"` set when toggle on.
- **Duplicate sortOrder:** secondary sort by `id` keeps order stable.
- **Admin deletes everything:** site renders with no menu (intentional — fallback in code would be misleading).

## Files touched

| File | Change |
|------|--------|
| `db/schema.ts` | Add `menuItems` table + `MenuItemRow` type |
| `drizzle/000X_menu_items.sql` | Generated migration |
| `db/seed.ts` | Seed header items if empty |
| `scripts/seed.mjs` | Seed header items if empty |
| `lib/data.ts` | Add `getMenu(location)` |
| `app/(public)/layout.tsx` | Fetch both menus, pass to Navbar/Footer |
| `components/Navbar.tsx` | Replace hardcoded `links` with `items` prop |
| `components/Footer.tsx` | Add "Liên kết nhanh" column, accept `quickLinks` prop |
| `components/admin/Sidebar.tsx` | Add "Menu" entry under "Nội dung" |
| `app/admin/(shell)/menu/page.tsx` | List page (new) |
| `app/admin/(shell)/menu/new/page.tsx` | Create page (new) |
| `app/admin/(shell)/menu/[id]/page.tsx` | Edit page (new) |
| `app/admin/actions/menu.ts` | Server actions (new) |
| `tests/admin/menu.test.ts` | Integration tests (new) |
