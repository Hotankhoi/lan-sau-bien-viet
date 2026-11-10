# Vướng mắc chưa gỡ được hoàn toàn

| Thời gian | Vấn đề | Đã thử | Hiện trạng |
|---|---|---|---|
| 2026-11-09 | Wikimedia Commons giới hạn tần suất khi tải ảnh tham khảo cho `muc_nang` | Thử lại sau, giảm số ảnh, dùng ảnh thu nhỏ | Chỉ có 1 ảnh tham khảo; hình vẽ dựa thêm vào trường `visual`. Có thể chạy lại `npm run refs -- muc_nang` sau. |
| 2026-11-09 | `oc_coi_dia_ly`: category Commons chỉ có ảnh vỏ khô, không có ảnh con sống | Tìm trong category loài | Thân mềm, siphon, vòi miệng vẽ theo `visual` + hiểu biết chung về họ ốc cối; nên bổ sung category ảnh sống. |
| 2026-11-09 | Cả 11 agent dừng vì hết hạn mức tuần (lỗi 429) | Chờ tới giờ đặt lại, người dùng bấm "Try again" | Đã chạy tiếp được; từ nay chạy agent theo lô nhỏ. |
| 2026-11-09 | Khung xem trước trong ứng dụng (browser pane) bị ẩn nên không chụp màn hình được | Đổi kích thước, tải lại | Dùng `tools/playtest.ts` (Edge không giao diện) để chơi thử và chụp màn hình thay thế. |

---

## Hiện trạng khi tiếp tục (2026-11-10, sau khi phiên trước dừng vì hết hạn mức)

### Đã xong, chạy được
- `npm run typecheck`, `npm run validate:data`, `npx tsx tools/check-art.ts`: sạch.
- 12/12 loài miền Trung có file trong `src/art/species/`, render được, không NaN, hình dáng riêng từng loài (xem `preview/contact-sheet.png`): cá khoang cổ, sao biển gai, cá mao tiên, cá mặt quỷ, ốc cối địa lý, trai tai tượng, bạch tuộc đốm xanh, cá mập vây đen, rùa đồi mồi, mực nang, cá vẹt đầu gù, đuối ó đốm.
- Môi trường miền Trung (26 vật thể, 4 dải nền parallax, 3 tiền cảnh) – `preview/env/mien_trung.png`.
- `main.ts`, `DiveScene` (thợ lặn, oxy, máy ảnh chấm sao + lưu ảnh, đèn, quét, san hô, rác, sinh vật nguy hiểm, hướng dẫn), HUD, tiêu đề, bản đồ (có Hoàng Sa – Trường Sa), Sổ tay + thẻ chi tiết, tổng kết, nâng cấp, thành tựu, Nguồn & Kê khai AI, cài đặt, điều khiển cảm ứng, lưu localStorage.
- Tàu lặn "Hải Âu" + shader phát quang cho Tầng 3 đã viết nhưng CHƯA chạy thử.

### Hỏng (đã/đang sửa)
- `npm run build` lỗi `manualChunks is not a function` (Vite 8 dùng rolldown) → đã sửa `vite.config.ts` sang dạng hàm; build thành công.
- Sổ tay: màn hình tiêu đề lộ ra phía sau, chữ tràn khỏi thẻ loài chưa gặp.
- Bản đồ: mép trái bị hở nền, nhãn "VIỆT NAM" đặt lệch, nhãn Côn Đảo bị điểm lặn che.
- `tools/playtest.ts`: bấm điểm lặn trên bản đồ bị treo (hiệu ứng nhấp nháy làm Playwright chờ mãi).

### Thiếu
- 5 agent vẽ loài Vịnh Bắc Bộ (cá ngựa đen, sam biển, sứa rô, cá heo trắng, cá đuối bồng) dừng giữa chừng: mới có ảnh tham khảo trong `references/`, CHƯA có file hình.
- Agent kiểm tra độc lập Đợt 2 dừng trước khi viết `docs/REVIEW_DOT2.md` → phải chạy lại.
- 31 loài ngoài miền Trung, môi trường 3 vùng còn lại (đang dùng hình/môi trường tạm).
- Chưa có tag `demo-vong-truong`, chưa có `REPORT.md`, chưa có Chế độ lớp học.
