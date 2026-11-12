# BÁO CÁO TIẾN ĐỘ – Lặn Sâu: Sổ tay Biển Việt

_Cập nhật: 12/11/2026. File này được cập nhật sau mỗi đợt; phần cuối ghi rõ việc còn lại._

## 1. Tóm tắt nhanh

- **Bản demo vòng trường (vùng Biển miền Trung) chơi được trọn vòng:** tiêu đề → bản đồ → lặn → chụp ảnh chấm sao → thẻ loài mới → Sổ tay → tổng kết → nâng cấp.
- `npm run build` thành công, thư mục `dist/` sẵn sàng để đội tự đưa lên mạng (xem `README.md`).
- **46/46 loài đã có hình vẽ riêng** (Bắc Bộ 9, miền Trung 13, miền Nam 10, khơi xa 14 – gồm 6 loài biển sâu Tầng 3). Bảng hình: `preview/contact-sheet.png`.
- **Bảo tồn & Sách Đỏ:** Sổ tay có mục Nhận dạng, Vai trò trong hệ sinh thái Biển Đông, huy hiệu Sách Đỏ Việt Nam, tab "Cần bảo vệ" (19 loài), thẻ ghi nhận đặc biệt viền đỏ son, và màn **"Biển Đông cần chúng"** (4 hệ sinh thái).
- Cả 4 vùng biển đã có môi trường vẽ riêng (rạn san hô miền Trung, núi đá vôi Bắc Bộ, đồng cỏ biển miền Nam, rạn vòng + vực sâu khơi xa).

## 2. Đã làm theo từng đợt

| Đợt | Nội dung | Trạng thái |
|---|---|---|
| 1 – Nền móng | Khung Vite + TypeScript + Phaser 3, hợp đồng hình `src/art/contract.ts`, `style-bible.ts`, 2 loài mẫu (cá khoang cổ, cá mao tiên), công cụ `npm run art:preview`, dữ liệu 43 loài đã kiểm tra | Xong |
| 2 – Lõi lối chơi miền Trung | 10 loài miền Trung còn lại, môi trường rạn san hô, cảnh lặn (oxy, máy ảnh, hành vi sinh vật, sinh vật nguy hiểm, Điểm Xanh, rác, san hô), Sổ tay + thẻ chi tiết, lưu tiến trình | Xong |
| 3 – Đánh bóng demo | Tia nắng, caustics, bóng đổ, cát cuộn, lọc màu theo độ sâu, đèn lặn trả màu thật ở Tầng 2, thẻ lật 3D, hướng dẫn lượt đầu, kiểm tra tự động | Xong – đã gắn tag `demo-vong-truong` |
| Bổ sung – Chế độ lớp học | Nút ở màn hình tiêu đề: chọn vùng → lặn một lượt → 5 câu trắc nghiệm sinh từ dữ liệu loài vừa ghi nhận → điểm + đáp án giải thích (`src/systems/Quiz.ts`, `src/ui/Classroom.ts`; ảnh `preview/screens/50`–`53`) | Xong |
| 4 – Mở rộng | Bản đồ Việt Nam (có Hoàng Sa, Trường Sa), nâng cấp, thành tựu, cài đặt, màn Nguồn & Kê khai AI: **đã có**. Môi trường riêng 3 vùng (Bắc Bộ, miền Nam, khơi xa): **xong**. Tàu lặn "Hải Âu" + Tầng 3 (bút biển phát quang, đèn tàu): **chạy được**. Loài: **đủ 43/43** | Xong |
| 6 – Bảo tồn & Sách Đỏ (Phần A) | Gộp `DU_LIEU_BAO_TON.json` vào `species.json` + `ecosystems.json`; thẻ chi tiết thêm "🔎 Nhận dạng", "🌏 Vai trò trong hệ sinh thái Biển Đông" (bấm nhãn hệ để xem tóm tắt + mối đe dọa); huy hiệu Sách Đỏ Việt Nam (đỏ son, bấm để xem giải thích); tab "Cần bảo vệ" + "Đã ghi nhận x/y loài cần được bảo vệ"; thẻ ghi nhận loài cần bảo vệ với nút "Tôi sẽ bảo vệ loài này"; thành tựu "Người bảo vệ" theo tab mới. Ảnh `preview/screens/70`–`75` | Xong |
| 7 – 3 loài mới + "Biển Đông cần chúng" (Phần B) | Thêm **Rùa da** (khơi xa T2, huyền thoại), **Ốc anh vũ** (khơi xa T3), **Hải sâm vú** (miền Trung T1 – có trong bản demo); vẽ SVG theo ảnh tham khảo. Màn "Biển Đông cần chúng" mở từ Sổ tay: 4 thẻ hệ sinh thái (tóm tắt, mối đe dọa, lưới loài – Sách Đỏ viền đỏ son, chưa gặp là bóng đen) và câu kết "Mỗi loài là một mắt xích…". Ảnh nhỏ của loài vẽ sẵn (`npm run art:thumbs` → `public/thumbs/`, 268 KB) nên màn mở ra là có ảnh ngay. Chơi thử: 3 loài đều xuất hiện đúng vùng/tầng, không lỗi trang. Ảnh `preview/screens/76`–`81` | Xong |
| 5 – Kiểm tra tổng | `npm run build` OK; `tools/check-art.ts` sạch cho cả 43 loài + 4 môi trường; chơi thử tự động trên bản build: Bắc Bộ T2, miền Nam T1, khơi xa T2 và T3 – không lỗi trang, FPS headless 61–82; chụp được loài Tầng 3 và hiện thẻ loài mới. Sửa 2 lỗi phát hiện khi kiểm: vảy không hiện ở mọi loài (`scalePattern`), khoanh rắn biển lồng sai thẻ. Chưa có vòng kiểm tra thẩm mỹ độc lập cho 31 loài mới | Xong phần tự động |

