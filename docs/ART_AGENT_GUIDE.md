# Hướng dẫn cho agent vẽ sinh vật (Làn A)

Bạn vẽ **một loài** cho game "Lặn Sâu: Sổ tay Biển Việt" (Vite + TS + Phaser 3). Hình vẽ hoàn toàn bằng SVG viết tay trong code. Ưu tiên số 1 là **thẩm mỹ**: đẹp, chi tiết, nhận ra loài ngay. Phong cách "tranh minh họa sinh học hiện đại": bán tả thực, vector mềm, gradient phong phú – không hoạt hình mắt to, không pixel art.

## File được phép sửa
- `src/art/species/<id>.ts` (của loài bạn, tạo mới hoặc ghi đè)
- `references/<id>/` (ảnh tham khảo + `notes.md` + `credits.md`)

KHÔNG sửa file nào khác (đặc biệt `src/art/contract.ts`, `src/art/style-bible.ts`, `src/art/species/index.ts`, `package.json`). Cần đổi gì ở file dùng chung → ghi đề xuất trong báo cáo cuối.
KHÔNG chạy `npm run build`, `npm install`, `git`. Thư mục làm việc: `C:\Users\admin\Downloads\Bien sau Viet Nam` (dùng Bash, đường dẫn có dấu cách nên luôn đặt trong ngoặc kép).

## Đọc trước
1. `src/art/contract.ts` – interface `CreatureArt`, vai trò lớp, quy tắc uốn thân, `layerPose`.
2. `src/art/style-bible.ts` – hàm tiện ích: `makeIds`, `standardBody`, `counterShade`, `eye`, `finRays`, `finMembrane`, `rimLight`, `scalePattern`, `dotPattern`, `gridPattern`, `organicTexture`, `glowFilter`, `smoothPath`, `scatterSpots`, `rng`, `mix`, `shade`...
3. Hai loài mẫu chuẩn: `src/art/species/ca_khoang_co.ts` và `src/art/species/ca_mao_tien.ts`. Đây là **thước đo chất lượng và phong cách** – hình của bạn phải đạt mức chi tiết tương đương, cùng ngôn ngữ (đổ bóng ngược, rim light, mắt có phản chiếu, vây bán trong suốt có tia...). Xem ảnh `preview/species/ca_khoang_co.png`, `preview/species/ca_mao_tien.png`.
4. Dữ liệu loài trong `src/data/species.json` (trường `visual` mô tả đặc điểm bắt buộc, `sizeCm`, `behavior`).

## Bước 1 – Ảnh tham khảo (Wikimedia Commons, CHỈ ĐỂ NHÌN)
```bash
cd "C:/Users/admin/Downloads/Bien sau Viet Nam" && npx tsx tools/fetch-refs.ts <id>
```
Lệnh tải ≤10 ảnh ứng viên và ghép `references/<id>/_montage.png` (có đánh số). Mở montage bằng công cụ Read để xem. Chọn 3–5 ảnh rõ nhất (chụp ngang thân, thấy rõ vây, hoa văn, dưới nước):
```bash
npx tsx tools/fetch-refs.ts <id> --keep 2,5,7
```
→ ảnh thành `references/<id>/ref1.jpg...` và ghi `references/<id>/credits.md` (tác giả, giấy phép, link). Mở từng ảnh đã giữ bằng Read để quan sát kỹ. Viết `references/<id>/notes.md`: tỉ lệ thân, vị trí vây, số sọc/đốm, màu chính (hex ước lượng từ ảnh), tư thế thường gặp.
Nếu không có ảnh phù hợp: thử lại không được thì vẽ theo trường `visual` và ghi rõ trong báo cáo.

**Cấm:** nhúng ảnh (`<image>`), trace/vectorize tự động, dùng ảnh làm texture. Vẽ tay bằng path.

