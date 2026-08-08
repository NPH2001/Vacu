# Kế hoạch tuần tra độ thân thiện website

Ngày lập: 2026-08-08  
Phạm vi: website công khai dành cho khách mua hàng; khu vực quản trị chỉ kiểm tra smoke nếu có tài khoản thử nghiệm.  
Mục tiêu: phát hiện và xếp hạng các trở ngại khiến người dùng không thể tìm sản phẩm, thêm vào giỏ, đặt hàng, tra cứu đơn hoặc liên hệ; chưa sửa mã nguồn trong giai đoạn này.

## 1. Tóm tắt yêu cầu và hiện trạng

- Ứng dụng dùng Next.js 16, React 19 và TypeScript; các lệnh chuẩn là `npm run dev`, `npm test`, `npm run lint`, `npm run build` (`package.json:4-17`, `package.json:19-53`).
- Luồng mua hàng chính gồm trang chủ, danh sách/tìm kiếm sản phẩm, chi tiết sản phẩm, giỏ hàng, checkout và tra cứu đơn (`app/(public)/page.tsx:25-55`, `app/(public)/products/page.tsx:22-48`, `components/ProductBuyBox.tsx:40-123`, `components/CheckoutForm.tsx:59-230`, `app/(public)/orders/page.tsx:56-138`).
- Nền tảng accessibility đã có: ngôn ngữ tiếng Việt, skip link, landmark chính, điều khiển menu mobile bằng bàn phím và modal giỏ hàng có focus trap (`app/layout.tsx:75-81`, `app/(public)/layout.tsx:33-49`, `components/Navbar.tsx:20-114`, `components/useModalA11y.ts:4-44`).
- Test hiện tại chủ yếu là unit/integration chạy trong Node (`vitest.config.ts:7-14`). Playwright đã là dependency nhưng chưa có config/spec/script E2E (`package.json:57`); chưa có kiểm thử axe. Vì vậy các hành vi trình duyệt, responsive, bàn phím và screen reader là khoảng trống cần tuần tra thủ công trước.

## 2. Người dùng và giả định kiểm tra

Ưu tiên ba kiểu người dùng:

1. Khách mới trên điện thoại, muốn mua nhanh nhưng ít quen công nghệ.
2. Khách quay lại trên desktop, muốn tìm đúng sản phẩm và tra cứu đơn.
3. Người dùng bàn phím hoặc công nghệ hỗ trợ, cần hoàn thành cùng các tác vụ mà không bị mắc kẹt.

Giả định mặc định: nội dung tiếng Việt, mạng bình thường và mạng chậm giả lập, viewport mobile 360×800 và desktop 1440×900. Nếu analytics sau này cho thấy thiết bị hoặc luồng khác chiếm ưu thế, điều chỉnh ma trận nhưng giữ nguyên tiêu chí thành công.

## 3. Tiêu chí chấp nhận

- 100% route công khai quan trọng được mở trên cả mobile và desktop, không có trang trắng, lỗi console nghiêm trọng hoặc nội dung tràn ngang.
- Mỗi tác vụ cốt lõi có ít nhất một lần chạy thành công và một lần chạy với dữ liệu lỗi/không có kết quả.
- Người kiểm tra hoàn thành được toàn bộ luồng `trang chủ → sản phẩm → giỏ → checkout → xác nhận/tra cứu đơn` mà không cần can thiệp DevTools.
- Tất cả chức năng cốt lõi có thể thao tác chỉ bằng bàn phím; focus luôn nhìn thấy, có thứ tự hợp lý, không bị kẹt và quay lại đúng chỗ sau khi đóng modal.
- Form có label dễ hiểu, hướng dẫn đủ dùng, lỗi xuất hiện cạnh trường liên quan, không làm mất dữ liệu đã nhập và được thông báo cho công nghệ hỗ trợ.
- Với mỗi lỗi phát hiện, báo cáo ghi đủ route, viewport, bước tái hiện, kết quả thực tế, kết quả mong đợi, ảnh/video, mức độ nghiêm trọng và đề xuất hướng xử lý.
- Không còn lỗi mức P0/P1 chưa được ghi nhận rõ chủ sở hữu và quyết định xử lý trước khi kết thúc đợt tuần tra.

## 4. Ma trận tuần tra

