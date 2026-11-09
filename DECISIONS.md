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
