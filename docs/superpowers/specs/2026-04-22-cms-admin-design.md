# CMS quản trị Nông Trại Xanh — Thiết kế

- **Ngày:** 2026-04-22
- **Trạng thái:** Đã duyệt
- **Tác giả:** Claude (brainstorm với chủ dự án)

## 1. Mục tiêu

Biến site tĩnh hiện tại (Next.js 16 + dữ liệu JSON) thành một ứng dụng có CMS quản trị ở `/admin/*`, cho phép admin quản lý sản phẩm, danh mục, nông dân, lời chứng thực (testimonial), FAQ, thông tin site, đơn hàng và tài khoản admin. Site công khai giữ nguyên UI/UX và URL hiện tại, chỉ đổi nguồn dữ liệu từ JSON sang Postgres.

Không trong phạm vi v1: multi-tenant, i18n backend, analytics, workflow duyệt bài, tích hợp thanh toán online.

## 2. Quyết định kiến trúc

| Lĩnh vực | Chọn | Ghi chú |
| --- | --- | --- |
| Persistence | **Postgres** | Self-host, kết nối qua `DATABASE_URL` |
| ORM | **Drizzle ORM + drizzle-kit** + `pg` | Schema TS là nguồn types duy nhất |
| Auth | **Bảng `users`, cookie session JWT HS256** | `jose` ký, `argon2` hash password |
| Image upload | **Filesystem local** `public/uploads/` | Resize bằng `sharp` sang WebP 1200w |
| UI admin | Nhúng cùng app dưới route group `/admin` | Server Actions cho mutation |
| Orders | Chuyển khỏi localStorage → DB | Lưu vào `orders` + `order_items` |

## 3. Cấu trúc thư mục

```
vacu/
├── app/
│   ├── layout.tsx                 # ROOT: chỉ <html><body> + fonts + <Toaster>
│   ├── (public)/                  # route group: / /products /farmers ... giữ nguyên URL
│   │   ├── layout.tsx             # Navbar + Footer + CartProvider + CartDrawer
│   │   └── page.tsx, about/, products/, farmers/, contact/, checkout/, orders/
│   │                              # nội dung app/page.tsx + subfolders hiện tại được MOVE vào đây;
│   │                              # app/layout.tsx cũ bị tách: phần <html> giữ ở root, phần Navbar/Footer/Providers chuyển xuống (public)/layout.tsx
│   ├── admin/
│   │   ├── layout.tsx             # shell sidebar + requireAdmin()
│   │   ├── login/page.tsx
│   │   ├── page.tsx               # dashboard
│   │   ├── products/              # list, new, [id]/edit
│   │   ├── categories/
│   │   ├── farmers/
│   │   ├── testimonials/
│   │   ├── faq/
│   │   ├── orders/                # list + [id]
│   │   ├── users/                 # chỉ role=admin
│   │   └── settings/              # 1 hàng site_info
│   └── api/
│       ├── upload/route.ts        # POST multipart
│       └── auth/logout/route.ts
├── db/
│   ├── schema.ts                  # Drizzle schema
│   ├── client.ts                  # pg Pool + drizzle()
│   ├── migrate.ts
│   ├── seed.ts                    # JSON → DB
│   └── seed-admin.ts              # tạo admin từ env
├── drizzle/                       # sinh bởi drizzle-kit
├── lib/
│   ├── data.ts                    # query helpers, giờ async
│   ├── auth.ts                    # hash, verify, sign/verify JWT
│   ├── session.ts                 # getSession, requireAdmin
│   ├── uploads.ts                 # save+resize
│   └── validators.ts              # zod schemas dùng chung
├── components/admin/              # Sidebar, Topbar, ImageUpload, DataTable,...
├── proxy.ts                       # Next 16: thay cho middleware.ts
├── drizzle.config.ts
├── docker-compose.yml             # Postgres local dev
└── public/uploads/                # git-ignore
```

**Next.js 16 lưu ý:**
- `middleware.ts` **đã bị rename thành `proxy.ts`** — dùng tên mới.
- `cookies()` là **async** — luôn `await cookies()`.
- `.set/.delete` cookies chỉ được gọi trong Server Function (Server Action) hoặc Route Handler.
- Mutation ưu tiên **Server Actions**, REST chỉ dùng khi bắt buộc (multipart upload, logout).