| Khu vực | Tác vụ chính | Trạng thái/biên cần kiểm tra | Dấu hiệu đạt |
| --- | --- | --- | --- |
| Khung chung | Mở trang, bỏ qua điều hướng, dùng navbar/footer/menu mobile | tải chậm, menu dài, Escape, resize, zoom 200% | nhận biết được đang ở đâu; không che nội dung; focus hợp lý |
| Trang chủ | Hiểu giá trị, tìm đường đến sản phẩm/danh mục | page-builder có/không dữ liệu, ảnh lỗi, CTA đầu trang | mục đích và hành động chính rõ trong 5 giây |
| Danh sách sản phẩm | tìm kiếm, lọc còn hàng, sắp xếp, mở sản phẩm | 0/1/nhiều kết quả, query URL, từ khóa sai, quay lại bằng Back | trạng thái lọc dễ thấy; số kết quả đúng; không mất ngữ cảnh |
| Danh mục | duyệt theo danh mục và chuyển danh mục | slug hợp lệ/không hợp lệ, danh mục trống | tên danh mục và lựa chọn tiếp theo rõ ràng |
| Chi tiết sản phẩm | hiểu giá/đơn vị/tồn kho, đổi số lượng, thêm giỏ | hết hàng, số lượng min/max, mobile sticky CTA, ảnh/nội dung dài | CTA rõ; phản hồi thêm giỏ tức thời; không thêm sai số lượng |
| Giỏ hàng | xem/sửa/xóa sản phẩm, đóng/mở drawer | giỏ trống, nhiều dòng, reload/localStorage, Escape, focus trap | tổng tiền và bước kế tiếp rõ; không mất giỏ ngoài dự kiến |
| Checkout | nhập thông tin, chọn khung giờ/payment, đặt đơn | bỏ trống, sai định dạng, lỗi mạng/server, double submit, quay lại | lỗi có thể sửa; không mất dữ liệu; không tạo trùng đơn |
| Đơn hàng | đọc xác nhận, tra cứu bằng mã + điện thoại | mã sai, số sai, đơn mới, reload/deep link | biết đơn đã thành công và bước tiếp theo; lỗi không rò dữ liệu |
| Liên hệ | gửi câu hỏi | trường trống/sai, thành công, lỗi server, gửi lặp | trạng thái gửi rõ; dữ liệu không mất khi lỗi |
| Nội dung phụ | tin tức, nông dân, chứng nhận, liên hệ nổi | link hỏng, ảnh alt, nội dung dài, heading | đọc/lướt dễ; link và heading có nghĩa |

## 5. Quy trình thực hiện

### Bước 0 — Khóa môi trường và dữ liệu

- Ghi commit SHA, trình duyệt/OS, viewport, cấu hình database và tài khoản thử nghiệm.
- Tạo bộ dữ liệu tối thiểu: sản phẩm còn hàng, hết hàng, nội dung dài, danh mục trống và một đơn có thể tra cứu.
- Chạy `npm test`, `npm run lint` và `npm run build` để phân biệt lỗi nền với lỗi UX; không sửa các thay đổi đang có trong worktree.

### Bước 1 — Smoke patrol toàn bộ route

- Duyệt tất cả route công khai trên Chrome ở mobile và desktop.
- Ghi lỗi render, 404 sai, link chết, layout shift, tràn ngang, hình ảnh lỗi và console/network error.
- Chụp một ảnh chuẩn cho từng template trang để đối chiếu các vòng sau.

### Bước 2 — Task-based usability patrol

- Thực hiện các tác vụ trong ma trận theo đúng góc nhìn người dùng, không đọc source trong lúc chạy.
- Đo: tỷ lệ hoàn thành, thời gian hoàn thành, số lần đi sai/quay lại, số điểm phải đoán và mức tự tin sau tác vụ (1–5).
- Ngưỡng cảnh báo: không hoàn thành; cần trợ giúp; đi sai từ 2 lần; hoặc tự tin ≤2/5.

### Bước 3 — Accessibility patrol

- Chạy chỉ bằng bàn phím: Tab/Shift+Tab/Enter/Space/Escape, skip link, menu mobile, cart drawer, form và focus sau điều hướng.
- Kiểm tra zoom 200%, reflow ở chiều rộng 320 px, contrast, target chạm, heading/landmark, tên truy cập và live region.
- Dùng axe hoặc Lighthouse như công cụ sàng lọc; xác minh thủ công mọi phát hiện. Smoke với NVDA + Chrome hoặc VoiceOver + Safari cho luồng sản phẩm → giỏ → checkout.

### Bước 4 — Khả năng phục hồi và cảm nhận hiệu năng

