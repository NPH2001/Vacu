import { z } from 'zod';

/**
 * Vietnamese error messages for every Zod schema, set once and applied
 * globally. Admin forms surface `error.issues[0].message` straight to a
 * non-technical user, and Zod's defaults are English ("Too small: expected
 * string to have >=1 characters"), so without this every validation failure is
 * unreadable to the shop owner.
 *
 * Field-specific messages passed at the schema (e.g. `.min(1, 'Vui lòng chọn
 * ảnh')`) still take precedence — this only fills the gaps.
 *
 * Imported for its side effect by lib/validators.ts, which every server action
 * pulls in, so the config is active before any parse runs.
 */
z.config({
  customError: (iss): string | undefined => {
    switch (iss.code) {
      case 'invalid_type':
        return iss.expected === 'number' ? 'Vui lòng nhập một số hợp lệ' : 'Giá trị không hợp lệ';

      case 'too_small': {
        const min = Number(iss.minimum);
        if (iss.origin === 'string') return min <= 1 ? 'Không được để trống' : `Quá ngắn — tối thiểu ${min} ký tự`;
        if (iss.origin === 'number') return min <= 0 ? 'Phải lớn hơn 0' : `Phải từ ${min} trở lên`;
        if (iss.origin === 'array') return min <= 1 ? 'Cần ít nhất một mục' : `Cần ít nhất ${min} mục`;
        return 'Giá trị quá nhỏ';
      }

      case 'too_big': {
        const max = Number(iss.maximum);
        if (iss.origin === 'string') return `Quá dài — tối đa ${max} ký tự`;
        if (iss.origin === 'number') return `Không được vượt quá ${max}`;
        if (iss.origin === 'array') return `Chỉ được tối đa ${max} mục`;
        return 'Giá trị quá lớn';
      }

      case 'invalid_format': {
        const fmt = 'format' in iss ? iss.format : '';
        if (fmt === 'email') return 'Email không hợp lệ';
        if (fmt === 'url') return 'Đường dẫn không hợp lệ';
        return 'Định dạng không đúng';
      }

      case 'invalid_value':
        return 'Giá trị không hợp lệ';

      default:
        // Rare codes fall back to Zod's default text.
        return undefined;
    }
  },
});