## 4. Database schema

### 4.1 Bảng

```ts
users (
  id         uuid PK default gen_random_uuid()
  email      text unique not null
  passwordHash text not null
  name       text not null
  role       text not null  -- 'admin' | 'staff'
  createdAt  timestamptz default now()
  updatedAt  timestamptz default now()
)

categories (
  id          text PK          -- slug: 'rau-cu'
  name        text not null
  icon        text not null
  description text not null
  sortOrder   int default 0
  createdAt   timestamptz default now()
  updatedAt   timestamptz default now()
)

farmers (
  id             text PK        -- slug: 'nguyen-thi-hoa'
  name           text not null
  farm           text not null
  location       text not null
  years          int not null
  specialty      text not null
  avatar         text not null
  cover          text not null
  story          text not null
  certifications jsonb not null default '[]'  -- string[]
  createdAt      timestamptz default now()
  updatedAt      timestamptz default now()
)

products (
  id          text PK          -- slug: 'rau-cai-xoan'
  name        text not null
  categoryId  text not null references categories(id) on delete restrict
  unit        text not null
  price       int not null     -- VND, nguyên
  oldPrice    int
  image       text not null
  farmerId    text references farmers(id) on delete set null
  description text not null
  tags        jsonb not null default '[]'     -- string[]
  featured    bool not null default false
  inStock     bool not null default true
  createdAt   timestamptz default now()
  updatedAt   timestamptz default now()
)

testimonials (
  id        serial PK
  name      text not null
  role      text not null
  avatar    text not null
  content   text not null
  sortOrder int default 0
)

faq_items (
  id        serial PK
  question  text not null
  answer    text not null
  sortOrder int default 0
)

site_info (
  id             int PK check (id = 1)   -- 1 hàng duy nhất
  name           text
  shortName      text
  tagline        text
  description    text
  address        text
  phone          text
  email          text
  hours          text
  statFarmers    text
  statProducts   text
  statCustomers  text
  statYears      text
)

orders (
  id            text PK          -- 'NTX-XXXXXXXX'
  customerName  text not null
  phone         text not null
  address       text not null
  deliverySlot  text not null
  note          text
  total         int not null
  status        text not null default 'pending'
    check (status in ('pending','preparing','delivering','delivered','cancelled'))
  createdAt     timestamptz default now()
  updatedAt     timestamptz default now()
)

order_items (
  id        serial PK
  orderId   text not null references orders(id) on delete cascade
  productId text not null      -- không FK, để giữ lịch sử kể cả khi product bị xoá
  name      text not null
  price     int not null
  qty       int not null
  unit      text not null
  image     text not null
)
```

### 4.2 Index

- `products(categoryId)`, `products(farmerId)`, `products(featured)` where featured = true
- `orders(createdAt desc)`, `orders(status)`
- `order_items(orderId)`

### 4.3 Migration ban đầu

Script `db/seed.ts`:
1. Đọc 6 file `data/*.json`.
2. Upsert theo id (nếu đã tồn tại thì không ghi đè — lần chạy đầu chỉ insert).
3. `site_info`: upsert hàng id=1 từ `info.json`.

Script `db/seed-admin.ts`: đọc `ADMIN_EMAIL` + `ADMIN_PASSWORD` từ env → insert user role='admin' nếu chưa có. Chạy 1 lần sau deploy đầu.

## 5. Auth

### 5.1 Session

- Cookie name: `ntx_session`
- Thuộc tính: `HttpOnly`, `Secure` (prod), `SameSite=Lax`, `Path=/`, `Max-Age=7*24*3600`
- Payload JWT HS256: `{ sub: userId, role, iat, exp }`
- Bí mật: `AUTH_SECRET` (env), phải ≥ 32 bytes

### 5.2 Flow

1. `GET /admin/login` — render form.
2. `POST` qua server action `signIn(formData)`:
   - Validate email+password với zod.
   - Query user, verify argon2.
   - Ký JWT 7 ngày, `(await cookies()).set('ntx_session', jwt, {...})`.
   - Redirect `next` hoặc `/admin`.
