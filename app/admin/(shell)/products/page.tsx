import Link from 'next/link';
import { asc } from 'drizzle-orm';
import { db } from '@/db/client';
import { products, categories } from '@/db/schema';
import { formatPrice } from '@/lib/format';
import DeleteButton from '@/components/admin/DeleteButton';
import { deleteProduct } from '@/app/admin/actions/products';

export default async function ProductsAdminPage() {
  const [rows, cats] = await Promise.all([
    db.select().from(products).orderBy(asc(products.name)),
    db.select().from(categories).orderBy(asc(categories.name)),
  ]);
  const catMap = new Map(cats.map((c) => [c.id, c.name]));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-display text-green-950">Sản phẩm</h1>
        <Link href="/admin/products/new"
          className="bg-green-700 hover:bg-green-800 text-white font-semibold px-4 py-2 rounded-full text-sm">
          + Thêm sản phẩm
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-green-100 overflow-hidden">
        {rows.length === 0 ? (
          <div className="p-6 text-sm text-green-900/70">Chưa có sản phẩm.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-green-900/70 bg-green-50/60">
              <tr>
                <th className="px-4 py-2.5 font-medium">Ảnh</th>
                <th className="px-4 py-2.5 font-medium">Tên</th>
                <th className="px-4 py-2.5 font-medium">Danh mục</th>
                <th className="px-4 py-2.5 font-medium">Giá</th>
                <th className="px-4 py-2.5 font-medium">Trạng thái</th>
                <th className="px-4 py-2.5 font-medium text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-t border-green-50">
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
        )}
      </div>
    </div>
  );
}
