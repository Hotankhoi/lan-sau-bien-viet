# BÁO CÁO TIẾN ĐỘ – Lặn Sâu: Sổ tay Biển Việt

_Cập nhật: 11/11/2026. File này được cập nhật sau mỗi đợt; phần cuối ghi rõ việc còn lại._

## 1. Tóm tắt nhanh

- **Bản demo vòng trường (vùng Biển miền Trung) chơi được trọn vòng:** tiêu đề → bản đồ → lặn → chụp ảnh chấm sao → thẻ loài mới → Sổ tay → tổng kết → nâng cấp.
- `npm run build` thành công, thư mục `dist/` sẵn sàng để đội tự đưa lên mạng (xem `README.md`).
- 16/43 loài đã có hình vẽ riêng (12 loài miền Trung + 4 loài Bắc Bộ). Các loài còn lại đang dùng hình tạm (cá xám) và đang được vẽ tiếp theo lô 4 loài – danh sách ở mục 4.
- Cả 4 vùng biển đã có môi trường vẽ riêng (rạn san hô miền Trung, núi đá vôi Bắc Bộ, đồng cỏ biển miền Nam, rạn vòng + vực sâu khơi xa).

## 2. Đã làm theo từng đợt

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 – Nền móng | Khung Vite + TypeScript + Phaser 3, hợp đồng hình `src/art/contract.ts`, `style-bible.ts`, 2 loài mẫu (cá khoang cổ, cá mao tiên), công cụ `npm run art:preview`, dữ liệu 43 loài đã kiểm tra | Xong |
| 2 – Lõi lối chơi miền Trung | 10 loài miền Trung còn lại, môi trường rạn san hô, cảnh lặn (oxy, máy ảnh, hành vi sinh vật, sinh vật nguy hiểm, Điểm Xanh, rác, san hô), Sổ tay + thẻ chi tiết, lưu tiến trình | Xong |
| 3 – Đánh bóng demo | Tia nắng, caustics, bóng đổ, cát cuộn, lọc màu theo độ sâu, đèn lặn trả màu thật ở Tầng 2, thẻ lật 3D, hướng dẫn lượt đầu, kiểm tra tự động | Xong – đã gắn tag `demo-vong-truong` |
| Bổ sung – Chế độ lớp học | Nút ở màn hình tiêu đề: chọn vùng → lặn một lượt → 5 câu trắc nghiệm sinh từ dữ liệu loài vừa ghi nhận → điểm + đáp án giải thích (`src/systems/Quiz.ts`, `src/ui/Classroom.ts`; ảnh `preview/screens/50`–`53`) | Xong |
| 4 – Mở rộng | Bản đồ Việt Nam (có Hoàng Sa, Trường Sa), nâng cấp, thành tựu, cài đặt, màn Nguồn & Kê khai AI: **đã có**. Môi trường riêng 3 vùng (Bắc Bộ, miền Nam, khơi xa): **xong**. Tàu lặn "Hải Âu" + Tầng 3 (bút biển phát quang, đèn tàu): **chạy được**. Loài: 4/9 Bắc Bộ xong; miền Nam và khơi xa đang vẽ | Đang làm |
| 5 – Kiểm tra tổng | Build, cân bằng, hiệu năng | Chưa làm |

## 3. Xem kết quả ở đâu

- Bảng hình các loài: `preview/contact-sheet.png`; từng loài (kèm ảnh tham khảo đặt cạnh): `preview/species/<id>.png`.
- Môi trường 4 vùng: `preview/env/<vùng>.png`; ảnh trong lượt lặn: `preview/screens/60-bac_bo-t1.png`, `61-mien_nam-t1.png`, `62-khoi_xa-t3-lamp-on.png` (Tầng 3 bật đèn), `63-…-lamp-off.png` (tắt đèn).
- Ảnh chụp màn hình chơi thử tự động: `preview/screens/` (tiêu đề, bản đồ, Sổ tay, lặn Tầng 1 và 2, ngắm/chụp, thẻ loài mới, thẻ cảnh báo, tổng kết, so sánh tắt/bật đèn `30-…` và `31-…`).
- Báo cáo kiểm tra: `docs/REVIEW_DOT2.md` (Phần 1 thẩm mỹ do làn kiểm tra độc lập chấm – trung bình 8,0/10, 4 loài dưới 8 điểm đã được sửa; Phần 2–4 do agent điều phối tự kiểm vì làn độc lập bị ngắt giữa chừng).

## 4. Chưa làm / còn hạn chế

- Loài chưa có hình riêng (dùng hình tạm cá xám, vẫn chơi và ghi nhận được bình thường): xem danh sách cập nhật ở cuối file này.
- Tầng 3 mới chơi thử tự động (tải 2,9 giây, không lỗi); cần đội chơi tay để cân bằng độ tối và tốc độ tàu.
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

## 8. Trạng thái hình vẽ từng loài

_Sinh bằng `npx tsx tools/species-status.ts`. Loài "hình tạm" vẫn xuất hiện, chụp và ghi vào Sổ tay bình thường, chỉ chưa có hình vẽ riêng._

Tổng: 16/43 loài có hình riêng.

- **Vịnh Bắc Bộ** (4/9): _Sá sùng (hình tạm)_, Sứa rô, Cá ngựa đen, Sam biển, _Bào ngư chín lỗ (hình tạm)_, Cá heo trắng Trung Hoa, _Mực ống (hình tạm)_, _Cá đuối bồng (hình tạm)_, _Cá song chấm nâu (hình tạm)_
- **Biển miền Trung** (12/12): Cá khoang cổ (cá hề), Sao biển gai, Cá mao tiên, Cá mặt quỷ, Ốc cối địa lý, Trai tai tượng vảy, Bạch tuộc đốm xanh, Cá mập vây đen, Rùa đồi mồi, Mực nang vằn, Cá vẹt đầu gù, Cá đuối ó đốm
- **Biển miền Nam** (0/10): _Sao biển gối (hình tạm)_, _Hải sâm đen (hình tạm)_, _Cá dìa (hình tạm)_, _Rắn biển khoanh (hình tạm)_, _Sứa hộp (hình tạm)_, _Rùa xanh (hình tạm)_, _Cá heo Irrawaddy (hình tạm)_, _Bò biển (Dugong) (hình tạm)_, _Mực lá (hình tạm)_, _Cá thu vạch (hình tạm)_
- **Vùng khơi xa** (0/12): _Cá bướm chỉ (hình tạm)_, _Cá Napoleon (hình tạm)_, _Cá ngừ vây vàng (hình tạm)_, _Cá cờ (hình tạm)_, _Cá đuối manta (hình tạm)_, _Cá mập đầu búa vây vòm (hình tạm)_, _Cá nhám voi (hình tạm)_, _Cá đèn lồng (hình tạm)_, _Cá rìu biển (hình tạm)_, _Cá cần câu biển sâu (hình tạm)_, _Bọ biển khổng lồ (hình tạm)_, _Cá mập sáu mang (hình tạm)_