3. `proxy.ts` (matcher: `/admin/:path*` trừ `/admin/login`): verify cookie, không hợp lệ → `NextResponse.redirect('/admin/login?next=<path>')`.
4. `app/admin/layout.tsx` gọi `await requireAdmin()` — đọc DB user theo `sub`. Nếu không tìm thấy / role không đủ → `redirect('/admin/login')`.
5. `POST /api/auth/logout` xoá cookie, redirect `/admin/login`.

### 5.3 Phân quyền

- `admin`: làm được mọi thứ, bao gồm quản lý users.
- `staff`: tất cả trừ `/admin/users`. Kiểm tra trong layout của `/admin/users` + trong server action tạo/xoá user.

## 6. Admin UI

### 6.1 Shell

- Sidebar trái cố định (≥1024px) / drawer (mobile): Dashboard, Products, Categories, Farmers, Testimonials, FAQ, Orders, Users (admin-only), Settings.
- Topbar: tên user + nút Logout (form POST).
- Tone: cùng palette xanh với site công khai nhưng tối giản, không ảnh nền, bảng dense, font `Inter`, dùng Tailwind v4 utility giống site hiện tại.

### 6.2 List pages (pattern chung)

- Search theo text (`ILIKE`).
- Filter theo field quan trọng (category/farmer/status).
- Sort click cột.
- Pagination 20/trang, query string `?page=&q=&sort=`.
- Mỗi hàng: Edit link, Delete (form confirm).
- `Testimonials` và `FAQ` có thêm input number `sortOrder` trên form; list sắp xếp theo `sortOrder asc, id asc`. (Kéo-thả để sau.)

### 6.3 Form pages

- 2 cột: form trái, preview/hint phải.
- Validate client + server bằng **cùng schema zod** (share trong `lib/validators.ts`).
- Nút Save dùng `useFormStatus` để hiển thị spinner.
- Server action trả về `{ ok: false, fieldErrors }` hoặc redirect khi thành công.
- Mọi server action mutation phải gọi `revalidatePath()` cho các trang công khai bị ảnh hưởng (ví dụ: edit product → revalidate `/`, `/products`, `/products/[id]`, `/farmers/[id]`) để UI site công khai cập nhật ngay.

### 6.4 Trang đặc biệt

- **Dashboard:** 4 card (đơn hôm nay, doanh thu 7 ngày, sản phẩm hết hàng, đơn pending) + bảng 10 đơn mới nhất.
- **Orders/[id]:** chi tiết đơn readonly + select đổi status. Không cho sửa items.
- **Settings:** form đơn hàng duy nhất cho `site_info`.

### 6.5 Upload ảnh

- Component `<ImageUpload>` với preview, drop zone.
- Upload qua `POST /api/upload` (multipart). Server:
  - Verify session (role ≥ staff).
  - Kiểm MIME (`image/jpeg|png|webp`), size ≤ 4MB.
  - `sharp`: resize max 1200w, convert WebP chất lượng 82.
  - Lưu `public/uploads/YYYY/MM/<uuid>.webp`.
  - Trả về `{ url: '/uploads/2026/04/<uuid>.webp' }`.
- Form giữ URL này vào field `image` / `avatar` / `cover`.

## 7. Tương thích với frontend hiện tại

### 7.1 `lib/data.ts`

API cũ là sync (`products: Product[]`, `getProduct(id)`), API mới là **async**. Thay đổi callsite cụ thể:

- `app/page.tsx`, `app/about/page.tsx`, `app/products/page.tsx`, `app/products/[id]/page.tsx`, `app/farmers/page.tsx`, `app/farmers/[id]/page.tsx`, `app/contact/page.tsx`, `app/checkout/page.tsx`, `components/Navbar.tsx`, `components/Footer.tsx`, `components/CheckoutForm.tsx`, `components/ProductCard.tsx`, `app/layout.tsx` — thêm `await` vào các call, chuyển component thành `async` nếu là Server Component.
- Các component client (`Navbar`, `CheckoutForm`, `ProductCard`, `CartProvider`) không đọc `info`/`products` trực tiếp được nữa — phải nhận data qua props từ parent Server Component.

### 7.2 Checkout & Orders

