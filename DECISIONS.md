# Nhật ký quyết định (tự quyết khi người dùng vắng mặt)

| Thời gian | Vấn đề | Lựa chọn | Lý do |
|---|---|---|---|
| 2026-11-09 | Phiên bản công cụ | Phaser 3.90, Vite 8, TypeScript 7, playwright-core dùng Edge/Chrome có sẵn | Không cần tải trình duyệt riêng; Phaser 3 ổn định, có Rope + PostFX. |
| 2026-11-09 | Cách vẽ sinh vật | SVG viết tay theo lớp (`CreatureArt`), nướng thành texture; thân uốn bằng Phaser Rope; bộ phận tách rời xoay quanh pivot | Đúng yêu cầu "vẽ bằng code", đẹp ở mọi độ phân giải, preview và game dùng chung một hàm tư thế `layerPose()`. |
| 2026-11-09 | Kích thước sinh vật trong game | `12 × sizeCm^0.58` px (loài có thể ghi đè `displayLengthPx`) | Giữ tương quan to/nhỏ nhưng loài bé vẫn đủ lớn để nhìn, loài khổng lồ không che màn hình. |
| 2026-11-09 | Giao diện | DOM + CSS (kính mờ) đặt trên canvas Phaser, giao tiếp qua `bus` | Chữ tiếng Việt sắc nét, dễ làm responsive/cảm ứng, không phải tự vẽ chữ trong WebGL. |
| 2026-11-09 | Thẻ Sổ tay | Ảnh SVG dạng data URL (`<img>`) | Tránh trùng id gradient khi một loài xuất hiện nhiều lần trên trang. |
| 2026-11-09 | Hiệu ứng nước | Một PostFX shader duy nhất (hấp thụ màu theo độ sâu, đèn nón trả màu thật, caustics, sương, viền) | Nhẹ, một pass; chế độ Thấp tắt caustics/gợn nước. |
| 2026-11-09 | Chiều cao thế giới | Tầng 1: 1800 px, Tầng 2–3: 2400 px; thợ lặn bắt đầu ~520 px trên đáy | Bản thử đầu tiên quá nhiều nước trống, người chơi phải bơi lâu mới tới rạn. |
| 2026-11-09 | Sinh vật sinh ra | Tập trung trong ~700 px trên đáy | Để rạn sống động, đúng nơi sinh vật rạn thật sự sống. |
| 2026-11-09 | Chụp ảnh | Space/chuột phải để ngắm, thả Space hoặc click trái để chụp; cảm ứng: giữ rồi thả nút Chụp | Theo bảng điều khiển ở mục 4. |
| 2026-11-09 | Ảnh tham khảo bị giới hạn | Commons trả lỗi giới hạn tần suất khi lấy ảnh cho mực nang → chỉ dùng 1 ảnh + mô tả `visual` | Không chờ được; ghi vào BLOCKERS.md. |
| 2026-11-09 | Pattern vảy dùng chung | Sửa `scalePattern` dùng `patternTransform="rotate(90)"` | Agent vẽ cá vẹt phát hiện bản cũ làm cung vảy rơi ra ngoài ô pattern nên vảy gần như không hiện. |
| 2026-11-09 | Lỗi NaN ở sao biển gai | Kẹp tham số `t` trong `armFrame` | Phát hiện bằng `tools/check-art.ts`; cánh xa bị NaN ở chóp. |
| 2026-11-09 | Đáy biển lệch so với san hô | Xoá texture đáy (`sb:*`) mỗi lượt vì đáy sinh theo seed | Bản đầu dùng lại texture đáy của cảnh tiêu đề nên đáy và san hô không khớp. |
| 2026-11-09 | Chống bão hạn mức | Chạy agent theo lô nhỏ, ưu tiên bản demo vòng trường | Lần đầu cả 11 agent cùng hết hạn mức tuần. |
| 2026-11-09 | Thành tựu "Biết sợ là khôn" ghi "6 loài" nhưng dữ liệu chỉ có 5 loài `cuc_ky_nguy_hiem` | Giữ nguyên dữ liệu loài, đổi mô tả thành "đủ 5 loài", điều kiện = tất cả loài cực kỳ nguy hiểm | Không tự ý đổi mức nguy hiểm của loài (dữ liệu khoa học do đội kiểm chứng). |
| 2026-11-09 | `ca_den_long`, `bo_bien_khong_lo` ở Tầng 3 nhưng behavior khác `deep_glow` | Giữ behavior gốc; Tầng 3 vẫn tối, đèn tàu lặn làm lộ | Theo dữ liệu gốc của đề bài. |
| 2026-11-10 | Kiểm tra độc lập chấm 4 loài dưới 8 điểm (ốc cối địa lý vẽ nhầm hoa văn Conus textile, mực nang quá dài, cá mao tiên thân thon, sao biển gai như có chân) | Cho 4 agent sửa có mục tiêu theo `docs/REVIEW_DOT2.md` | Đúng loài quan trọng hơn giữ bản cũ. Trường `visual` trong species.json giữ nguyên (chỉ là ghi chú cho người vẽ, không hiện trong game). |
| 2026-11-10 | Làn kiểm tra độc lập bị ngắt sau Phần 1 (hết hạn mức) | Phần 2–4 do agent điều phối tự kiểm bằng `tools/playtest.ts`, `tools/playtest-extra.ts`; ghi rõ trong báo cáo | Không đủ hạn mức để chạy lại cả làn; phần thẩm mỹ (quan trọng nhất) đã được chấm độc lập. |
| 2026-11-10 | Sinh vật nhút nhát hoảng quá nhanh, bị trừ Điểm Xanh oan | Chỉ tăng độ hoảng khi bơi nhanh VÀ hướng về phía sinh vật; giảm tốc độ tăng | Dạy "tiếp cận nhẹ nhàng" nhưng không phạt người chơi bơi ngang qua. |
| 2026-11-10 | Loài nguy hiểm sinh ra ngay chỗ xuất phát | Vùng an toàn 480 px quanh điểm bắt đầu | Tránh mất oxy ngay giây đầu, nhất là với học sinh mới chơi. |
| 2026-11-10 | Kích thước thợ lặn | Tăng từ 156 lên 190 px | Thợ lặn nhỏ hơn cả cá vẹt 1,3 m là sai tỉ lệ. |
- 2026-11-11: Cá đuối manta – giữ tên khoa học *Mobula birostris* theo species.json (bản giao việc lỡ ghi *M. alfredi*); hình vẽ dùng mảng vai trắng hình chữ T, khớp với *M. birostris*. Kích thước hiển thị 230 px (sải cánh ~325 px) để không che kín màn hình.
- 2026-11-11: Sửa lỗi `scalePattern` (style-bible): các cung vảy trước đây nằm ngoài thẻ `<path>` nên không hiện; nay mọi loài dùng thân chuẩn có vảy mờ 0.08–0.15 đúng mục 7.2 (loài không vảy đã đặt `scales:false`). Phát hiện bởi agent vẽ cá đèn lồng.

