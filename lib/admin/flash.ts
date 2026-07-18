/**
 * Friendly outcomes for actions that finish with a redirect and therefore have
 * no form state to return into.
 *
 * Throwing was the old approach, but Next redacts server error messages in
 * production: a carefully worded Vietnamese explanation reached the admin as
 * "Application error: a server-side exception has occurred". Redirecting with a
 * code keeps the real reason visible.
 *
 * Codes rather than raw text, so nothing that lands in the URL can be
 * hand-crafted into a misleading message inside the admin UI.
 */
export const FLASH: Record<string, { kind: 'error' | 'ok'; text: string }> = {
  'danh-muc-dang-dung': {
    kind: 'error',
    text: 'Không xóa được danh mục này vì đang có sản phẩm thuộc về nó, hoặc nó còn danh mục con. Hãy chuyển sản phẩm sang danh mục khác (hoặc xóa danh mục con) rồi thử lại.',
  },
  'danh-muc-dang-dung-nhieu': {
    kind: 'error',
    text: 'Không xóa được: trong số các danh mục bạn chọn có danh mục đang chứa sản phẩm hoặc còn danh mục con. Chưa có danh mục nào bị xóa.',
  },
  'tu-xoa-tai-khoan': {
    kind: 'error',
    text: 'Bạn không thể tự xóa tài khoản đang đăng nhập. Nhờ một quản trị viên khác xóa giúp nếu cần.',
  },
  'xoa-admin-cuoi': {
    kind: 'error',
    text: 'Không xóa được: đây là quản trị viên (admin) duy nhất còn lại. Hãy tạo hoặc nâng quyền một admin khác trước.',
  },
  'khong-xoa-trang-chu': {
    kind: 'error',
    text: 'Không xóa được Trang chủ — đây là trang gốc của website. Bạn có thể ẩn/sắp xếp lại các khối bên trong thay vì xóa cả trang.',
  },
};

export function flashOf(code: string | string[] | undefined) {
  if (typeof code !== 'string') return null;
  return FLASH[code] ?? null;
}
