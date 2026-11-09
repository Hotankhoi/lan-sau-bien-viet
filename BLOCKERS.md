# Vướng mắc chưa gỡ được hoàn toàn

| Thời gian | Vấn đề | Đã thử | Hiện trạng |
|---|---|---|---|
| 2026-11-09 | Wikimedia Commons giới hạn tần suất khi tải ảnh tham khảo cho `muc_nang` | Thử lại sau, giảm số ảnh, dùng ảnh thu nhỏ | Chỉ có 1 ảnh tham khảo; hình vẽ dựa thêm vào trường `visual`. Có thể chạy lại `npm run refs -- muc_nang` sau. |
| 2026-11-09 | `oc_coi_dia_ly`: category Commons chỉ có ảnh vỏ khô, không có ảnh con sống | Tìm trong category loài | Thân mềm, siphon, vòi miệng vẽ theo `visual` + hiểu biết chung về họ ốc cối; nên bổ sung category ảnh sống. |
| 2026-11-09 | Cả 11 agent dừng vì hết hạn mức tuần (lỗi 429) | Chờ tới giờ đặt lại, người dùng bấm "Try again" | Đã chạy tiếp được; từ nay chạy agent theo lô nhỏ. |
| 2026-11-09 | Khung xem trước trong ứng dụng (browser pane) bị ẩn nên không chụp màn hình được | Đổi kích thước, tải lại | Dùng `tools/playtest.ts` (Edge không giao diện) để chơi thử và chụp màn hình thay thế. |