- **Checkout:** `components/CheckoutForm.tsx` đổi từ `useOrders().addOrder()` → gọi **server action** `placeOrder(formData)` ghi DB, trả `{ orderId }`. Redirect `/orders?new=<id>`.
- **OrdersProvider & localStorage:** bỏ hoàn toàn.
- **/orders:** trang "Đơn gần nhất của tôi" — sau khi checkout thành công, append `orderId` vào cookie `ntx_my_orders` (JSON array, giới hạn 20 id gần nhất, 30 ngày). Trang query DB các đơn theo danh sách id đó. v1 chấp nhận: nếu user xoá cookie hoặc đổi thiết bị, không xem lại được. (Tài khoản khách hàng là feature sau.)

### 7.3 Migration checklist

1. Setup Postgres + schema + seed.
2. Viết `lib/data.ts` async, viết test migrating 1 trang (homepage) xanh.
3. Đổi lần lượt từng page sang dùng DB.
4. Xoá `OrdersProvider`, đổi checkout sang server action.
5. Kiểm toàn site OK rồi mới bắt đầu code `/admin`.

## 8. Testing

- **Unit (`node:test` hoặc `vitest`):**
  - `lib/auth.ts`: hash→verify, sign→verify token (expiry, chữ ký sai).
  - `lib/uploads.ts`: reject MIME sai, kích thước quá.
  - `lib/validators.ts`: shape các schema (happy path + 2 edge).
- **Integration:**
  - Postgres test DB (testcontainers hoặc schema riêng).
  - Server actions CRUD cho từng entity: create → list → update → delete.
  - `placeOrder` với cart mẫu → xác nhận row tạo đúng.
  - `signIn` happy path + sai pass + không tồn tại + user bị xoá.
- **Smoke manual checklist** lưu trong `docs/superpowers/specs/checklists/cms-smoke.md`:
  1. Login admin; 2. Tạo product; 3. Upload ảnh; 4. Đánh dấu featured; 5. Xem homepage có product mới; 6. Đặt hàng từ guest; 7. Thấy đơn ở `/admin/orders`; 8. Đổi status; 9. Tạo staff user; 10. Logout.

## 9. Environment variables

```
DATABASE_URL=postgres://vacu:vacu@localhost:5432/vacu
AUTH_SECRET=<openssl rand -hex 32>
ADMIN_EMAIL=admin@nongtraixanh.vn
ADMIN_PASSWORD=<đặt 1 lần cho seed-admin rồi bỏ khỏi env>
UPLOADS_DIR=./public/uploads        # optional
NODE_ENV=development|production
```

## 10. Docker compose cho dev

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: vacu
      POSTGRES_PASSWORD: vacu
      POSTGRES_DB: vacu
    ports: ['5432:5432']
    volumes: ['postgres-data:/var/lib/postgresql/data']
volumes:
  postgres-data:
```

Scripts `package.json` mới:

```
"db:up": "docker compose up -d postgres",
"db:generate": "drizzle-kit generate",
"db:migrate":  "tsx db/migrate.ts",
"db:seed":     "tsx db/seed.ts",
"db:seed-admin": "tsx db/seed-admin.ts"
```

## 11. Dependencies thêm

Runtime: `drizzle-orm`, `pg`, `jose`, `argon2` (hoặc `@node-rs/argon2`), `zod`, `sharp`.

Dev: `drizzle-kit`, `tsx`, `@types/pg`, `vitest` (hoặc dùng `node:test`), `testcontainers`.

## 12. Các vấn đề mở / rủi ro

- **Image optimization pipeline** — `sharp` có native deps. Trên môi trường Alpine cần cài `vips-dev`. Chấp nhận được với self-host x86_64 Ubuntu.
- **Static export**: app hiện không bật `output: 'export'`; sau khi có DB thì cũng không dùng được static export. Đây là trade-off đã chấp nhận.
- **Không có tài khoản khách hàng** — v1 chỉ tra cứu đơn theo phone + cookie. Tài khoản user cuối là scope về sau.
- **Không có rate-limit trên `/admin/login`** v1 — ít rủi ro vì admin panel nội bộ, nhưng ghi vào backlog.
- **Backup DB** — out of scope tài liệu này; chủ dự án tự lên lịch `pg_dump`.