## 2026-11-12 – Dữ liệu bảo tồn & Sách Đỏ (DU_LIEU_BAO_TON.json)
- **Gộp dữ liệu**: dùng `tools/merge-conservation.py` để thêm `ecosystem`, `redBookVN`, `appearance`, `ecoRole` vào `species.json` (giữ nguyên định dạng gọn) và sinh `src/data/ecosystems.json`. Chạy lại script là cập nhật được khi đội sửa file gốc.
- **"Cần bảo vệ"** = IUCN VU/EN/CR **hoặc** `redBookVN: true` (hàm `isProtected` trong `types.ts`). Sau khi thêm 3 loài mới có 19 loài (12 loài Sách Đỏ). Thành tựu "Người bảo vệ" dùng đúng danh sách này.
- **Thẻ ghi nhận đặc biệt** thay cho thẻ "Ghi nhận loài mới" thường khi loài thuộc danh sách "Cần bảo vệ" (không hiện hai thẻ liên tiếp để khỏi làm phiền). Nếu ảnh vừa chụp không có thì dùng hình vẽ của loài.
- **Vị trí mục mới** trong thẻ chi tiết: ngay dưới tên và hàng huy hiệu (huy hiệu là một phần của phần tên), trước "Kích thước/Vùng biển".
- **Loài chưa ghi nhận** chỉ hiện bóng đen + vùng/tầng + "Sống ở: <hệ sinh thái>" + gợi ý hành vi; không lộ `appearance`.
- **Giải thích Sách Đỏ** viết thận trọng ("cần được ưu tiên bảo vệ; nhiều loài bị cấm săn bắt, mua bán") vì việc cấm cụ thể do các văn bản pháp luật khác quy định.
- Bào ngư chín lỗ chưa có `conservation` trong dữ liệu → dùng thông điệp bảo tồn chung (đội có thể bổ sung).
- `window.__bus` chỉ có khi chạy `npm run dev` (để Playwright giả lập ảnh chụp), không có trong bản build.

## 2026-11-12 – 3 loài mới & màn "Biển Đông cần chúng"
- **Hải sâm vú** vẽ theo mô tả `visual` (thân đen mờ, 7 u "vú" hai bên, gai thịt nhỏ, lốm đốm cát) vì thư mục ảnh Wikimedia *Holothuria whitmaei* lẫn ảnh hải sâm vú trắng; chọn ảnh tham khảo đúng thân đen.
- **Rùa da** đặt `displayLengthPx` 300 (dài ~2 m nhưng không che kín màn hình, giống cách làm với manta); **ốc anh vũ** 120 px. Vỏ ốc anh vũ vẽ bằng xoắn ốc logarit để vân lửa chạy đúng theo vòng xoắn.
- **Ảnh nhỏ trong màn "Biển Đông cần chúng"**: dựng 46 hình SVG đầy đủ trên máy người chơi mất 12–19 giây (máy yếu còn lâu hơn), nên vẽ sẵn thành WebP 200 px lúc phát triển (`npm run art:thumbs`, tổng 268 KB, lưu ở `public/thumbs/`). Nếu thiếu file thì tự dựng tạm bản SVG nhỏ. `npm run validate:data` cảnh báo khi loài thiếu ảnh nhỏ. **Sửa hình loài nào thì chạy lại `npm run art:thumbs -- <id>`.**
- Màn "Biển Đông cần chúng" nằm trên Sổ tay; Esc đóng lần lượt: bảng hệ sinh thái → thẻ chi tiết → màn Biển Đông → Sổ tay. Bấm ô loài đã gặp mở thẻ chi tiết; ô chưa gặp không bấm được (không lộ thông tin).
- Màn này dùng nền gần đục, bỏ làm mờ phía sau (backdrop blur) để không phải vẽ chồng hai lớp mờ toàn màn hình.
