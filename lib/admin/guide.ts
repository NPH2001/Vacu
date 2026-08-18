/**
 * Nội dung trang “Hướng dẫn sử dụng” (/admin/huong-dan).
 *
 * Tách khỏi component để nội dung là dữ liệu thuần: trang chỉ việc render, ô
 * tìm kiếm chỉ việc lọc, và một test có thể soát được mọi đường dẫn trong đây
 * có thật hay không (tests/lib/admin-guide.test.ts) — hướng dẫn chết link còn
 * tệ hơn không có hướng dẫn.
 *
 * Quy ước chữ đậm: bọc trong dấu sao, ví dụ `*Đơn hàng*`. Không phải markdown —
 * chỉ một cặp dấu sao, render bằng renderInline() trong GuideView.
 */

export type GuideBlock =
  | { kind: 'p'; text: string }
  /** Các bước có đánh số. */
  | { kind: 'steps'; items: string[] }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; head: string[]; rows: string[][] }
  | { kind: 'note'; tone: 'tip' | 'warn'; text: string };

export type GuideSection = {
  /** Neo trong trang, cũng là key của mục lục. */
  id: string;
  title: string;
  icon: string;
  summary: string;
  /** Hiện huy hiệu “Chỉ Admin” — nhân viên vẫn đọc được phần giải thích. */
  adminOnly?: boolean;
  /** Nút đi thẳng tới màn hình đang được nói tới. */
  links?: { href: string; label: string }[];
  blocks: GuideBlock[];
};

