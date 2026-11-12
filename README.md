# Lặn Sâu: Sổ tay Biển Việt

🎮 **Chơi ngay:** https://hotankhoi.github.io/lan-sau-bien-viet/

Game giáo dục 2D chạy trên trình duyệt: người chơi là thợ lặn nghiên cứu, lặn khám phá 4 vùng biển Việt Nam (Bắc Bộ, miền Trung, miền Nam, khơi xa) qua 3 tầng độ sâu, **chụp ảnh** (không bắt) 46 loài sinh vật biển, ghi vào Sổ tay. Toàn bộ hình ảnh được vẽ bằng mã (SVG + WebGL), âm thanh tạo bằng Web Audio. Chơi được trên máy tính và máy tính bảng/điện thoại (cảm ứng).

## Chạy trên máy

Cần cài [Node.js](https://nodejs.org) bản 20 trở lên.

```bash
npm install
```

```bash
npm run dev
```

Mở trình duyệt tại địa chỉ hiện ra (thường là http://127.0.0.1:5173/lan-sau-bien-viet/).

## Đưa lên mạng (GitHub Pages)

Repo đã có sẵn `.github/workflows/deploy.yml`: mỗi lần push lên nhánh `main`, GitHub tự chạy `npm ci` + `npm run build` rồi đưa thư mục `dist/` lên GitHub Pages.

- **Lần đầu duy nhất:** trên GitHub vào **Settings → Pages → Build and deployment → Source**, chọn **GitHub Actions**.
- Theo dõi tiến trình ở tab **Actions** của repo; xong sẽ có link chơi ở trên.
- Game cấu hình `base: '/lan-sau-bien-viet/'` trong `vite.config.ts`. Nếu đổi tên repo thì sửa dòng này cho khớp.
- Xem thử bản build trên máy: `npm run build` rồi `npm run preview`, mở `http://127.0.0.1:4173/lan-sau-bien-viet/`.

## Điều khiển

| Hành động | Bàn phím / chuột | Cảm ứng |
|---|---|---|
| Bơi | W A S D / phím mũi tên | Joystick bên trái |
| Bơi nhanh | Giữ Shift | Nút "Tăng tốc" |
| Ngắm máy ảnh | Giữ Space / chuột phải | Giữ nút "Chụp" |
| Chụp | Thả Space / click trái khi đang ngắm | Thả nút "Chụp" |
| Quét sinh vật ngụy trang | E | Nút "Quét" |
| Bật/tắt đèn | F | Nút "Đèn" |
| Nổi lên | Giữ Q 1 giây | Giữ nút "Nổi lên" |
| Sổ tay | Tab / J | Nút "Sổ tay" |
| Tạm dừng | Esc / P | – |

## Chế độ lớp học

Ở màn hình tiêu đề bấm **🏫 Chế độ lớp học**: giáo viên chọn một vùng biển đã mở và tầng độ sâu → học sinh lặn một lượt → sau khi nổi lên làm **5 câu trắc nghiệm** sinh tự động từ chính các loài vừa ghi nhận (tên loài, mức nguy hiểm, tình trạng bảo tồn, "Bạn có biết?", kỹ năng an toàn) → hiện điểm và đáp án có giải thích để cả lớp thảo luận. Câu hỏi lấy trực tiếp từ `src/data/species.json` nên khi đội sửa dữ liệu thì câu hỏi tự đổi theo.

## Việc đội dự án cần làm

1. **Điền thông tin nhóm** vào `src/data/credits.json` (tên nhóm, trường, thành viên, giáo viên hướng dẫn) – hiện ở màn hình "Nguồn dữ liệu & Kê khai AI".
2. **Kiểm chứng dữ liệu khoa học** các loài có `"needsVerification": true` trong `src/data/species.json` (chạy `npm run validate:data` để xem danh sách).
3. **Chơi thử** trên laptop và máy tính bảng, ghi lại góp ý.

### Chế độ kiểm thử (dành cho đội dự án)

Để thử toàn bộ game mà không phải chơi lại từ đầu, thêm `?test=1` vào cuối địa chỉ:

- Trên máy: `http://localhost:5173/lan-sau-bien-viet/?test=1`
- Trên mạng: `https://hotankhoi.github.io/lan-sau-bien-viet/?test=1`

Khi bật, góc trên màn hình có dải cam **CHẾ ĐỘ KIỂM THỬ**. Lần đầu mở, game tự tạo một bộ lưu kiểm thử **"đã có tất cả"**:
- đủ 4 vùng biển và cả 3 tầng (kể cả Tầng 3), mọi nâng cấp ở cấp tối đa;
- đủ 46 loài trong Sổ tay, mỗi loài có ảnh 3★ (ảnh được vẽ từ hình của loài trên nền nước của vùng đó; dải cam hiện "đang tạo ảnh x/46" trong khoảng nửa phút đầu);
- mở khóa mọi thành tựu, 99.999 điểm Nghiên cứu, 9.999 Điểm Xanh; Chế độ lớp học dùng được với mọi vùng.

**Bảng công cụ**: bấm phím **F9** (hoặc nút 🧰 trên dải cam khi dùng màn hình cảm ứng):

| Công cụ | Tác dụng |
|---|---|
| Nhảy nhanh | Vào ngay một vùng/tầng bất kỳ |
| Oxy vô hạn | Bật/tắt; oxy luôn đầy để thoải mái xem |
| Chọn loài → Gọi ra | Loài đó xuất hiện ngay trước mặt thợ lặn. Nếu chưa lặn, game lặn xuống đúng vùng/tầng của loài |
| ★ Gọi loài Huyền thoại / 📕 Gọi loài Sách Đỏ | Gọi một loài và xóa nó khỏi Sổ tay kiểm thử; chụp nó để xem thẻ ghi nhận đặc biệt (thẻ vàng Huyền thoại, thẻ viền đỏ son "Loài cần được bảo vệ") |
| Đặt lại: chưa có gì | Về trạng thái người chơi mới (có cả hướng dẫn lượt đầu) để thử luồng chơi từ đầu |
| Đặt lại: đã có tất cả | Quay về bộ lưu đầy đủ như trên |

**An toàn cho tiến trình thật:** chế độ kiểm thử dùng bộ lưu riêng (khóa `lan-sau-save-v1_test` trong trình duyệt), không đọc và không ghi đè tiến trình thật. Mọi điểm, thành tựu, thống kê khi kiểm thử chỉ nằm trong bộ lưu kiểm thử. Mở lại địa chỉ không có `?test=1` là về đúng tiến trình của bạn, không còn dải cam. Bài chạy thử tự động: `npx tsx tools/playtest-testmode.ts` (cần `npm run dev` đang chạy).

## Công cụ cho nhà phát triển

| Lệnh | Tác dụng |
|---|---|
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run validate:data` | Kiểm tra dữ liệu sinh vật |
| `npm run art:preview -- <id>` | Vẽ thử một loài → `preview/species/<id>.png` (không tham số: tất cả + `preview/contact-sheet.png`) |
| `npx tsx tools/env-preview.ts <vùng>` | Xem thử môi trường một vùng → `preview/env/<vùng>.png` |
| `npx tsx tools/check-art.ts` | Tìm lỗi NaN trong hình SVG |
| `npx tsx tools/playtest.ts [all\|ui\|dive]` | Chơi thử tự động (cần `npm run dev` đang chạy; đặt `URL=` để chọn địa chỉ khác) → `preview/screens/` |
| `npm run art:thumbs [-- <id>]` | Vẽ lại ảnh nhỏ của loài cho màn "Biển Đông cần chúng" → `public/thumbs/` (chạy sau khi sửa hình một loài) |
| `npx tsx tools/playtest-testmode.ts` | Chạy thử tự động Chế độ kiểm thử và kiểm tra tiến trình thật không bị đụng tới |
| `npm run refs -- <id>` | Tải ảnh tham khảo từ Wikimedia Commons (chỉ để nhìn khi vẽ, không đưa vào game; thư mục `references/` không được commit) |

Cấu trúc mã: `src/art` (hình vẽ sinh vật/môi trường), `src/scenes` (cảnh lặn Phaser), `src/systems` (thế giới, hành vi, lưu trữ, âm thanh, thành tựu), `src/ui` (giao diện DOM), `src/shaders` (hiệu ứng nước), `src/data` (dữ liệu loài).

## Nguồn dữ liệu

- Dữ liệu sinh vật (`src/data/species.json`) tổng hợp từ: IUCN Red List (iucnredlist.org), FishBase (fishbase.se), World Register of Marine Species – WoRMS (marinespecies.org), Sách Đỏ Việt Nam. Các loài đánh dấu `"needsVerification": true` cần đội kiểm chứng lại.
- Hình ảnh: toàn bộ sinh vật và môi trường được vẽ bằng mã (SVG/WebGL), không dùng ảnh chụp hay hình vẽ của bên thứ ba. Ảnh Wikimedia Commons chỉ dùng để tham khảo khi vẽ (danh sách và giấy phép: `docs/THAM_KHAO_ANH.md`), không nằm trong game và không được đưa lên repo.
- Âm thanh tạo trực tiếp bằng Web Audio. Phông chữ Be Vietnam Pro (Google Fonts, giấy phép SIL Open Font License).

## Kê khai sử dụng AI

Mã nguồn và hình minh họa của game được xây dựng với sự hỗ trợ của công cụ AI (Claude). Ý tưởng, thiết kế lối chơi, lựa chọn và kiểm chứng dữ liệu khoa học do nhóm học sinh thực hiện.
