import 'dotenv/config';
import { db, pool } from './client';
import {
  categories, farmers, products, testimonials, faqItems, siteInfo, menuItems,
} from './schema';
import categoriesJson from '@/data/categories.json';
import farmersJson from '@/data/farmers.json';
import productsJson from '@/data/products.json';
import testimonialsJson from '@/data/testimonials.json';
import faqJson from '@/data/faq.json';
import infoJson from '@/data/info.json';

async function main() {
  console.log('Seeding categories...');
  for (const c of categoriesJson as any[]) {
    await db.insert(categories).values({
      id: c.id, name: c.name, icon: c.icon, description: c.description,
    }).onConflictDoNothing();
  }

  console.log('Seeding farmers...');
  for (const f of farmersJson as any[]) {
    await db.insert(farmers).values({
      id: f.id, name: f.name, farm: f.farm, location: f.location,
      years: f.years, specialty: f.specialty, avatar: f.avatar, cover: f.cover,
      story: f.story, certifications: f.certifications ?? [],
    }).onConflictDoNothing();
  }

  console.log('Seeding products...');
  for (const p of productsJson as any[]) {
    await db.insert(products).values({
      id: p.id, name: p.name, categoryId: p.category, unit: p.unit,
      price: p.price, oldPrice: p.oldPrice ?? null, image: p.image,
      farmerId: p.farmerId ?? null, description: p.description,
      tags: p.tags ?? [], featured: !!p.featured, inStock: !!p.inStock,
    }).onConflictDoNothing();
  }

  console.log('Seeding testimonials...');
  for (const [i, t] of (testimonialsJson as any[]).entries()) {
    await db.insert(testimonials).values({
      name: t.name, role: t.role, avatar: t.avatar, content: t.content,
      sortOrder: i * 10,
    });
  }

  console.log('Seeding FAQ...');
  for (const [i, q] of (faqJson as any[]).entries()) {
    await db.insert(faqItems).values({
      question: q.q, answer: q.a, sortOrder: i * 10,
    });
  }

  console.log('Seeding site_info...');
  const info = infoJson as any;
  await db.insert(siteInfo).values({
    id: 1,
    name: info.name, shortName: info.shortName, tagline: info.tagline,
    description: info.description, address: info.address, phone: info.phone,
    email: info.email, hours: info.hours,
    statFarmers: info.stats.farmers, statProducts: info.stats.products,
    statCustomers: info.stats.customers, statYears: info.stats.years,
    logoUrl: info.logoUrl ?? null,
  }).onConflictDoNothing();

  console.log('Seeding menu_items...');
  const existingMenu = await db.select().from(menuItems);
  if (existingMenu.length === 0) {
    const HEADER = [
      { label: 'Trang chủ',         href: '/' },
      { label: 'Rau Sạch Hữu Cơ',   href: '/danh-muc/rau-cu' },
      { label: 'Gà ăn thảo dược',   href: '/danh-muc/trung-thit' },
      { label: 'Cá Tầm Nga',        href: '/products' },
      { label: 'Thực phẩm bổ sung', href: '/products' },
      { label: 'Câu chuyện',        href: '/about' },
      { label: 'Liên hệ',           href: '/contact' },
    ];
    for (const [i, m] of HEADER.entries()) {
      await db.insert(menuItems).values({
        location: 'header', label: m.label, href: m.href, sortOrder: (i + 1) * 10,
      });
    }
  }

  console.log('Done.');
  await pool.end();
}

main().catch((err) => { console.error(err); process.exit(1); });