export const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'bat-dau',
    icon: '✧',
    title: 'Bắt đầu',
    summary: 'Đăng nhập, quên mật khẩu, đổi mật khẩu, đăng xuất.',
    links: [{ href: '/admin/account', label: 'Tài khoản của tôi' }],
    blocks: [
      { kind: 'p', text: 'Trang quản trị nằm ở địa chỉ website + */admin*. Đăng nhập bằng email và mật khẩu được cấp.' },
      {
        kind: 'note',
        tone: 'warn',
        text: 'Nhập sai quá *8 lần trong 5 phút* sẽ bị tạm khoá vài phút để chống dò mật khẩu. Đợi rồi thử lại.',
      },
      { kind: 'p', text: '*Quên mật khẩu:* bấm “Quên mật khẩu?” ở trang đăng nhập, nhập email, hệ thống gửi link đặt lại vào hộp thư.' },
      {
        kind: 'list',
        items: [
          'Link chỉ dùng được *1 lần* và hết hạn sau *60 phút*.',
          'Không thấy thư: kiểm tra hộp Spam, rồi nhờ Admin xem lại Cài đặt → Email (SMTP).',
          'Màn hình luôn báo “đã gửi” kể cả khi email không tồn tại — đây là chủ ý để không lộ danh sách tài khoản.',
        ],
      },
      { kind: 'p', text: '*Đổi mật khẩu:* bấm vào email của bạn ở góc trên bên phải → Đổi mật khẩu. Sau khi đổi, các thiết bị khác đang đăng nhập sẽ bị đăng xuất.' },
      { kind: 'p', text: '*Đăng xuất:* nút ở góc trên bên phải.' },
    ],
  },

  {
    id: 'thao-tac-chung',
    icon: '◆',
    title: 'Thao tác chung',
    summary: 'Những thứ hoạt động giống nhau ở mọi màn hình.',
    links: [{ href: '/admin', label: 'Dashboard' }],
    blocks: [
      { kind: 'p', text: '*Dashboard* là màn hình đầu tiên: bốn ô số (Sản phẩm, Danh mục, Nông dân, Đơn hàng) bấm được để đi thẳng vào mục đó, ô cảnh báo “Cần xử lý” khi có đơn đang chờ, biểu đồ phân bổ đơn theo trạng thái, và 8 đơn gần nhất.' },
      { kind: 'p', text: 'Trên mọi *danh sách* bạn đều có:' },
      {
        kind: 'list',
        items: [
          '*Ô tìm kiếm* — gõ từ khoá rồi Enter.',
          '*Chip lọc* — bấm để lọc nhanh, ví dụ Còn hàng / Hết hàng, Nháp / Đã đăng.',
          '*Sắp xếp* — bấm vào tiêu đề cột có mũi tên; bấm lần nữa để đảo chiều.',
          '*Phân trang* — chọn 10 / 25 / 50 dòng mỗi trang (mặc định 25).',
          '*Xóa nhiều* — tick ô vuông đầu dòng rồi bấm nút xóa hàng loạt.',
          '*Xóa bộ lọc* — link ở góc phải, hiện khi đang lọc.',
        ],
      },
      {
        kind: 'note',
        tone: 'tip',
        text: 'Bấm Lưu mà màn hình không phản ứng gì? Nghĩa là còn ô bắt buộc chưa điền — hệ thống sẽ tự chuyển sang đúng tab chứa ô đó và tô sáng nó.',
      },
      {
        kind: 'list',
        items: [
          'Trường có *dấu sao đỏ* là bắt buộc.',
          'Trình duyệt cảnh báo khi bạn rời trang lúc còn thay đổi *chưa lưu* — nhưng đừng dựa vào đó, cứ bấm Lưu.',
          'Nút *“Xem thử ↗”* trong trang sửa sản phẩm / bài viết / trang mở bản xem trước ở tab mới.',
          'Đường dẫn phân cấp trên thanh trên bấm được để quay lại cấp trước.',
          'Trên điện thoại, bấm biểu tượng ba gạch để mở menu.',
        ],
      },
    ],
  },

  {
    id: 'phan-quyen',
    icon: '◉',
    title: 'Phân quyền',
    summary: 'Ai làm được gì: Quản trị (admin) và Nhân viên (staff).',
    blocks: [
      { kind: 'p', text: 'Mục nào bạn không có quyền sẽ *không hiện trong menu* bên trái.' },
      {
        kind: 'table',
        head: ['Việc', 'Nhân viên', 'Quản trị'],
        rows: [
          ['Đơn hàng: xem, đổi trạng thái, xác nhận thanh toán', 'Có', 'Có'],
          ['Xóa đơn hàng', 'Không', 'Có'],
          ['Sản phẩm, danh mục, bài viết, trang, ảnh, nông dân…', 'Có', 'Có'],
          ['Khung giờ giao, thanh toán, trạng thái đơn, chủ đề liên hệ', 'Có', 'Có'],
          ['Giao diện (màu, font)', 'Không', 'Có'],
          ['Tài khoản người dùng', 'Không', 'Có'],
          ['Cài đặt website (gồm SMTP, ngân hàng)', 'Không', 'Có'],
          ['Mẫu email', 'Không', 'Có'],
        ],
      },
    ],
  },

  {
    id: 'don-hang',
    icon: '✦',
    title: 'Đơn hàng',
    summary: 'Xác nhận đơn, đổi trạng thái, đối chiếu chuyển khoản.',
    links: [
      { href: '/admin/orders', label: 'Mở Đơn hàng' },
      { href: '/admin/orders?status=pending', label: 'Đơn đang chờ' },
    ],
    blocks: [
      { kind: 'p', text: 'Tìm đơn theo *mã đơn, tên khách, số điện thoại hoặc email*. Lọc theo trạng thái, hình thức thanh toán (COD / chuyển khoản) và tình trạng thanh toán (chưa trả / đã trả).' },
      { kind: 'p', text: 'Bấm vào *mã đơn* để mở chi tiết: thông tin khách, danh sách sản phẩm, tổng tiền, ô đổi trạng thái và ô chuyển khoản.' },
      { kind: 'p', text: '*Quy trình chuẩn:*' },
      {
        kind: 'steps',
        items: [
          'Chờ xác nhận — gọi hoặc nhắn xác nhận với khách.',
          'Đang thu hoạch — đã nhận đơn, đang chuẩn bị hàng.',
          'Đang giao — hàng đã rời kho.',
          'Đã giao — hoàn tất.',
        ],
      },
      { kind: 'p', text: '*Đơn chuyển khoản:* kiểm tra biến động số dư ngân hàng, tìm giao dịch có nội dung *“Thanh toan” + mã đơn*, rồi bấm “✓ Xác nhận đã nhận tiền”. Bấm nhầm thì có nút hoàn tác ngay bên dưới.' },
      {
        kind: 'note',
        tone: 'warn',
        text: 'Khách huỷ thì chuyển trạng thái sang *Đã huỷ*, đừng xóa đơn — xóa là vĩnh viễn và làm mất số liệu. Chỉ Admin xóa được đơn.',
      },
    ],
  },

  {
    id: 'san-pham',
    icon: '✿',
    title: 'Sản phẩm & Danh mục',
    summary: 'Thêm sản phẩm, đặt giá, ảnh, tồn kho và cách sắp danh mục.',
    links: [
      { href: '/admin/products', label: 'Mở Sản phẩm' },
      { href: '/admin/products/new', label: 'Thêm sản phẩm' },
      { href: '/admin/categories', label: 'Mở Danh mục' },
    ],
    blocks: [
      { kind: 'p', text: 'Form sản phẩm chia hai tab: *Thông tin & giá* và *Mô tả chi tiết*.' },
      {
        kind: 'table',
        head: ['Trường', 'Ghi chú'],
        rows: [
          ['Tên sản phẩm', 'Bắt buộc. Ví dụ: Cà chua bi Đà Lạt'],
          ['Đường dẫn', 'Tự điền theo tên. Sửa được lúc tạo, *không đổi được sau khi đã tạo*'],
          ['Danh mục', 'Bắt buộc chọn'],
          ['Nông dân', 'Gắn để khách xem được câu chuyện người trồng'],
          ['Đơn vị bán', 'Khách thấy: 25.000đ / bó 250g'],
          ['Thẻ', 'Ngăn cách bằng dấu phẩy: Hữu cơ, PGS'],
          ['Giá bán', 'Ô bên phải hiện lại số tiền đã định dạng — dùng để soát thừa/thiếu số 0'],
          ['Giá gốc', 'Điền khi đang giảm giá, web sẽ hiện giá gạch ngang'],
          ['Mô tả ngắn', 'Một hai câu, hiện ở thẻ sản phẩm'],
        ],
      },
      { kind: 'p', text: 'Cột phải: ô *Còn hàng* (bỏ tick để tạm ẩn nút mua, sản phẩm vẫn hiện), ô *Nổi bật* (đưa lên trang chủ), *Ảnh đại diện* và *Ảnh phụ*.' },
      { kind: 'p', text: '*Danh mục* có: Tên, Slug, Danh mục cha (để tạo cấp con), Icon, Mô tả, Ảnh bìa banner và Thứ tự — số nhỏ hiện trước.' },
      {
        kind: 'note',
        tone: 'warn',
        text: 'Không xóa được danh mục đang chứa sản phẩm hoặc còn danh mục con. Chuyển sản phẩm sang danh mục khác trước rồi xóa lại.',
      },
      {
        kind: 'note',
        tone: 'tip',
        text: 'Hết hàng thì bỏ tick “Còn hàng”, đừng xóa sản phẩm — xóa sẽ mất luôn đường dẫn mà khách đã lưu hoặc Google đã lập chỉ mục.',
      },
    ],
  },

  {
    id: 'tin-tuc',
    icon: '✎',
    title: 'Tin tức',
    summary: 'Viết bài, hẹn giờ đăng, SEO và chuyên mục.',
    links: [
      { href: '/admin/posts', label: 'Mở Bài viết' },
      { href: '/admin/posts/new', label: 'Viết bài mới' },
      { href: '/admin/post-categories', label: 'Chuyên mục' },
    ],
    blocks: [
      { kind: 'p', text: 'Bài viết gồm *Tiêu đề* và *Đường dẫn* (bài nằm ở /tin-tuc/ + đường dẫn, không đổi được sau khi tạo), tab *Nội dung* để soạn bài, tab *SEO & Tóm tắt*, cùng ảnh bìa, chuyên mục và thẻ ở cột phải.' },
      { kind: 'p', text: 'Ô *Đăng bài* có ba lựa chọn:' },
      {
        kind: 'table',
        head: ['Lựa chọn', 'Kết quả'],
        rows: [
          ['Lưu nháp', 'Chỉ người trong admin thấy'],
          ['Đăng ngay', 'Bài lên web ngay khi bấm lưu'],
          ['Hẹn giờ đăng', 'Chọn ngày giờ, bài tự hiện đúng giờ đó'],
        ],
      },
      { kind: 'p', text: 'Chọn giờ đã trôi qua thì hệ thống báo trước và bài sẽ hiện ngay khi lưu.' },
      {
        kind: 'list',
        items: [
          '*Tóm tắt ngắn* hiện ở thẻ bài ngoài trang tin tức. Bỏ trống thì hệ thống tự lấy đoạn đầu bài.',
          '*Tiêu đề trên Google* nên dưới 60 ký tự. Bỏ trống thì dùng tiêu đề bài.',
          '*Mô tả trên Google* là đoạn chữ xám dưới tiêu đề khi khách tìm kiếm.',
          '*Ảnh bìa* nên dùng ảnh ngang.',
          '*Chuyên mục* nhóm bài theo chủ đề, địa chỉ công khai là /danh-muc-tin-tuc/ + slug. Chưa có chuyên mục thì bài vẫn đăng được.',
        ],
      },
    ],
  },

  {
    id: 'noi-dung',
    icon: '▤',
    title: 'Nội dung website',
    summary: 'Xếp khối cho trang chủ và các trang, trình soạn thảo, slider, menu.',
    links: [
      { href: '/admin/pages/home', label: 'Sửa Trang chủ' },
      { href: '/admin/certificates', label: 'Chứng nhận' },
      { href: '/admin/catalogs', label: 'Catalog' },
      { href: '/admin/pages', label: 'Danh sách Trang' },
      { href: '/admin/hero-slides', label: 'Slider trang chủ' },
      { href: '/admin/menu', label: 'Menu' },
    ],
    blocks: [
      { kind: 'p', text: 'Trang được ghép từ các *khối* xếp từ trên xuống. Với mỗi khối: mũi tên lên/xuống để đổi thứ tự, nút *Ẩn* để tạm giấu khỏi web mà không xóa, bấm vào tên khối để mở phần chỉnh nội dung. Tối đa *40 khối* một trang.' },
      {
        kind: 'table',
        head: ['Khối', 'Dùng để'],
        rows: [
          ['Ảnh bìa lớn', 'Ảnh nền rộng với tiêu đề đè lên, thường đặt trên cùng'],
          ['Ảnh bìa quay vòng', 'Slider tự chuyển, lấy ảnh từ mục Slider trang chủ'],
          ['Đoạn văn bản', 'Chữ tự do: tiêu đề, đoạn văn, danh sách, ảnh chèn giữa'],
          ['Lưới thẻ', 'Ô có số thứ tự — cam kết, quy trình, lý do'],
          ['Dải số liệu', 'Các con số lớn kèm nhãn'],
          ['Kêu gọi hành động', 'Ô màu đậm có nút bấm'],
          ['Bộ ảnh', 'Nhiều ảnh xếp lưới'],
          ['Thẻ và mã QR', 'Tải nhiều ảnh ngay trong khối; giữ trọn ảnh, bấm xem lớn; bày dạng slider hoặc lưới'],
          ['Lưới sản phẩm', 'Nguồn: nổi bật / theo danh mục / chọn tay / mới nhất / đang giảm giá'],
          ['Lưới danh mục', 'Tất cả hoặc chọn tay từng danh mục'],
          ['Chứng nhận', 'Bày dạng slider có nút trái/phải, hoặc lưới hiện hết. Thẻ có ảnh, tên và nơi cấp; bấm vào xem ảnh lớn'],
          ['Catalog', 'Thẻ bìa catalog kèm số trang; bấm vào lật xem từng trang. Cũng có slider và lưới'],
          ['Điểm giá trị, Hộp rau tuần, Lưới nông dân, Cảm nhận, Câu hỏi', 'Lấy nội dung từ mục tương ứng trong menu — sửa nội dung ở đó, không sửa trong khối'],
        ],
      },
      {
        kind: 'note',
        tone: 'warn',
        text: '*Trang chủ* luôn ở trạng thái đã đăng, không đổi được đường dẫn và không xóa được. Muốn thay bố cục thì ẩn hoặc sắp xếp lại các khối bên trong.',
      },
      { kind: 'p', text: 'Trang khác có ô *Xuất bản*: Nháp (chỉ mình bạn thấy) hoặc Đã đăng. Một số đường dẫn bị giữ cho hệ thống, không đặt được: admin, api, products, farmers, checkout, orders, contact, tin-tuc, danh-muc, danh-muc-tin-tuc, home, uploads.' },
      { kind: 'p', text: '*Trình soạn thảo* có: đậm, nghiêng, gạch chân, gạch ngang, tiêu đề lớn/vừa, danh sách gạch đầu dòng và đánh số, trích dẫn, căn trái/giữa/phải, chèn liên kết, chèn ảnh từ thư viện, đường kẻ ngang, xóa định dạng, hoàn tác và làm lại.' },
      {
        kind: 'note',
        tone: 'tip',
        text: 'Dán được từ Word. Nếu dán vào bị lộn xộn font và màu: bôi đen rồi bấm *Xóa định dạng*.',
      },
      { kind: 'p', text: '*Chứng nhận:* thêm giấy chứng nhận ở mục *Chứng nhận*, rồi đặt khối *Chứng nhận* vào trang chủ hoặc trang bất kỳ. Mỗi thẻ hiện ảnh, tên chứng nhận và nơi cấp; bấm vào xem ảnh lớn kèm mô tả.' },
      { kind: 'p', text: '*Thẻ và mã QR:* thêm khối này ngay trong Trang chủ hoặc trang bất kỳ, rồi tải/chọn nhiều ảnh từ Thư viện ảnh. Ảnh được giữ nguyên tỷ lệ và có thể bấm xem lớn. Chọn Slider hoặc Lưới; dùng mũi tên lên/xuống ở đầu khối để đặt phần này trên hoặc dưới các phần khác.' },
      {
        kind: 'list',
        items: [
          '*Slider* — hiện vài thẻ một lúc, có nút trái/phải và chấm trang. Dùng cho trang chủ, nơi chứng nhận chỉ là một mục trong nhiều mục.',
          '*Lưới* — hiện hết, xếp nhiều hàng. Dùng cho trang riêng về chứng nhận, như trang */chung-nhan* có sẵn.',
          'Trên điện thoại, slider vuốt tay để xem tiếp (nút ẩn đi cho đỡ che thẻ).',
        ],
      },
      { kind: 'p', text: '*Catalog sản phẩm:* mỗi catalog là một tập *ảnh các trang* — tải ảnh từng trang lên đúng thứ tự, ảnh đầu tiên tự thành bìa. Khách bấm vào thẻ là lật xem từng trang ngay trên web, không phải tải file về. Trang */catalogs* đã có sẵn.' },
      {
        kind: 'list',
        items: [
          'Ảnh trang dùng đúng giới hạn ảnh thường: JPG, PNG, WebP, tối đa 4MB mỗi ảnh, tối đa 60 trang một catalog.',
          'Catalog *chưa có trang nào* sẽ không hiện ra web — danh sách trong admin có ghi chú nhắc.',
          'Bỏ tick *Hiện trên web* để tạm giấu một catalog cũ mà không xoá; danh sách trong admin gắn nhãn *Đang ẩn*.',
          'Trong trình xem có nút lật trang, dải ảnh nhỏ để nhảy thẳng, mũi tên bàn phím, và link tải trang đang xem.',
        ],
      },
      { kind: 'p', text: '*Menu nhiều cấp:* chọn *Mục cha* để biến một mục thành submenu. Tối đa 3 cấp — cha, con, cháu. Ngoài trang web, mục có con sẽ hiện mũi tên và xổ ra khi rê chuột (bấm cũng được); cấp 3 đổ tiếp sang ngang. Trên điện thoại và ở footer thì các cấp hiện hết, thụt vào theo cấp.' },
      {
        kind: 'list',
        items: [
          'Thứ tự chỉ so giữa các mục *cùng cha*, không phải toàn menu.',
          'Header và Footer là hai cây riêng — không lồng mục bên này vào mục bên kia được.',
          'Đổi vị trí Header/Footer của một mục sẽ chuyển theo *cả nhánh* con cháu bên dưới.',
          'Muốn xóa một mục còn mục con: xóa mục con trước, hoặc tick chọn cả cha lẫn con rồi xóa một lượt.',
        ],
      },
      { kind: 'p', text: '*Slider trang chủ:* mỗi slide có ảnh nền, chữ nhỏ phía trên, tiêu đề lớn, mô tả, nút chính và nút phụ, thứ tự, bật/tắt. Không có slide nào thì trang chủ dùng ảnh bìa tĩnh khai báo trong Cài đặt → Trang chủ.' },
      {
        kind: 'table',
        head: ['Mục khác', 'Nội dung'],
        rows: [
          ['Nông dân', 'Tên, Nông trại, Địa điểm, Chuyên môn, Số năm kinh nghiệm, Chứng nhận, Câu chuyện, Avatar, Ảnh bìa'],
          ['Cảm nhận', 'Tên khách, Vai trò, Nội dung, Số sao, Ảnh đại diện, Thứ tự'],
          ['Câu hỏi', 'Câu hỏi, Câu trả lời, Thứ tự'],
          ['Điểm giá trị', 'Icon emoji, Tiêu đề, Mô tả ngắn, Thứ tự'],
          ['Chứng nhận', 'Ảnh giấy chứng nhận, Tên, Nơi cấp, Mô tả, Thứ tự — hiện ở khối “Chứng nhận”'],
          ['Catalog', 'Tên, Mô tả, các trang catalog dạng ảnh, Thứ tự — hiện ở khối “Catalog”'],
          ['Menu', 'Nhãn, Vị trí (Header hoặc Footer), Mục cha, Loại liên kết (trang / danh mục / đường dẫn tự nhập), Mở tab mới, Thứ tự'],
        ],
      },
    ],
  },

  {
    id: 'thu-vien-anh',
    icon: '▣',
    title: 'Thư viện ảnh',
    summary: 'Kho ảnh dùng chung, giới hạn tải lên, xóa an toàn.',
    links: [{ href: '/admin/media', label: 'Mở Thư viện ảnh' }],
    blocks: [
      { kind: 'p', text: 'Kho ảnh dùng chung cho sản phẩm, bài viết và trang. Ở mọi ô ảnh bạn đều có thể tải ảnh mới lên hoặc chọn lại ảnh đã có trong thư viện.' },
      {
        kind: 'list',
        items: [
          'Định dạng nhận: *JPG, PNG, WebP*.',
          'Dung lượng tối đa *4MB* mỗi ảnh.',
          'Kéo–thả ảnh thẳng vào ô tải lên cũng được.',
          'Nên điền *mô tả ảnh* — tốt cho Google và cho người dùng đọc màn hình.',
          'Tìm ảnh theo tên file hoặc mô tả.',
        ],
      },
      {
        kind: 'note',
        tone: 'warn',
        text: 'Xóa ảnh là vĩnh viễn. Khi ảnh đang được dùng, hệ thống chặn lại và liệt kê những nơi đang dùng nó — chỉ xóa tiếp nếu bạn chắc chắn.',
      },
    ],
  },

  {
    id: 'van-hanh',
    icon: '◷',
    title: 'Vận hành',
    summary: 'Khung giờ giao, phương thức thanh toán, trạng thái đơn, mẫu email.',
    links: [
      { href: '/admin/delivery-slots', label: 'Khung giờ giao' },
      { href: '/admin/payment-methods', label: 'Thanh toán' },
      { href: '/admin/order-statuses', label: 'Trạng thái đơn' },
      { href: '/admin/contact-topics', label: 'Chủ đề liên hệ' },
    ],
    blocks: [
      { kind: 'p', text: '*Khung giờ giao:* nhãn (ví dụ 8h–11h sáng), thứ tự, và ô kích hoạt. Bỏ kích hoạt thì khách không chọn được khung đó nữa, đơn cũ vẫn giữ nguyên.' },
      { kind: 'p', text: '*Phương thức thanh toán:* nhãn hiển thị, mã, dòng gợi ý nhỏ, thứ tự, kích hoạt. Số tài khoản ngân hàng và mã QR nằm ở Cài đặt → Thanh toán, không phải ở đây.' },
      { kind: 'p', text: '*Trạng thái đơn:* hệ thống dùng cố định 5 trạng thái. Bạn chỉ sửa được nhãn hiển thị, màu và thứ tự — không thêm hay xóa được.' },
      { kind: 'p', text: '*Chủ đề liên hệ:* danh sách chủ đề trong ô chọn ở form liên hệ ngoài web.' },
      { kind: 'p', text: '*Mẫu email* (chỉ Admin): 4 mẫu cố định, sửa được chủ đề, nội dung và bật/tắt từng mẫu.' },
      {
        kind: 'table',
        head: ['Mẫu', 'Gửi khi nào'],
        rows: [
          ['Quên mật khẩu', 'Có người yêu cầu đặt lại mật khẩu admin'],
          ['Xác nhận đơn — cho khách', 'Khách vừa đặt đơn, kèm QR nếu chọn chuyển khoản'],
          ['Đơn mới — cho cửa hàng', 'Báo nội bộ có đơn mới'],
          ['Xác nhận thanh toán', 'Bạn bấm xác nhận đã nhận tiền chuyển khoản'],
        ],
      },
      {
        kind: 'note',
        tone: 'warn',
        text: 'Nội dung email dùng biến dạng hai ngoặc nhọn, ví dụ mã đơn hay tên khách. Danh sách biến in ngay trong trang sửa — gõ sai chính tả thì email sẽ in ra nguyên đoạn ngoặc nhọn thay vì dữ liệu thật.',
      },
    ],
  },

  {
    id: 'he-thong',
    icon: '⚙',
    title: 'Hệ thống',
    summary: 'Giao diện, tài khoản người dùng và cài đặt website.',
    adminOnly: true,
    links: [
      { href: '/admin/theme', label: 'Giao diện' },
      { href: '/admin/users', label: 'Tài khoản' },
      { href: '/admin/settings', label: 'Cài đặt' },
    ],
    blocks: [
      { kind: 'p', text: '*Giao diện:* đổi màu thương hiệu, màu nhấn, độ bo góc, font tiêu đề và font nội dung. Khung bên phải xem trước ngay. Có nút khôi phục mặc định.' },
      { kind: 'p', text: '*Tài khoản:* mỗi người có email, tên, vai trò (Nhân viên hoặc Quản trị) và mật khẩu tối thiểu 8 ký tự. Khi sửa, để trống ô mật khẩu nếu không muốn đổi.' },
      {
        kind: 'list',
        items: [
          'Không tự xóa được tài khoản đang đăng nhập.',
          'Không xóa hoặc hạ quyền được *admin cuối cùng* — phải nâng quyền một admin khác trước.',
          'Đổi mật khẩu của ai thì các phiên đăng nhập cũ của người đó bị đăng xuất.',
        ],
      },
      { kind: 'p', text: '*Cài đặt website* chia theo tab, nút Lưu ở đáy form lưu tất cả các tab cùng lúc:' },
      {
        kind: 'table',
        head: ['Tab', 'Nội dung'],
        rows: [
          ['Thương hiệu', 'Logo, Favicon, tên đầy đủ và tên ngắn, tagline, mô tả, bốn ô số liệu ở hero'],
          ['Liên hệ', 'Địa chỉ, điện thoại, email, giờ mở cửa, thông tin pháp lý, nội dung trang Liên hệ'],
          ['Trang chủ', 'Ảnh bìa tĩnh, badge, nút, khối Hộp rau tuần, tiêu đề các mục'],
          ['Trang phụ', 'Tiêu đề trang Nông sản, Nông dân, Tin tức, thanh điều hướng'],
          ['Nội dung khác', 'Câu sau khi đặt hàng, nút xem tất cả, chữ khi giỏ hàng trống, trang thanh toán'],
          ['Footer & Social', 'Liên kết mạng xã hội (bỏ trống thì tự ẩn), dòng “Xây dựng bởi”'],
          ['Trang Câu chuyện', 'Nội dung trang giới thiệu'],
          ['SEO & Theo dõi', 'Địa chỉ website công khai, mã Google Analytics, mã xác minh sở hữu'],
          ['Thanh toán', 'Bật/tắt chuyển khoản, ngân hàng, số tài khoản, chủ tài khoản (IN HOA, không dấu) — dùng sinh mã QR'],
          ['Email (SMTP)', 'Máy chủ gửi mail, có nút gửi thử để kiểm tra cấu hình'],
        ],
      },
      {
        kind: 'note',
        tone: 'tip',
        text: 'Ô *Địa chỉ website* trong tab SEO phải đúng: link đặt lại mật khẩu và ảnh chia sẻ mạng xã hội đều dựa vào nó.',
      },
    ],
  },

  {
    id: 'loi-thuong-gap',
    icon: '!',
    title: 'Lỗi thường gặp',
    summary: 'Thông báo hay gặp và cách xử lý.',
    blocks: [
      {
        kind: 'table',
        head: ['Thông báo', 'Cách xử lý'],
        rows: [
          ['Không xóa được danh mục này vì đang có sản phẩm…', 'Chuyển sản phẩm sang danh mục khác, hoặc xóa danh mục con, rồi xóa lại'],
          ['Đường dẫn này đã có trang khác dùng', 'Đổi sang đường dẫn khác'],
          ['Email đã tồn tại', 'Đã có tài khoản dùng email này'],
          ['Không thể hạ quyền quản trị viên duy nhất còn lại', 'Nâng quyền một admin khác trước'],
          ['Bạn không thể tự xóa tài khoản đang đăng nhập', 'Nhờ một admin khác xóa giúp'],
          ['Không xóa được Trang chủ', 'Trang chủ là trang gốc — hãy ẩn hoặc sắp xếp lại các khối bên trong'],
          ['Link đã hết hạn hoặc không hợp lệ', 'Link đặt lại mật khẩu chỉ sống 60 phút và dùng một lần — yêu cầu link mới'],
          ['Bạn thử đăng nhập quá nhiều lần', 'Đợi vài phút rồi thử lại'],
          ['Bấm Lưu mà không thấy gì xảy ra', 'Còn ô bắt buộc chưa điền — hệ thống sẽ nhảy sang đúng tab chứa ô đó'],
          ['Ảnh tải lên bị từ chối', 'Chỉ nhận JPG, PNG, WebP và tối đa 4MB — nén hoặc đổi định dạng ảnh'],
        ],
      },
    ],
  },

  {
    id: 'hang-ngay',
    icon: '✓',
    title: 'Việc hằng ngày',
    summary: 'Danh sách việc nên làm mỗi ngày và định kỳ.',
    links: [{ href: '/admin/orders?status=pending', label: 'Đơn đang chờ' }],
    blocks: [
      { kind: 'p', text: '*Buổi sáng*' },
      {
        kind: 'steps',
        items: [
          'Mở Dashboard, xem ô “Cần xử lý” — có bao nhiêu đơn đang chờ.',
          'Vào Đơn hàng, lọc Chờ xác nhận, gọi khách xác nhận rồi chuyển sang Đang thu hoạch.',
          'Lọc chuyển khoản + chưa trả, đối chiếu biến động số dư ngân hàng rồi xác nhận đã nhận tiền.',
        ],
      },
      { kind: 'p', text: '*Trong ngày*' },
      {
        kind: 'list',
        items: [
          'Cập nhật trạng thái đơn theo tiến độ: Đang giao rồi Đã giao.',
          'Sản phẩm hết hàng: mở sản phẩm và bỏ tick “Còn hàng”.',
        ],
      },
      { kind: 'p', text: '*Định kỳ*' },
      {
        kind: 'list',
        items: [
          'Đăng bài mới ở Tin tức, có thể hẹn giờ để bài tự lên đúng khung giờ đẹp.',
          'Rà soát Slider trang chủ và các sản phẩm Nổi bật theo mùa vụ.',
          'Dọn Thư viện ảnh, xóa ảnh không còn dùng.',
        ],
      },
    ],
  },
];

/** Gom mọi chữ trong một mục về một chuỗi thường — dùng cho ô tìm trong trang. */
export function guideSectionText(s: GuideSection): string {
  const parts: string[] = [s.title, s.summary, ...(s.links ?? []).map((l) => l.label)];
  for (const b of s.blocks) {
    switch (b.kind) {
      case 'p':
      case 'note':
        parts.push(b.text);
        break;
      case 'list':
      case 'steps':
        parts.push(...b.items);
        break;
      case 'table':
        parts.push(...b.head, ...b.rows.flat());
        break;
    }
  }
  return parts.join(' ').toLowerCase();
}