- Giả lập Slow 4G, reload giữa luồng, request lỗi/timeout và double click nút submit.
- Kiểm tra skeleton/loading, disabled state, thông báo lỗi, khả năng thử lại, bảo toàn dữ liệu form/giỏ và tính idempotent khi đặt đơn.
- Ghi Core Web Vitals/Lighthouse theo mẫu trang để tìm điểm nghẽn cảm nhận; coi đây là tín hiệu chẩn đoán, không thay thế task success.

### Bước 5 — Tổng hợp và ưu tiên

- Gộp lỗi trùng theo nguyên nhân và chấm `Tác động (1–4) × Tần suất (1–4) × Độ lan rộng (1–3)`.
- P0: chặn mua hàng hoặc rủi ro dữ liệu; P1: chặn tác vụ chính với nhiều người; P2: gây nhầm/lãng phí thời gian nhưng có đường vòng; P3: polish.
- Lập backlog theo thứ tự P0 → P1 → P2 → P3, kèm quick wins và các lỗi cần nghiên cứu người dùng thêm.

### Bước 6 — Kiểm chứng sau sửa

- Chạy lại chính xác case lỗi, sau đó chạy regression toàn bộ luồng liên quan trên mobile, desktop và bàn phím.
- Chỉ đóng issue khi bằng chứng trước/sau cho thấy tiêu chí mong đợi đạt và không xuất hiện regression liền kề.

## 6. Mẫu ghi nhận phát hiện

Mỗi issue dùng cấu trúc:

- ID / tiêu đề theo ngôn ngữ người dùng.
- Route, thiết bị, viewport, trình duyệt, commit SHA.
- Tác vụ và bước tái hiện tối thiểu.
- Kết quả thực tế / mong đợi.
- Bằng chứng: ảnh, video, console/network nếu liên quan.
- Nhóm người dùng bị ảnh hưởng và tần suất dự kiến.
- Điểm ưu tiên, mức P0–P3 và lý do.
- Đề xuất hướng xử lý, không áp đặt giải pháp khi chưa rõ nguyên nhân.
- Tiêu chí retest cụ thể.

## 7. Lịch tuần tra đề xuất

- Mỗi pull request ảnh hưởng UI: smoke route liên quan + bàn phím + viewport mobile/desktop.
- Hàng ngày trên nhánh tích hợp: happy path tự động từ catalog đến checkout và tra cứu đơn.
- Hàng tuần: full patrol các trạng thái lỗi, accessibility và nội dung/đường dẫn.
- Trước release: regression toàn bộ ma trận, không còn P0/P1 mở nếu chưa có quyết định chấp nhận rủi ro.
- Hàng tháng hoặc sau thay đổi lớn: 5 người dùng đại diện thực hiện 3 tác vụ chính; tổng hợp task success, thời gian và phản hồi định tính.

## 8. Rủi ro và giảm thiểu

- **Dữ liệu thử không đại diện:** duy trì fixture cho hết hàng, danh mục trống, nội dung dài và đơn lỗi; không chỉ kiểm happy path.
- **Công cụ tự động cho cảm giác an toàn giả:** mọi lỗi axe/Lighthouse được kiểm thủ công; mọi luồng chính có test bàn phím và task-based.
- **Kết quả phụ thuộc cá nhân kiểm tra:** dùng cùng script, thiết bị, thang điểm và bằng chứng; vòng nghiên cứu người dùng có ít nhất 5 người khi cần kết luận hành vi.
- **Worktree đang có thay đổi:** tuần tra ghi commit SHA và không reset/ghi đè thay đổi hiện hữu.
- **Thiếu môi trường dịch vụ thật:** đánh dấu rõ case chưa kiểm được; dùng staging hoặc fixture tương đương trước release.

## 9. Bằng chứng hoàn tất và điểm dừng

Đợt tuần tra hoàn tất khi có:

1. Ma trận route/tác vụ/trạng thái được đánh dấu Pass/Fail/Blocked, kèm thiết bị và commit SHA.
2. Báo cáo phát hiện đã khử trùng lặp, mỗi lỗi có bằng chứng và mức P0–P3.
3. Bảng tóm tắt task success, thời gian, lỗi thao tác và điểm tự tin.
4. Danh sách khoảng trống không thể kiểm cùng lý do và chủ sở hữu tiếp theo.
5. Retest pass cho mọi lỗi đã sửa; không còn P0/P1 chưa có quyết định rõ ràng.

Giai đoạn lập kế hoạch dừng tại tài liệu này. Việc chạy website, tạo dữ liệu kiểm thử, chụp bằng chứng và mở backlog là một đợt thực thi riêng.