## Bước 2 – Vẽ
- File export default một `CreatureArt`. `id` khớp species.json. Vẽ **đầu quay sang PHẢI**.
- viewBox tối thiểu 512×256 cho cá (rộng hơn nếu vây lớn). `lengthUnits` = chiều dài con vật (đầu→đuôi) theo đơn vị viewBox. Để lề ~4% quanh hình.
- Mọi id trong defs qua `makeIds('<id>')`.
- Không dùng chung khuôn thân với loài khác: vẽ đường viền thân riêng theo ảnh tham khảo (tỉ lệ, đường lưng, mõm, cuống đuôi đúng loài).
- Lớp & chuyển động (xem `contract.ts`):
  - Lớp `role` body/pattern/tail/eye/detail mặc định **uốn theo thân** (baked thành 1 texture, game uốn sóng sin, biên độ tăng về phía đuôi – phía trái viewBox). Vây lưng/hậu môn/đuôi gắn thân → để uốn.
  - Phần cần cử động riêng (vây ngực, cánh đuối, chân chèo rùa, chuông sứa, xúc tu, tay bạch tuộc, điểm phát sáng...) → `bend: false`, có `pivot` (điểm gốc khớp), `anim` và `z: 'back' | 'front'`. Vây phía xa → `z:'back'`, phía gần → `z:'front'`.
  - Thứ tự vẽ thật: [bend:false z:back] → [mọi lớp uốn, theo thứ tự khai báo] → [bend:false z:front].
  - `animation` theo loài: fish | eel | mammal | seahorse | jelly | ray | cephalopod | turtle | static. Đặt `cycleHz`/`bendAmp` hợp lý (cá to bơi chậm hơn). `bendAmp: 0` cho loài không uốn thân.
  - Có thể dùng `procedural.tentacles` cho xúc tu dài mềm (game mô phỏng vật lý dây).
  - Lớp `role: 'alarm'` chỉ hiện khi sinh vật hoảng (vd. vòng xanh bạch tuộc). Lớp `role: 'glow'` + `blend: 'add'` cho phát quang.
  - Lớp `cardOnly: true` cho chi tiết/nền chỉ hiện trên thẻ Sổ tay (vd. hải quỳ sau cá hề).
- Quy tắc thẩm mỹ (mục 7.2): thân gradient đổ bóng ngược; hoa văn path riêng cắt theo `bodyClip`; vảy pattern opacity 0.08–0.15 (loài có vảy); vây 0.5–0.8 opacity + tia vây; mắt có tròng gradient, đồng tử, chấm phản chiếu; rim light ở mép lưng; nét viền màu sẫm cùng tông (không đen thuần, trừ khi loài thật có viền đen).
- Hiệu năng: tránh hàng nghìn phần tử; filter `organicTexture`/blur dùng vừa phải (texture chỉ rasterize một lần nhưng vẫn cần nhanh).

## Bước 3 – Xem trước & tự soi (ít nhất 2 vòng)
```bash
npx tsx tools/art-preview.ts <id>
```
→ `preview/species/<id>.png` (hình lớn, 4 khung chuyển động, kích thước trong game, ảnh tham khảo đặt cạnh, các lớp + pivot đỏ). Mở bằng Read, **so sánh với ảnh tham khảo**: dáng thân, tỉ lệ đầu/thân/đuôi, vị trí vây, hoa văn đặc trưng, màu. Kiểm tra pivot đúng gốc vây, 4 khung chuyển động không bị rời khớp. Sửa rồi render lại. Ít nhất 2 vòng sửa.
KHÔNG chạy `art-preview` không tham số (lệnh đó ghép contact sheet chung – để agent điều phối làm).

Kiểm tra kiểu:
```bash
npx tsc --noEmit -p . 2>&1 | grep "species/<id>" || echo "OK"
```

## Báo cáo cuối (ngắn, tiếng Việt)
- Đặc điểm nhận dạng đã thể hiện; số ảnh tham khảo đã dùng.
- Những điểm còn chưa ưng / đề xuất sửa file dùng chung (nếu có).
- Đường dẫn `preview/species/<id>.png`.
