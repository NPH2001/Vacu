import Link from 'next/link';
import { asc, sql } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, categories } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import DeleteButton from '@/components/admin/DeleteButton';
import BulkDeleteForm from '@/components/admin/BulkDeleteForm';
import { deleteProduct, bulkDeleteProducts } from '@/app/admin/actions/products';
import SearchInput from '@/components/admin/list/SearchInput';
import FilterSelect from '@/components/admin/list/FilterSelect';
import FilterChips from '@/components/admin/list/FilterChips';
import SortableTh from '@/components/admin/list/SortableTh';
import Pagination from '@/components/admin/list/Pagination';
import PageSizeSelect from '@/components/admin/list/PageSizeSelect';
import ClearFiltersLink from '@/components/admin/list/ClearFiltersLink';
import {
  parseListParams, buildWhere, buildOrderBy, buildPagination,
  type ListSchema,
} from '@/lib/admin/list-params';

const BASE = '/admin/products';

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const cats = await db.select().from(categories).orderBy(asc(categories.name));

  const schema: ListSchema = {
    searchFields: [products.name, products.id, products.description],
    sortable: {
      name: products.name,
      price: products.price,
      createdAt: products.createdAt,
    },
    defaultSort: 'name',
    filters: {
      categoryId: {
        type: 'equals',
        column: products.categoryId,
        values: cats.map((c) => c.id),
      },
      featured: { type: 'boolean', column: products.featured },
      inStock: { type: 'boolean', column: products.inStock },
    },
  };

  const parsed = parseListParams(sp, schema);
  const where = buildWhere(parsed, schema);
  const orderBy = buildOrderBy(parsed, schema);
  const { limit, offset } = buildPagination(parsed);

  const [rows, totalRows] = await Promise.all([
    db.select().from(products).where(where).orderBy(orderBy).limit(limit).offset(offset),
    db.select({ total: sql<number>`count(*)::int` }).from(products).where(where),
  ]);
  const total = totalRows[0]?.total ?? 0;
  const catMap = new Map(cats.map((c) => [c.id, c.name]));
  const hasFilter = parsed.q !== '' || Object.keys(parsed.filters).length > 0;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Sản phẩm</h1>
        <Link
          href="/admin/products/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <SearchInput placeholder="Tìm theo tên / mã / mô tả…" />
        <FilterSelect
          filterKey="categoryId"
          current={parsed.filters.categoryId ?? null}
          options={cats.map((c) => ({ value: c.id, label: c.name }))}
          placeholder="Tất cả danh mục"
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="featured"
          options={[
            { value: null, label: 'Mọi sản phẩm' },
            { value: '1', label: '⭐ Nổi bật' },
          ]}
        />
        <FilterChips
          basePath={BASE}
          parsed={parsed}
          filterKey="inStock"
          options={[
            { value: null, label: 'Mọi tồn kho' },
            { value: '1', label: 'Còn' },
            { value: '0', label: 'Hết' },
          ]}
        />
        <div className="ml-auto"><ClearFiltersLink basePath={BASE} parsed={parsed} /></div>
      </div>

      {total === 0 ? (
        <div className="bg-white rounded-2xl border border-green-100 p-6 text-sm text-green-900/70">
          {hasFilter ? 'Không có kết quả phù hợp.' : 'Chưa có sản phẩm.'}
        </div>
      ) : (
        <BulkDeleteForm action={bulkDeleteProducts}>
          <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="text-left text-green-900/70 bg-green-50/60">
                <tr>
                  <th className="px-4 py-2.5 w-10"></th>
                  <th className="px-4 py-2.5 font-medium">Ảnh</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="name">Tên</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Danh mục</th>
                  <SortableTh basePath={BASE} parsed={parsed} schema={schema} sortKey="price">Giá</SortableTh>
                  <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                  <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-t border-green-50">
                    <td className="px-4 py-2">
                      <input type="checkbox" name="ids" value={p.id} />
                    </td>
                    <td className="px-4 py-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover" />}
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-green-950 hover:underline">{p.name}</Link>
                      <div className="text-xs text-green-900/60">{p.id}</div>
                    </td>
                    <td className="px-4 py-2">{catMap.get(p.categoryId) ?? p.categoryId}</td>
                    <td className="px-4 py-2">{formatPrice(p.price)}</td>
                    <td className="px-4 py-2 space-x-1">
                      {p.featured && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 rounded">Nổi bật</span>}
                      {!p.inStock && <span className="text-xs px-2 py-0.5 bg-red-100 text-red-800 rounded">Hết</span>}
                    </td>
                    <td className="px-4 py-2 text-right space-x-3">
                      <Link href={`/admin/products/${p.id}`} className="text-green-700 hover:underline">Sửa</Link>
                      <DeleteButton action={deleteProduct.bind(null, p.id)} confirmText={`Xóa sản phẩm "${p.name}"?`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </BulkDeleteForm>
      )}

      <div className="flex items-center justify-between">
        <Pagination basePath={BASE} parsed={parsed} schema={schema} total={total} />
        <PageSizeSelect />
      </div>
    </div>
  );
}
