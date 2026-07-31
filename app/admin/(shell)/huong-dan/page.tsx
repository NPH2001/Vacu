import type { Metadata } from 'next';
import GuideView from '@/components/admin/GuideView';
import { GUIDE_SECTIONS } from '@/lib/admin/guide';

export const metadata: Metadata = { title: 'Hướng dẫn sử dụng' };

// Nội dung là hằng nên trang không đọc database và không cần render lại mỗi
// request — cứ để Next dựng sẵn.
export default function GuidePage() {
  return <GuideView sections={GUIDE_SECTIONS} />;
}
