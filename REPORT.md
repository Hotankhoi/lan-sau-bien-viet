# BÁO CÁO TIẾN ĐỘ – Lặn Sâu: Sổ tay Biển Việt

_Cập nhật: 10/11/2026. File này được cập nhật sau mỗi đợt; phần cuối ghi rõ việc còn lại._

## 1. Tóm tắt nhanh

- **Bản demo vòng trường (vùng Biển miền Trung) chơi được trọn vòng:** tiêu đề → bản đồ → lặn → chụp ảnh chấm sao → thẻ loài mới → Sổ tay → tổng kết → nâng cấp.
- `npm run build` thành công, thư mục `dist/` sẵn sàng để đội tự đưa lên mạng (xem `README.md`).
- 12/43 loài đã có hình vẽ riêng (toàn bộ vùng miền Trung). 31 loài còn lại đang dùng hình tạm (cá xám) – xem mục 4.

## 2. Đã làm theo từng đợt

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 – Nền móng | Khung Vite + TypeScript + Phaser 3, hợp đồng hình `src/art/contract.ts`, `style-bible.ts`, 2 loài mẫu (cá khoang cổ, cá mao tiên), công cụ `npm run art:preview`, dữ liệu 43 loài đã kiểm tra | Xong |
| 2 – Lõi lối chơi miền Trung | 10 loài miền Trung còn lại, môi trường rạn san hô, cảnh lặn (oxy, máy ảnh, hành vi sinh vật, sinh vật nguy hiểm, Điểm Xanh, rác, san hô), Sổ tay + thẻ chi tiết, lưu tiến trình | Xong |
| 3 – Đánh bóng demo | Tia nắng, caustics, bóng đổ, cát cuộn, lọc màu theo độ sâu, đèn lặn trả màu thật ở Tầng 2, thẻ lật 3D, hướng dẫn lượt đầu, kiểm tra tự động | Xong – đã gắn tag `demo-vong-truong` |
| Bổ sung – Chế độ lớp học | Nút ở màn hình tiêu đề: chọn vùng → lặn một lượt → 5 câu trắc nghiệm sinh từ dữ liệu loài vừa ghi nhận → điểm + đáp án giải thích (`src/systems/Quiz.ts`, `src/ui/Classroom.ts`; ảnh `preview/screens/50`–`53`) | Xong |
| 4 – Mở rộng | Bản đồ Việt Nam (có Hoàng Sa, Trường Sa), nâng cấp, thành tựu, cài đặt, màn Nguồn & Kê khai AI: **đã có**. Tàu lặn "Hải Âu" + Tầng 3: đã viết, chưa thử kỹ. 31 loài + 3 môi trường còn lại: **chưa làm** | Dở dang |
| 5 – Kiểm tra tổng | Build, cân bằng, hiệu năng | Chưa làm |

## 3. Xem kết quả ở đâu

- Bảng hình các loài: `preview/contact-sheet.png`; từng loài (kèm ảnh tham khảo đặt cạnh): `preview/species/<id>.png`.
- Môi trường miền Trung: `preview/env/mien_trung.png`.
- Ảnh chụp màn hình chơi thử tự động: `preview/screens/` (tiêu đề, bản đồ, Sổ tay, lặn Tầng 1 và 2, ngắm/chụp, thẻ loài mới, thẻ cảnh báo, tổng kết, so sánh tắt/bật đèn `30-…` và `31-…`).
- Báo cáo kiểm tra: `docs/REVIEW_DOT2.md` (Phần 1 thẩm mỹ do làn kiểm tra độc lập chấm – trung bình 8,0/10, 4 loài dưới 8 điểm đã được sửa; Phần 2–4 do agent điều phối tự kiểm vì làn độc lập bị ngắt giữa chừng).

## 4. Chưa làm / còn hạn chế

- 31 loài của Vịnh Bắc Bộ, Biển miền Nam, Vùng khơi xa chưa có hình riêng. 5 loài Bắc Bộ đã tải ảnh tham khảo (`references/`) nhưng chưa vẽ.
- Môi trường riêng cho 3 vùng còn lại chưa vẽ (đang dùng môi trường tạm sinh bằng mã).
- Tầng 3 (tàu lặn, phát quang sinh học) chưa chơi thử đầy đủ.
- FPS mới đo trong trình duyệt không giao diện (≈ 50–60); cần đội đo lại trên laptop thật.

## 5. Cách chạy và đưa lên mạng

Xem `README.md`. Tóm tắt: `npm install` → `npm run dev` để chơi thử; `npm run build` → tải thư mục `dist/` lên Netlify Drop / GitHub Pages / Cloudflare Pages (đội tự làm; công cụ AI không tự deploy).

## 6. Tóm tắt quyết định và vướng mắc

- Quyết định tự đưa ra: xem `DECISIONS.md` (cách vẽ SVG theo lớp, giao diện DOM, công thức kích thước sinh vật, điều khiển, sửa thành tựu "Biết sợ là khôn" thành 5 loài cho khớp dữ liệu…).
- Vướng mắc: xem `BLOCKERS.md` (Wikimedia giới hạn tần suất với mực nang; ốc cối không có ảnh con sống; hai lần hết hạn mức làm các agent dừng giữa chừng).

## 7. Việc đội dự án cần làm

1. Điền `src/data/credits.json` (tên nhóm, trường, thành viên, giáo viên hướng dẫn).
2. Kiểm chứng các loài có `needsVerification: true` trong `src/data/species.json` (chạy `npm run validate:data` để xem danh sách) và soát lại mức IUCN với iucnredlist.org.
3. Chơi thử trên laptop và máy tính bảng thật, ghi góp ý về độ khó, tốc độ oxy, điểm nâng cấp.
4. Tự đưa bản `dist/` lên mạng theo `README.md`.
