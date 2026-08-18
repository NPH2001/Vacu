# Hướng dẫn sử dụng trang quản trị Vacu

Tài liệu dành cho người vận hành website (không cần biết kỹ thuật).
Địa chỉ trang quản trị: **`/admin`** (ví dụ `https://vacu.vn/admin`).

> Bản hướng dẫn này cũng có sẵn **ngay trong admin**: menu trái → **Trợ giúp → Hướng dẫn sử dụng** (`/admin/huong-dan`), có ô tìm kiếm và link đi thẳng tới từng màn hình. Nội dung của trang đó nằm ở `lib/admin/guide.ts` — sửa ở đó thì nhớ sửa cả file này.

## Mục lục

1. [Đăng nhập & mật khẩu](#1-đăng-nhập--mật-khẩu)
2. [Làm quen giao diện](#2-làm-quen-giao-diện)
3. [Phân quyền: Admin và Nhân viên](#3-phân-quyền-admin-và-nhân-viên)
4. [Đơn hàng](#4-đơn-hàng)
5. [Sản phẩm & Danh mục](#5-sản-phẩm--danh-mục)
6. [Tin tức: Bài viết & Chuyên mục](#6-tin-tức-bài-viết--chuyên-mục)
7. [Nội dung website](#7-nội-dung-website)
8. [Vận hành: khung giờ, thanh toán, email](#8-vận-hành-khung-giờ-thanh-toán-email)
9. [Hệ thống: Giao diện, Tài khoản, Cài đặt](#9-hệ-thống-giao-diện-tài-khoản-cài-đặt)
10. [Thông báo lỗi thường gặp](#10-thông-báo-lỗi-thường-gặp)
11. [Việc nên làm hằng ngày](#11-việc-nên-làm-hằng-ngày)

---

## 1. Đăng nhập & mật khẩu

### Đăng nhập
1. Vào `/admin/login`.
2. Nhập **email** và **mật khẩu** đã được cấp → bấm **Đăng nhập**.

> Nhập sai quá **8 lần trong 5 phút** sẽ bị tạm khoá vài phút (chống dò mật khẩu). Đợi rồi thử lại.

### Quên mật khẩu
1. Ở trang đăng nhập bấm **Quên mật khẩu** (`/admin/forgot-password`).
2. Nhập email tài khoản → hệ thống gửi link đặt lại vào hộp thư.
3. Link **chỉ dùng được 1 lần** và **hết hạn sau 60 phút**.
4. Mở link, nhập mật khẩu mới (tối thiểu 8 ký tự).

> Vì lý do bảo mật, màn hình luôn báo "đã gửi" kể cả khi email không tồn tại. Nếu không nhận được thư: kiểm tra hộp Spam, và nhờ Admin kiểm tra cấu hình **Cài đặt → Email (SMTP)**.

### Đổi mật khẩu của chính mình
**Tài khoản của tôi** (bấm vào email ở góc trên bên phải) → **Đổi mật khẩu**.
Sau khi đổi mật khẩu, các phiên đăng nhập cũ trên thiết bị khác sẽ bị đăng xuất.

### Đăng xuất
Nút **Đăng xuất** ở góc trên bên phải.

---

## 2. Làm quen giao diện

| Khu vực | Mô tả |
|---|---|
| **Menu trái** | Chia theo nhóm: Tổng quan · Bán hàng · Tin tức · Nội dung · Vận hành · Hệ thống |
| **Thanh trên** | Đường dẫn phân cấp (bấm để quay lại cấp trên), email của bạn, nút Đăng xuất |
| **Trên điện thoại** | Bấm biểu tượng ☰ để mở menu |

### Dashboard (Tổng quan)
Trang đầu tiên sau khi đăng nhập:
- 4 ô số: **Sản phẩm · Danh mục · Nông dân · Đơn hàng** — bấm để đi thẳng vào mục đó.
- Ô cảnh báo **"Cần xử lý"** hiện khi có đơn đang **Chờ xác nhận**.
- **Phân bổ đơn theo trạng thái** — bấm vào từng nhãn để lọc đúng nhóm đơn đó.
- **Đơn gần đây** — 8 đơn mới nhất.

### Thao tác chung trên mọi danh sách
- **Ô tìm kiếm**: gõ từ khoá rồi Enter.
- **Chip lọc**: bấm để lọc nhanh (ví dụ: Còn hàng / Hết hàng, Nháp / Đã đăng).
- **Sắp xếp**: bấm vào tiêu đề cột có mũi tên (Tên, Giá, Ngày…). Bấm lần nữa để đảo chiều.
- **Xóa bộ lọc**: link ở góc phải khi đang lọc.
- **Phân trang**: chọn hiển thị **10 / 25 / 50** dòng mỗi trang (mặc định 25).
- **Xóa nhiều**: tick ô vuông ở đầu các dòng → bấm nút xóa hàng loạt.

### Ba thói quen quan trọng
1. **Luôn bấm Lưu / Cập nhật** — trình duyệt sẽ cảnh báo nếu bạn rời trang khi còn thay đổi chưa lưu, nhưng đừng dựa vào đó.
2. **Dùng nút "Xem thử ↗"** trong trang sửa sản phẩm/bài viết/trang để mở bản xem trước ở tab mới.
3. **Trường có dấu `*` là bắt buộc.** Nếu bấm Lưu mà không có gì xảy ra, hệ thống sẽ tự chuyển sang đúng tab chứa ô còn thiếu và tô sáng nó.

---

## 3. Phân quyền: Admin và Nhân viên

| | **Nhân viên (staff)** | **Quản trị (admin)** |
|---|---|---|
| Đơn hàng: xem, đổi trạng thái, xác nhận thanh toán | ✅ | ✅ |
| **Xóa** đơn hàng | ❌ | ✅ |
| Sản phẩm, danh mục, bài viết, trang, ảnh, nông dân… | ✅ | ✅ |
| Khung giờ giao, thanh toán, trạng thái đơn, chủ đề liên hệ | ✅ | ✅ |
| **Giao diện** (màu, font) | ❌ | ✅ |
| **Tài khoản** người dùng | ❌ | ✅ |
| **Cài đặt** website (bao gồm SMTP, ngân hàng) | ❌ | ✅ |
| **Mẫu email** | ❌ | ✅ |

Các mục Nhân viên không có quyền sẽ **không hiện trong menu**.

---

## 4. Đơn hàng

### Xem và tìm đơn
**Bán hàng → Đơn hàng**. Có thể tìm theo **mã đơn / tên khách / số điện thoại / email**, và lọc theo:
- **Trạng thái**: Chờ xác nhận · Đang thu hoạch · Đang giao · Đã giao · Đã huỷ
- **Hình thức thanh toán**: 💵 COD · 🏦 Chuyển khoản
- **Tình trạng thanh toán**: Chưa trả · Đã trả

### Xử lý một đơn
Bấm vào **mã đơn** để mở chi tiết. Trong đó có:
- **Thông tin khách**: tên, điện thoại, địa chỉ, khung giờ giao, ghi chú, thời điểm đặt.
- **Danh sách sản phẩm** và tổng tiền.
- **Ô Trạng thái** (cột phải): chọn trạng thái mới → bấm **Cập nhật**.
- **Ô Chuyển khoản** (chỉ hiện với đơn chọn chuyển khoản).

### Xác nhận đơn chuyển khoản
1. Kiểm tra biến động số dư ngân hàng, tìm giao dịch có nội dung **`Thanh toan <mã đơn>`**.
2. Nếu đã nhận tiền → bấm **✓ Xác nhận đã nhận tiền**.
3. Nếu bấm nhầm → bấm **Hoàn tác (đánh dấu chưa thanh toán)**.

### Quy trình khuyến nghị
```
Chờ xác nhận → (gọi/nhắn xác nhận khách) → Đang thu hoạch → Đang giao → Đã giao
                                                              ↘ Đã huỷ (nếu khách huỷ)
```

> **Xóa đơn là vĩnh viễn** và chỉ Admin làm được. Với đơn khách huỷ, hãy chuyển trạng thái sang **Đã huỷ** thay vì xóa — để giữ số liệu.

---

## 5. Sản phẩm & Danh mục

### Thêm / sửa sản phẩm
**Bán hàng → Sản phẩm → + Thêm**. Form chia 2 tab:

**Tab "Thông tin & giá"**
| Trường | Ghi chú |
|---|---|
| **Tên sản phẩm** * | VD: *Cà chua bi Đà Lạt* |
| **Đường dẫn** * | Tự điền theo tên; sửa được lúc tạo, **không đổi được sau khi đã tạo** |
| **Danh mục** * | Bắt buộc chọn |
| Nông dân | Gắn để khách xem được câu chuyện người trồng |
| **Đơn vị bán** * | Khách thấy: *25.000đ / bó 250g* |
| Thẻ | Ngăn cách bằng dấu phẩy: `Hữu cơ, PGS` |
| **Giá bán** * | Ô bên phải hiện lại số tiền đã định dạng — dùng để soát thừa/thiếu số 0 |
| Giá gốc | Điền khi đang giảm giá → web hiện giá gạch ngang |
| **Mô tả ngắn** * | 1–2 câu, hiện ở thẻ sản phẩm |

**Tab "Mô tả chi tiết"** — trình soạn thảo giống Word (xem [mục 7](#trình-soạn-thảo-nội-dung)).

**Cột phải**
- ☑ **Còn hàng** — bỏ tick để tạm ẩn nút mua (sản phẩm vẫn hiện).
- ☑ **Nổi bật** — sản phẩm được đưa lên trang chủ.
- **Ảnh đại diện** — ảnh chính, hiện ở mọi nơi.
- **Ảnh phụ** — bộ ảnh trong trang chi tiết.

### Danh mục
**Bán hàng → Danh mục**. Mỗi danh mục có: Tên, Slug, **Danh mục cha** (để tạo cấp con), Icon, Mô tả, Ảnh bìa banner, Thứ tự (số nhỏ hiện trước).

> **Không xóa được danh mục** đang chứa sản phẩm hoặc còn danh mục con. Hãy chuyển sản phẩm sang danh mục khác trước.

---

## 6. Tin tức: Bài viết & Chuyên mục

### Viết bài
**Tin tức → Bài viết → + Thêm**.
- **Tiêu đề** * và **Đường dẫn** * (bài sẽ nằm ở `/tin-tuc/<đường-dẫn>`; không đổi được sau khi tạo).
- Tab **Nội dung**: trình soạn thảo.
- Tab **SEO & Tóm tắt**:
  - *Tóm tắt ngắn* — hiện ở thẻ bài ngoài trang tin tức (bỏ trống → tự lấy đoạn đầu).
  - *Tiêu đề trên Google* — nên dưới 60 ký tự.
  - *Mô tả trên Google* — đoạn chữ xám dưới tiêu đề khi tìm kiếm.
- **Ảnh bìa** — nên dùng ảnh ngang.
- **Chuyên mục** và **Thẻ** (ngăn cách bằng dấu phẩy).

### Ô "Đăng bài" — 3 lựa chọn
| Lựa chọn | Kết quả |
|---|---|
| **Lưu nháp** | Chỉ người trong admin thấy |
| **Đăng ngay** | Bài lên web ngay khi bấm lưu |
| **Hẹn giờ đăng** | Chọn ngày giờ; bài tự hiện đúng giờ đó |

Nếu chọn giờ đã trôi qua, hệ thống báo trước và bài sẽ hiện ngay khi lưu.

### Chuyên mục tin tức
**Tin tức → Chuyên mục**. Dùng để nhóm bài theo chủ đề; địa chỉ công khai là `/danh-muc-tin-tuc/<slug>`. Bài viết vẫn đăng được khi chưa có chuyên mục.

---

## 7. Nội dung website

### Trang chủ và các trang — công cụ xếp khối
**Nội dung → Trang chủ** (hoặc **Trang → chọn một trang**).

Trang được ghép từ các **khối** xếp từ trên xuống. Với mỗi khối bạn có thể:
- **↑ ↓** đổi thứ tự
- **Ẩn** — tạm giấu khỏi web mà không xóa
- Bấm vào tên khối để mở/đóng phần chỉnh nội dung

Tối đa **40 khối** mỗi trang. Các loại khối:

| Khối | Dùng để |
|---|---|
| **Ảnh bìa lớn** | Ảnh nền rộng với tiêu đề đè lên — thường đặt trên cùng |
| **Ảnh bìa quay vòng** | Slider tự chuyển, lấy từ mục *Slider trang chủ* |
| **Đoạn văn bản** | Chữ tự do: tiêu đề, đoạn văn, danh sách, ảnh chèn giữa |
| **Lưới thẻ** | Ô có số thứ tự — cam kết, quy trình, lý do |
| **Dải số liệu** | Các con số lớn kèm nhãn |
| **Kêu gọi hành động** | Ô màu đậm có nút bấm |
| **Bộ ảnh** | Nhiều ảnh xếp lưới |
| **Thẻ và mã QR** | Tải nhiều ảnh trực tiếp trong khối; giữ trọn ảnh, bấm xem lớn; bày dạng slider hoặc lưới |
| **Lưới sản phẩm** | Nguồn: nổi bật / theo danh mục / chọn tay / mới nhất / đang giảm giá |
| **Lưới danh mục** | Tất cả hoặc chọn tay |
| **Chứng nhận** | Slider có nút trái/phải, hoặc lưới hiện hết. Thẻ có ảnh, tên và nơi cấp; bấm vào xem ảnh lớn |
| **Catalog** | Thẻ bìa catalog kèm số trang; bấm vào lật xem từng trang. Cũng có slider và lưới |
| **Điểm giá trị** · **Hộp rau tuần** · **Lưới nông dân** · **Cảm nhận** · **Câu hỏi** | Lấy nội dung từ các mục tương ứng trong menu — sửa nội dung ở đó, không sửa trong khối |

**Lưu ý về Trang chủ:** luôn ở trạng thái *đã đăng* và không đổi được đường dẫn. Không xóa được. Muốn thay đổi bố cục thì ẩn/sắp xếp lại các khối.

#### Thẻ và mã QR

1. Mở trang muốn hiển thị (thường là **Nội dung → Trang chủ**) → **+ Thêm khối nội dung** → chọn **Thẻ và mã QR**.
2. Bấm **Tải ảnh thẻ và mã QR** để tải nhiều ảnh mới hoặc chọn ảnh có sẵn trong Thư viện ảnh. Có thể đổi thứ tự hoặc gỡ từng ảnh ngay trong khối.
3. Chọn **Slider** nếu muốn phần này gọn và vuốt ngang; chọn **Lưới** nếu muốn hiện tất cả ảnh.
4. Dùng nút **↑ ↓** ở đầu khối để đặt phần này phía trên hoặc phía dưới “Chứng nhận & Chứng chỉ” hay bất kỳ phần nào khác, rồi bấm **Cập nhật**.

Ảnh thẻ và mã QR luôn được giữ nguyên tỷ lệ, không cắt mép. Khách có thể bấm vào từng ảnh để xem lớn.

**Trang khác** có thêm ô **Xuất bản**: *Nháp* (chỉ mình bạn thấy) hoặc *Đã đăng*. Một số đường dẫn bị giữ cho hệ thống, không đặt được: `admin`, `api`, `products`, `farmers`, `checkout`, `orders`, `contact`, `tin-tuc`, `danh-muc`, `danh-muc-tin-tuc`, `home`, `uploads`.

### Trình soạn thảo nội dung
Thanh công cụ có: **Đậm** (Ctrl+B) · *Nghiêng* (Ctrl+I) · Gạch chân (Ctrl+U) · Gạch ngang · Đoạn văn thường · Tiêu đề lớn / vừa · Danh sách gạch đầu dòng / đánh số · Trích dẫn · Căn trái/giữa/phải · Chèn liên kết · **Chèn ảnh từ thư viện** · Đường kẻ ngang · **Xóa định dạng** · Hoàn tác (Ctrl+Z) / Làm lại (Ctrl+Y).

> Dán được từ Word. Nếu dán vào bị lộn xộn font/màu: bôi đen rồi bấm **Xóa định dạng**.

### Thư viện ảnh
**Nội dung → Thư viện ảnh** — kho ảnh dùng chung cho sản phẩm, bài viết và trang.
- Định dạng nhận: **JPG, PNG, WebP** — dung lượng tối đa **4MB** mỗi ảnh.
- Có thể **kéo–thả** ảnh vào ô tải lên, hoặc bấm chọn ảnh có sẵn từ thư viện.
- Nên điền **mô tả ảnh (alt)** — tốt cho Google và người dùng đọc màn hình.
- Tìm ảnh theo tên file hoặc mô tả.

> Khi xóa một ảnh **đang được dùng**, hệ thống chặn lại và liệt kê những nơi đang dùng nó. Chỉ xóa tiếp nếu bạn chắc chắn — **xóa ảnh là vĩnh viễn**.

### Slider trang chủ
**Nội dung → Slider trang chủ**. Mỗi slide: Ảnh nền *, Chữ nhỏ phía trên (badge), Tiêu đề lớn, Mô tả ngắn, Nút chính (chữ + liên kết), Nút phụ, Thứ tự (số nhỏ hiện trước), và trạng thái bật/tắt.
Không có slide nào → trang chủ dùng ảnh bìa tĩnh khai báo trong **Cài đặt → Trang chủ**.

### Các mục nội dung khác
| Mục | Nội dung |
|---|---|
| **Nông dân** | Tên, Nông trại, Địa điểm, Chuyên môn, Số năm kinh nghiệm, Chứng nhận (ngăn cách bằng phẩy), Câu chuyện, Avatar, Ảnh bìa |
| **Cảm nhận** | Tên khách, Vai trò/mô tả ngắn, Nội dung, Số sao, Ảnh đại diện, Thứ tự |
| **Câu hỏi** | Câu hỏi, Câu trả lời, Thứ tự |
| **Điểm giá trị** | Icon (emoji), Tiêu đề, Mô tả ngắn, Thứ tự — dải thẻ "vì sao chọn chúng tôi" |
| **Chứng nhận** | Ảnh giấy chứng nhận, Tên, Nơi cấp, Mô tả, Thứ tự |
| **Catalog** | Tên, Mô tả, các trang catalog (dạng ảnh), Thứ tự |
| **Menu** | Nhãn hiển thị, **Vị trí** (Header — menu trên cùng / Footer — liên kết nhanh), **Mục cha**, Loại liên kết (chọn trang, chọn danh mục, hoặc đường dẫn tự nhập), Mở tab mới, Thứ tự |

#### Chứng nhận

1. Thêm từng giấy chứng nhận ở **Nội dung → Chứng nhận** (ảnh là bắt buộc; nơi cấp và mô tả bỏ trống thì tự ẩn).
2. Mở trang muốn hiển thị → thêm khối **Chứng nhận** → chọn tiêu đề, nền, số lượng và **cách bày**.
3. Hai cách bày:
   - **Slider** — hiện vài thẻ một lúc, có nút trái/phải và chấm trang. Dùng cho **trang chủ**.
   - **Lưới** — hiện hết, xếp nhiều hàng. Dùng cho **trang riêng về chứng nhận** (`/chung-nhan` đã đặt sẵn kiểu này).

Mỗi thẻ hiện ảnh, **tên chứng nhận** và nơi cấp. Bấm vào thẻ sẽ phóng to ảnh kèm mô tả — chữ trên giấy chứng nhận mới là thứ khách muốn đọc. Trên điện thoại, slider vuốt tay để xem tiếp (nút ẩn đi cho đỡ che thẻ).

#### Catalog sản phẩm

Mỗi catalog là một **tập ảnh các trang**, không phải file PDF — khách lật xem ngay trên web, không phải tải về mới mở được.

1. **Nội dung → Catalog → + Thêm**: nhập tên, mô tả, rồi tải **ảnh từng trang** lên theo đúng thứ tự. Ảnh đầu tiên tự thành bìa; kéo để sắp lại.
2. Trang **/catalogs** đã được tạo sẵn (dạng lưới). Muốn hiện ở trang chủ thì thêm khối **Catalog** vào Trang chủ, chọn cách bày *Slider*.

- Ảnh trang dùng đúng giới hạn ảnh thường: **JPG, PNG, WebP, tối đa 4MB** mỗi ảnh; tối đa **60 trang** một catalog.
- Catalog **chưa có trang nào sẽ không hiện ra web** — danh sách trong admin có ghi chú nhắc.
- Bỏ tick **Hiện trên web** để tạm giấu một catalog cũ mà không xoá (ví dụ bảng giá quý trước). Danh sách trong admin vẫn hiện nó kèm nhãn **Đang ẩn**, bật lại một cú bấm.
- Trình xem có nút lật trang, dải ảnh nhỏ để nhảy thẳng tới trang bất kỳ, mũi tên bàn phím ← →, và link tải trang đang xem.
- Xoá catalog **không xoá ảnh** — ảnh vẫn nằm trong Thư viện ảnh để dùng lại.

#### Menu nhiều cấp (submenu)

Chọn **Mục cha** để biến một mục thành submenu — tối đa **3 cấp** (cha → con → cháu).

- Ngoài web: mục có con hiện mũi tên, **rê chuột** là xổ ra (bấm hoặc Enter cũng được). Cấp 3 đổ tiếp **sang ngang**.
- Trên điện thoại và ở **footer**: mọi cấp hiện hết, thụt vào theo cấp — không phải bấm mở từng nấc.
- **Thứ tự** chỉ so giữa các mục **cùng cha**, không phải toàn bộ menu.
- Header và Footer là **hai cây riêng**, không lồng chéo nhau được.
- Đổi vị trí Header ⇄ Footer của một mục sẽ **kéo theo cả nhánh** con cháu bên dưới.
- Muốn xóa một mục còn mục con: xóa mục con trước, **hoặc** tick chọn cả cha lẫn con rồi xóa một lượt.

---

## 8. Vận hành: khung giờ, thanh toán, email

### Khung giờ giao
**Vận hành → Khung giờ giao**. Mỗi khung: Nhãn (VD *8h–11h sáng*), Thứ tự, và **Kích hoạt**. Bỏ kích hoạt → khách không chọn được khung đó nữa (đơn cũ vẫn giữ nguyên).

### Phương thức thanh toán
**Vận hành → Thanh toán**. Nhãn hiển thị, Mã (slug), Gợi ý (dòng nhỏ dưới nhãn), Thứ tự, Kích hoạt.
Thông tin tài khoản ngân hàng và mã QR nằm ở **Cài đặt → Thanh toán**.

### Trạng thái đơn
**Vận hành → Trạng thái đơn**. Hệ thống dùng cố định **5 trạng thái**; bạn chỉ sửa được **nhãn hiển thị, màu và thứ tự** — không thêm/xóa được.

### Chủ đề liên hệ
**Vận hành → Chủ đề liên hệ** — danh sách chủ đề trong ô chọn ở form liên hệ.

### Mẫu email *(chỉ Admin)*
**Vận hành → Mẫu email** — 4 mẫu cố định:

| Key | Gửi khi nào |
|---|---|
| `forgot_password` | Có người yêu cầu đặt lại mật khẩu admin |
| `order_confirm_customer` | Khách vừa đặt đơn (kèm QR nếu chọn chuyển khoản) |
| `order_notify_admin` | Báo cho cửa hàng có đơn mới |
| `payment_confirmed` | Bạn xác nhận đã nhận tiền chuyển khoản |

Sửa được **chủ đề**, **nội dung HTML**, và **bật/tắt** từng mẫu.
Nội dung dùng biến dạng `{{tênBiến}}` — danh sách biến khả dụng in ngay trong trang sửa (ví dụ `{{orderId}}`, `{{customerName}}`, `{{orderTotal}}`, `{{resetLink}}`). **Gõ đúng chính tả biến**, nếu không email sẽ in ra nguyên chữ `{{...}}`. Phần xem trước bên dưới thay biến bằng dữ liệu mẫu để bạn kiểm tra.

---

## 9. Hệ thống: Giao diện, Tài khoản, Cài đặt

### Giao diện *(chỉ Admin)*
**Hệ thống → Giao diện**. Đổi **Màu thương hiệu**, **Màu nhấn**, **Độ bo góc**, **Font tiêu đề**, **Font nội dung** — khung bên phải xem trước ngay. Bấm **Lưu giao diện** để áp dụng cho toàn site, hoặc **Khôi phục mặc định**.

### Tài khoản *(chỉ Admin)*
**Hệ thống → Tài khoản**. Mỗi tài khoản có Email, Tên, **Vai trò** (Nhân viên / Quản trị) và Mật khẩu (tối thiểu 8 ký tự). Khi sửa, để trống ô mật khẩu nếu không muốn đổi.

Hệ thống chặn các thao tác gây khoá cửa:
- Không tự xóa được tài khoản đang đăng nhập.
- Không xóa hoặc hạ quyền được **admin cuối cùng** — phải nâng quyền một admin khác trước.
- Đổi mật khẩu của ai thì các phiên đăng nhập cũ của người đó bị đăng xuất.

### Cài đặt website *(chỉ Admin)*
**Hệ thống → Cài đặt** — form lớn nhất, chia theo tab:

| Tab | Nội dung |
|---|---|
| 🌱 **Thương hiệu** | Logo, Favicon, Tên đầy đủ/ngắn, Tagline hero, Mô tả, 4 ô số liệu ở hero |
| 📞 **Liên hệ** | Địa chỉ, điện thoại, email, giờ mở cửa, thông tin pháp lý (MST, tên pháp nhân), nội dung trang Liên hệ |
| 🏠 **Trang chủ** | Ảnh bìa tĩnh, badge, nút CTA, khối "Hộp rau tuần", tiêu đề các section |
| 📄 **Trang phụ** | Tiêu đề trang Nông sản, Nông dân, Tin tức, thanh điều hướng |
| 💬 **Nội dung khác** | Câu sau khi đặt hàng, nút "xem tất cả", chữ khi giỏ hàng trống, trang thanh toán |
| 🔗 **Footer & Social** | Liên kết mạng xã hội (bỏ trống → tự ẩn), dòng "Xây dựng bởi" |
| 📖 **Trang Câu chuyện** | Nội dung trang giới thiệu |
| 📈 **SEO & Theo dõi** | Địa chỉ website công khai, mã Google Analytics (G-XXXXXXX), mã xác minh sở hữu |
| 🏦 **Thanh toán** | Bật/tắt *Cho phép chuyển khoản*, chọn ngân hàng, số tài khoản, chủ tài khoản (IN HOA, không dấu) — dùng để sinh mã QR VietQR cho khách |
| 📧 **Email (SMTP)** | Máy chủ gửi mail; có nút **gửi thử** để kiểm tra cấu hình |

Nút **Lưu thay đổi** ở đáy form lưu **tất cả các tab** cùng lúc — sửa ở nhiều tab rồi bấm lưu một lần là đủ.

**Mẹo:** Ô **Địa chỉ website** trong tab SEO phải đúng — link đặt lại mật khẩu và ảnh chia sẻ mạng xã hội đều dựa vào nó.

**Gửi email thử:** tab Email (SMTP) → nhập địa chỉ nhận → gửi. Nhận được thư *"Vacu — Test SMTP"* nghĩa là cấu hình đúng. Giới hạn 10 lần gửi thử mỗi 10 phút.

---

## 10. Thông báo lỗi thường gặp

| Thông báo | Nguyên nhân & cách xử lý |
|---|---|
| *Không xóa được danh mục này vì đang có sản phẩm…* | Chuyển sản phẩm sang danh mục khác (hoặc xóa danh mục con) rồi xóa lại |
| *Đường dẫn này đã có trang khác dùng* | Đổi sang đường dẫn khác |
| *Email đã tồn tại* | Tài khoản với email này đã có |
| *Không thể hạ quyền quản trị viên duy nhất còn lại* | Nâng quyền một admin khác trước |
| *Bạn không thể tự xóa tài khoản đang đăng nhập* | Nhờ admin khác xóa giúp |
| *Không xóa được Trang chủ* | Trang chủ là trang gốc — hãy ẩn/sắp xếp lại các khối bên trong |
| *Link đã hết hạn hoặc không hợp lệ* | Link đặt lại mật khẩu chỉ sống 60 phút và dùng 1 lần — yêu cầu link mới |
| *Bạn thử đăng nhập quá nhiều lần* | Đợi vài phút rồi thử lại |
| Bấm Lưu mà không thấy phản hồi | Có ô bắt buộc chưa điền — hệ thống sẽ tự nhảy sang đúng tab chứa ô đó |
| Ảnh tải lên bị từ chối | Chỉ nhận JPG/PNG/WebP, tối đa 4MB — hãy nén hoặc đổi định dạng ảnh |

---

## 11. Việc nên làm hằng ngày

**Buổi sáng**
1. Mở **Dashboard**, xem ô **"Cần xử lý"** — có bao nhiêu đơn đang chờ.
2. Vào **Đơn hàng**, lọc **Chờ xác nhận**, gọi khách xác nhận → chuyển sang **Đang thu hoạch**.
3. Lọc **🏦 CK + Chưa trả**, đối chiếu biến động số dư ngân hàng → **✓ Xác nhận đã nhận tiền**.

**Trong ngày**
4. Cập nhật trạng thái đơn theo tiến độ: **Đang giao** → **Đã giao**.
5. Sản phẩm hết hàng: mở sản phẩm, **bỏ tick "Còn hàng"** (đừng xóa sản phẩm).

**Định kỳ**
6. Đăng bài mới ở **Tin tức**; có thể **hẹn giờ** để bài tự lên đúng khung giờ đẹp.
7. Rà soát **Slider trang chủ** và sản phẩm **Nổi bật** theo mùa vụ.
8. Dọn **Thư viện ảnh** — xóa ảnh không còn dùng (hệ thống sẽ cảnh báo nếu ảnh vẫn đang được dùng).
