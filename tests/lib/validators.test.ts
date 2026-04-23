import { describe, it, expect } from 'vitest';
import {
  placeOrderSchema,
  resetPasswordSchema,
  requestPasswordResetSchema,
  emailTemplateSchema,
  categorySchema,
  valuePropSchema,
  paymentMethodSchema,
  orderStatusSchema,
} from '@/lib/validators';

describe('placeOrderSchema', () => {
  const base = {
    customerName: 'Ana',
    phone: '0912345678',
    address: '12 Le Loi, Q1',
    deliverySlot: 'Sáng mai',
  };

  it('accepts minimal COD order', () => {
    const r = placeOrderSchema.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.paymentMethod).toBe('cod');
      expect(r.data.customerEmail).toBeUndefined();
    }
  });

  it('accepts bank order with email', () => {
    const r = placeOrderSchema.safeParse({
      ...base,
      paymentMethod: 'bank',
      customerEmail: 'a@b.com',
    });
    expect(r.success).toBe(true);
  });

  it('transforms empty email to undefined', () => {
    const r = placeOrderSchema.safeParse({ ...base, customerEmail: '' });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.customerEmail).toBeUndefined();
  });

  it('rejects invalid email', () => {
    const r = placeOrderSchema.safeParse({ ...base, customerEmail: 'not-an-email' });
    expect(r.success).toBe(false);
  });

  it('rejects short phone', () => {
    const r = placeOrderSchema.safeParse({ ...base, phone: '12' });
    expect(r.success).toBe(false);
  });

  it('rejects invalid paymentMethod', () => {
    const r = placeOrderSchema.safeParse({ ...base, paymentMethod: 'crypto' });
    expect(r.success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('accepts valid token + password', () => {
    const r = resetPasswordSchema.safeParse({ token: 'a'.repeat(32), password: 'secret123' });
    expect(r.success).toBe(true);
  });

  it('rejects short password', () => {
    const r = resetPasswordSchema.safeParse({ token: 'a'.repeat(32), password: 'short' });
    expect(r.success).toBe(false);
  });

  it('rejects short token', () => {
    const r = resetPasswordSchema.safeParse({ token: 'abc', password: 'secret123' });
    expect(r.success).toBe(false);
  });
});

describe('requestPasswordResetSchema', () => {
  it('accepts valid email', () => {
    expect(requestPasswordResetSchema.safeParse({ email: 'a@b.com' }).success).toBe(true);
  });
  it('rejects invalid email', () => {
    expect(requestPasswordResetSchema.safeParse({ email: 'nope' }).success).toBe(false);
  });
});

describe('emailTemplateSchema', () => {
  it('accepts full payload', () => {
    const r = emailTemplateSchema.safeParse({
      name: 'T',
      description: '',
      subject: 'Hi {{name}}',
      bodyHtml: '<p>Hi</p>',
      enabled: true,
    });
    expect(r.success).toBe(true);
  });

  it('defaults description empty', () => {
    const r = emailTemplateSchema.safeParse({
      name: 'T',
      subject: 'Hi',
      bodyHtml: '<p>Hi</p>',
      enabled: true,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.description).toBe('');
  });

  it('rejects empty subject', () => {
    expect(emailTemplateSchema.safeParse({
      name: 'T', subject: '', bodyHtml: 'x', enabled: true,
    }).success).toBe(false);
  });
});

describe('categorySchema slug regex', () => {
  it('accepts lowercase/dash slug', () => {
    const r = categorySchema.safeParse({ id: 'rau-sach', name: 'n', icon: '🥬', description: '-' });
    expect(r.success).toBe(true);
  });
  it('rejects uppercase slug', () => {
    const r = categorySchema.safeParse({ id: 'Rau-Sach', name: 'n', icon: '🥬', description: '-' });
    expect(r.success).toBe(false);
  });
  it('rejects slug with space', () => {
    const r = categorySchema.safeParse({ id: 'rau sach', name: 'n', icon: '🥬', description: '-' });
    expect(r.success).toBe(false);
  });
});

describe('valuePropSchema', () => {
  it('accepts valid', () => {
    expect(valuePropSchema.safeParse({
      icon: '🌱', title: 'T', description: 'D', sortOrder: 0,
    }).success).toBe(true);
  });
});

describe('paymentMethodSchema', () => {
  it('coerces active "on" to true', () => {
    const r = paymentMethodSchema.safeParse({
      id: 'cod', label: 'COD', active: 'on', sortOrder: 0,
    });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.active).toBe(true);
  });
});

describe('orderStatusSchema', () => {
  it('accepts all 5 statuses', () => {
    for (const s of ['pending', 'preparing', 'delivering', 'delivered', 'cancelled'] as const) {
      expect(orderStatusSchema.safeParse(s).success).toBe(true);
    }
  });
  it('rejects unknown status', () => {
    expect(orderStatusSchema.safeParse('shipped').success).toBe(false);
  });
});
