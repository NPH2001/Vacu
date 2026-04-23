import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/db/client';
import { emailTemplates, siteInfo } from '@/db/schema';
import EmailTemplateForm from '@/components/admin/EmailTemplateForm';
import { updateEmailTemplate } from '@/app/admin/actions/email-templates';

const VARS: Record<string, Array<{ name: string; hint: string }>> = {
  forgot_password: [
    { name: 'siteName', hint: 'Tên thương hiệu' },
    { name: 'userName', hint: 'Tên tài khoản admin' },
    { name: 'resetLink', hint: 'Link đặt lại mật khẩu (dùng 1 lần)' },
    { name: 'expiresInMinutes', hint: 'Số phút link còn hiệu lực' },
  ],
  order_confirm_customer: [
    { name: 'siteName', hint: 'Tên thương hiệu' },
    { name: 'siteEmail', hint: 'Email liên hệ site' },
    { name: 'sitePhone', hint: 'SĐT site' },
    { name: 'customerName', hint: 'Họ tên khách' },
    { name: 'orderId', hint: 'Mã đơn (VD: NTX-12345678)' },
    { name: 'orderTotal', hint: 'Tổng tiền đã format (VD: 350.000 ₫)' },
    { name: 'address', hint: 'Địa chỉ giao' },
    { name: 'deliverySlot', hint: 'Khung giờ giao' },
    { name: 'paymentMethod', hint: '"Tiền mặt khi nhận" / "Chuyển khoản"' },
    { name: 'paymentInfoHtml', hint: 'Khối HTML QR + thông tin chuyển khoản (nếu có). Nội dung HTML — không tự escape.' },
  ],
  order_notify_admin: [
    { name: 'siteName', hint: 'Tên thương hiệu' },
    { name: 'orderId', hint: 'Mã đơn' },
    { name: 'orderTotal', hint: 'Tổng tiền đã format' },
    { name: 'customerName', hint: 'Họ tên khách' },
    { name: 'customerEmail', hint: 'Email khách (có thể rỗng)' },
    { name: 'customerPhone', hint: 'SĐT khách' },
    { name: 'address', hint: 'Địa chỉ giao' },
    { name: 'deliverySlot', hint: 'Khung giờ giao' },
    { name: 'note', hint: 'Ghi chú khách' },
    { name: 'paymentMethod', hint: 'Phương thức thanh toán' },
    { name: 'adminOrderLink', hint: 'URL đầy đủ tới trang chi tiết đơn trong admin' },
  ],
  payment_confirmed: [
    { name: 'siteName', hint: 'Tên thương hiệu' },
    { name: 'customerName', hint: 'Họ tên khách' },
    { name: 'orderId', hint: 'Mã đơn' },
    { name: 'orderTotal', hint: 'Tổng tiền đã format' },
  ],
};

const SAMPLE_PAYMENT_BANK_HTML = `
<div style="margin:16px 0;padding:16px;background:#fffbeb;border:1px solid #fcd34d;border-radius:12px">
  <p style="margin:0 0 8px 0;font-weight:600;color:#92400e">Quét QR để chuyển khoản (mẫu):</p>
  <div style="width:220px;height:220px;background:#fff;border:1px dashed #d97706;display:inline-block;text-align:center;line-height:220px;color:#92400e;font-size:12px">QR CODE</div>
  <table style="width:100%;font-size:14px;margin-top:8px">
    <tr><td style="color:#666">Ngân hàng</td><td style="text-align:right">Vietcombank</td></tr>
    <tr><td style="color:#666">Số tài khoản</td><td style="text-align:right;font-family:monospace">0123456789</td></tr>
    <tr><td style="color:#666">Chủ tài khoản</td><td style="text-align:right">NGUYEN VAN A</td></tr>
    <tr><td style="color:#666">Số tiền</td><td style="text-align:right;font-weight:700">350.000 ₫</td></tr>
    <tr><td style="color:#666">Nội dung</td><td style="text-align:right;font-family:monospace;font-weight:700">Thanh toan NTX-12345678</td></tr>
  </table>
</div>`.trim();

function buildSampleVars(key: string, info: { name: string; email: string; phone: string; address: string; logoUrl: string | null }): Record<string, string> {
  const common = {
    siteName: info.name || 'Vacu',
    siteEmail: info.email || 'xinchao@vacu.com.vn',
    sitePhone: info.phone || '1900 2468',
    siteAddress: info.address || '—',
    logoUrl: info.logoUrl ?? '',
    year: String(new Date().getFullYear()),
  };
  switch (key) {
    case 'forgot_password':
      return {
        ...common,
        userName: 'Nguyễn Thị Hiền',
        resetLink: 'https://vacu.com.vn/admin/reset-password?token=abc123xyz',
        expiresInMinutes: '60',
      };
    case 'order_confirm_customer':
      return {
        ...common,
        customerName: 'Trần Văn B',
        orderId: 'NTX-12345678',
        orderTotal: '350.000 ₫',
        address: '123 Lê Lợi, Q.1, TP.HCM',
        deliverySlot: 'Sáng mai (7:00 - 11:00)',
        paymentMethod: 'Chuyển khoản ngân hàng',
        paymentInfoHtml: SAMPLE_PAYMENT_BANK_HTML,
      };
    case 'order_notify_admin':
      return {
        ...common,
        orderId: 'NTX-12345678',
        orderTotal: '350.000 ₫',
        customerName: 'Trần Văn B',
        customerEmail: 'b@example.com',
        customerPhone: '0912 345 678',
        address: '123 Lê Lợi, Q.1, TP.HCM',
        deliverySlot: 'Sáng mai (7:00 - 11:00)',
        note: 'Gọi trước 15 phút',
        paymentMethod: 'Chuyển khoản ngân hàng',
        adminOrderLink: 'https://vacu.com.vn/admin/orders/NTX-12345678',
      };
    case 'payment_confirmed':
      return {
        ...common,
        customerName: 'Trần Văn B',
        orderId: 'NTX-12345678',
        orderTotal: '350.000 ₫',
      };
    default:
      return common;
  }
}

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const [[row], [info]] = await Promise.all([
    db.select().from(emailTemplates).where(eq(emailTemplates.key, key)).limit(1),
    db.select().from(siteInfo).where(eq(siteInfo.id, 1)).limit(1),
  ]);
  if (!row) notFound();
  const bound = updateEmailTemplate.bind(null, row.key);
  const variables = VARS[row.key] ?? [];
  const sampleVars = buildSampleVars(row.key, {
    name: info?.name ?? 'Vacu',
    email: info?.email ?? '',
    phone: info?.phone ?? '',
    address: info?.address ?? '',
    logoUrl: info?.logoUrl ?? null,
  });
  return (
    <div className="space-y-5">
      <h1 className="admin-title text-[28px]">Sửa mẫu email</h1>
      <EmailTemplateForm
        action={bound}
        defaults={row}
        variables={variables}
        headerHtml={info?.emailHeaderHtml ?? ''}
        footerHtml={info?.emailFooterHtml ?? ''}
        sampleVars={sampleVars}
        rawKeys={row.key === 'order_confirm_customer' ? ['paymentInfoHtml', 'logoUrl'] : ['logoUrl']}
      />
    </div>
  );
}
