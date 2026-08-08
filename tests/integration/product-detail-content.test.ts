import { createElement, Fragment, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

let body = '';
let reviews: Array<{ id: number; name: string; avatar: string | null; content: string; rating: number; sortOrder: number }> = [];

vi.mock('@/lib/data', () => ({
  getProduct: async () => ({
    id: 'rau-a', name: 'Rau A', categoryId: 'rau', farmerId: null, unit: 'kg', price: 20000,
    oldPrice: null, image: '/rau.webp', description: 'Rau ngon', descriptionTitle: 'Cách bảo quản Rau A', body, tags: [], featured: false, inStock: true,
  }),
  getFarmer: async () => null,
  getFarmersByIds: async () => new Map(),
  getCategory: async () => null,
  getAllProducts: async () => [],
  getProductGallery: async () => [],
  getProductReviews: async () => reviews,
  getSiteInfo: async () => ({ name: 'Vacu', grownByLabel: 'Người trồng', productDetailHeading: 'Chi tiết sản phẩm', relatedProductsHeading: 'Sản phẩm liên quan' }),
  formatPrice: (price: number) => `${price}đ`,
}));
vi.mock('@/lib/seo', () => ({ seoMeta: (value: unknown) => value }));
vi.mock('@/lib/jsonld', () => ({ productLd: () => ({}), breadcrumbLd: () => ({}) }));
vi.mock('@/components/JsonLd', () => ({ default: () => null }));
vi.mock('@/components/ProductCard', () => ({ default: () => null }));
vi.mock('@/components/ProductBuyBox', () => ({ default: () => null }));
vi.mock('@/components/ProductGallery', () => ({ default: () => null }));
vi.mock('@/components/SmartImage', () => ({ default: ({ alt }: { alt: string }) => createElement('span', null, alt) }));
vi.mock('next/link', () => ({ default: ({ children }: { children: ReactNode }) => createElement(Fragment, null, children) }));
vi.mock('next/navigation', () => ({ notFound: () => { throw new Error('not found'); } }));

describe('ProductDetailPage detail content', () => {
  beforeEach(() => { body = ''; reviews = []; });

  it('omits empty description and review sections', async () => {
    const { default: ProductDetailPage } = await import('@/app/(public)/products/[id]/page');
    const html = renderToStaticMarkup(await ProductDetailPage({ params: Promise.resolve({ id: 'rau-a' }) }));
    expect(html).not.toContain('Cách bảo quản Rau A');
    expect(html).not.toContain('Đánh giá khách hàng');
  });

  it('renders the saved description and only ordered product reviews', async () => {
    body = '<p>Bảo quản trong ngăn mát.</p>';
    reviews = [
      { id: 2, name: 'Khách sau', avatar: null, content: 'Đánh giá sau', rating: 4, sortOrder: 20 },
      { id: 1, name: 'Khách trước', avatar: '/avatar.webp', content: 'Đánh giá trước', rating: 5, sortOrder: 10 },
    ];
    const { default: ProductDetailPage } = await import('@/app/(public)/products/[id]/page');
    const html = renderToStaticMarkup(await ProductDetailPage({ params: Promise.resolve({ id: 'rau-a' }) }));
    expect(html).toContain('Bảo quản trong ngăn mát.');
    expect(html).toContain('Cách bảo quản Rau A');
    expect(html).toContain('Đánh giá khách hàng');
    expect(html.indexOf('Khách sau')).toBeLessThan(html.indexOf('Khách trước'));
    expect(html).toContain('4 trên 5 sao');
  });
});
