# Lặn Sâu: Sổ tay Biển Việt

Game giáo dục 2D chạy trên trình duyệt: người chơi là thợ lặn nghiên cứu, lặn khám phá biển Việt Nam, **chụp ảnh** (không bắt) 43 loài sinh vật biển, ghi vào Sổ tay. Toàn bộ hình ảnh được vẽ bằng mã (SVG + WebGL), âm thanh tạo bằng Web Audio.

## Chạy trên máy (dành cho đội dự án)

Cần cài [Node.js](https://nodejs.org) bản 20 trở lên.

```bash
npm install
```

```bash
npm run dev
```

Mở trình duyệt tại địa chỉ hiện ra (thường là http://127.0.0.1:5173).

## Tạo bản build để đưa lên mạng

```bash
npm run build
```

Kết quả nằm trong thư mục `dist/` – đây là trang web tĩnh, mở được trên mọi dịch vụ host tĩnh miễn phí.

### Cách đưa lên mạng (đội tự làm, không cần thẻ tín dụng)

**Cách 1 – Netlify Drop (dễ nhất):** vào https://app.netlify.com/drop, kéo thả cả thư mục `dist/` vào trang. Netlify cho ngay một đường link.

**Cách 2 – GitHub Pages:**
1. Tạo kho (repository) mới trên GitHub, đẩy mã nguồn lên.
2. Chạy `npm run build`, rồi đưa nội dung thư mục `dist/` lên nhánh `gh-pages` (hoặc dùng GitHub Actions "Deploy static content").
3. Vào Settings → Pages, chọn nhánh `gh-pages`. Game đã cấu hình `base: './'` nên chạy được ở đường dẫn con.

**Cách 3 – Cloudflare Pages:** tạo project, chọn "Upload assets", tải lên thư mục `dist/`.

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

## Việc đội dự án cần làm

1. **Điền thông tin nhóm** vào `src/data/credits.json` (tên nhóm, trường, thành viên, giáo viên hướng dẫn) – hiện ở màn hình "Nguồn dữ liệu & Kê khai AI".
2. **Kiểm chứng dữ liệu khoa học** các loài có `"needsVerification": true` trong `src/data/species.json` (chạy `npm run validate:data` để xem danh sách).
3. **Chơi thử** trên laptop và máy tính bảng, ghi lại góp ý.

## Công cụ cho nhà phát triển

| Lệnh | Tác dụng |
|---|---|
| `npm run typecheck` | Kiểm tra kiểu TypeScript |
| `npm run validate:data` | Kiểm tra dữ liệu sinh vật |
| `npm run art:preview -- <id>` | Vẽ thử một loài → `preview/species/<id>.png` (không tham số: tất cả + `preview/contact-sheet.png`) |
| `npx tsx tools/env-preview.ts <vùng>` | Xem thử môi trường một vùng → `preview/env/<vùng>.png` |
| `npx tsx tools/check-art.ts` | Tìm lỗi NaN trong hình SVG |
| `npx tsx tools/playtest.ts [all\|ui\|dive]` | Chơi thử tự động (cần `npm run dev` đang chạy) → `preview/screens/` |
| `npm run refs -- <id>` | Tải ảnh tham khảo từ Wikimedia Commons (chỉ để nhìn khi vẽ, không đưa vào game; thư mục `references/` không được commit) |

Cấu trúc mã: `src/art` (hình vẽ sinh vật/môi trường), `src/scenes` (cảnh lặn Phaser), `src/systems` (thế giới, hành vi, lưu trữ, âm thanh, thành tựu), `src/ui` (giao diện DOM), `src/shaders` (hiệu ứng nước), `src/data` (dữ liệu loài).