## 3. Xem kết quả ở đâu

- Bảng hình các loài: `preview/contact-sheet.png`; từng loài (kèm ảnh tham khảo đặt cạnh): `preview/species/<id>.png`.
- Môi trường 4 vùng: `preview/env/<vùng>.png`; ảnh trong lượt lặn: `preview/screens/60-bac_bo-t1.png`, `61-mien_nam-t1.png`, `62-khoi_xa-t3-lamp-on.png` (Tầng 3 bật đèn), `63-…-lamp-off.png` (tắt đèn), `64-khoi_xa-t2.png` (đàn cá ngừ, cá cờ), `65-khoi_xa-t3-discover.png` (chụp được cá rìu biển ở Tầng 3).
- Ảnh chụp màn hình chơi thử tự động: `preview/screens/` (tiêu đề, bản đồ, Sổ tay, lặn Tầng 1 và 2, ngắm/chụp, thẻ loài mới, thẻ cảnh báo, tổng kết, so sánh tắt/bật đèn `30-…` và `31-…`).
- Báo cáo kiểm tra: `docs/REVIEW_DOT2.md` (Phần 1 thẩm mỹ do làn kiểm tra độc lập chấm – trung bình 8,0/10, 4 loài dưới 8 điểm đã được sửa; Phần 2–4 do agent điều phối tự kiểm vì làn độc lập bị ngắt giữa chừng).

## 4. Chưa làm / còn hạn chế

- 3 loài mới (rùa da, ốc anh vũ, hải sâm vú) chưa có vòng chấm thẩm mỹ độc lập. Ảnh tham khảo của hải sâm vú trên Wikimedia lẫn cả hải sâm vú trắng (*H. fuscogilva*), nên hình vẽ bám theo mô tả `visual` (thân đen, các u "vú" hai bên).
- Rùa da là loài huyền thoại nên hiếm gặp (chung suất với cá nhám voi, cá mập đầu búa); khi chơi thử tự động phải lặn 2 lượt mới gặp.

- 31 loài vẽ trong Đợt 4 mới qua bước tự soi của từng agent và agent điều phối duyệt ảnh xem trước; **chưa có vòng chấm điểm độc lập** như Đợt 2. Một số điểm đã biết còn có thể đẹp hơn: vây lưng cá song hơi giống răng cưa, đầu cá Napoleon hơi vuông khối, hàm cá cần câu hình nêm, dáng hải sâm hơi giống ổ bánh mì.
- Vài loài chỉ có 3–5 ảnh tham khảo hoặc phải dùng ảnh loài cùng chi (mực ống, cá rìu biển, bọ biển khổng lồ, cá mập sáu mang) – đã ghi trong `references/<id>/notes.md`.
- Tầng 3 mới chơi thử tự động (tải 2,9 giây, không lỗi); cần đội chơi tay để cân bằng độ tối và tốc độ tàu.
- FPS mới đo trong trình duyệt không giao diện (≈ 50–60); cần đội đo lại trên laptop thật.

## 5. Cách chạy và đưa lên mạng

Xem `README.md`. Tóm tắt: `npm install` → `npm run dev` để chơi thử; `npm run build` → tải thư mục `dist/` lên Netlify Drop / GitHub Pages / Cloudflare Pages (đội tự làm; công cụ AI không tự deploy).

## 6. Tóm tắt quyết định và vướng mắc

- Quyết định tự đưa ra: xem `DECISIONS.md` (cách vẽ SVG theo lớp, giao diện DOM, công thức kích thước sinh vật, điều khiển, sửa thành tựu "Biết sợ là khôn" thành 5 loài cho khớp dữ liệu…).
- Vướng mắc: xem `BLOCKERS.md` (Wikimedia giới hạn tần suất với mực nang; ốc cối không có ảnh con sống; hai lần hết hạn mức làm các agent dừng giữa chừng).

## 7. Việc đội dự án cần làm

1. Điền `src/data/credits.json` (tên nhóm, trường, thành viên, giáo viên hướng dẫn).
2. **Kiểm chứng toàn bộ giá trị `redBookVN` và IUCN của 3 loài mới (rùa da, ốc anh vũ, hải sâm vú) trên Sách Đỏ Việt Nam và iucnredlist.org** (hiện ghi: rùa da VU + Sách Đỏ; ốc anh vũ NE + Sách Đỏ; hải sâm vú EN + Sách Đỏ).
3. Kiểm chứng các loài có `needsVerification: true` trong `src/data/species.json` (chạy `npm run validate:data` để xem danh sách) và soát lại mức IUCN với iucnredlist.org.
4. Chơi thử trên laptop và máy tính bảng thật, ghi góp ý về độ khó, tốc độ oxy, điểm nâng cấp.
5. Tự đưa bản `dist/` lên mạng theo `README.md`.

## 8. Trạng thái hình vẽ từng loài

_Sinh bằng `npx tsx tools/species-status.ts`._

Tổng: 46/46 loài có hình riêng.

- **Vịnh Bắc Bộ** (9/9): Sá sùng, Sứa rô, Cá ngựa đen, Sam biển, Bào ngư chín lỗ, Cá heo trắng Trung Hoa, Mực ống, Cá đuối bồng, Cá song chấm nâu
- **Biển miền Trung** (13/13): Cá khoang cổ (cá hề), Sao biển gai, Cá mao tiên, Cá mặt quỷ, Ốc cối địa lý, Trai tai tượng vảy, Bạch tuộc đốm xanh, Cá mập vây đen, Rùa đồi mồi, Mực nang vằn, Cá vẹt đầu gù, Cá đuối ó đốm, Hải sâm vú
- **Biển miền Nam** (10/10): Sao biển gối, Hải sâm đen, Cá dìa, Rắn biển khoanh, Sứa hộp, Rùa xanh, Cá heo Irrawaddy, Bò biển (Dugong), Mực lá, Cá thu vạch
- **Vùng khơi xa** (14/14): Cá bướm chỉ, Cá Napoleon, Cá ngừ vây vàng, Cá cờ, Cá đuối manta, Cá mập đầu búa vây vòm, Cá nhám voi, Cá đèn lồng, Cá rìu biển, Cá cần câu biển sâu, Bọ biển khổng lồ, Cá mập sáu mang, Rùa da, Ốc anh vũ
