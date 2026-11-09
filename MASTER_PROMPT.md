# MASTER PROMPT — Game 2D "LẶN SÂU: SỔ TAY BIỂN VIỆT"

> Dán toàn bộ file này cho Claude Code. Đây là bản đặc tả đầy đủ: ý tưởng, lối chơi, định hướng thẩm mỹ, kiến trúc kỹ thuật và dữ liệu 43 sinh vật biển Việt Nam.

---

## 0. VAI TRÒ VÀ BỐI CẢNH

Bạn là một game developer kiêm technical artist. Nhiệm vụ: xây dựng **một game 2D chạy trên trình duyệt** cho dự án dự thi **"Học sinh, sinh viên với ý tưởng khởi nghiệp" cấp TP.HCM năm học 2026–2027** (lĩnh vực LV04 – Giáo dục).

Các ràng buộc bắt buộc:

1. **Toàn bộ giao diện và nội dung bằng tiếng Việt có dấu.**
2. **Mọi hình ảnh phải tự tạo bằng code** (SVG vẽ tay bằng mã, shader, particle). **Không** tải hay nhúng ảnh có sẵn từ Internet. Thể lệ cuộc thi cấm vi phạm sở hữu trí tuệ.
3. Game phải có màn hình **"Nguồn dữ liệu & Kê khai AI"** (xem mục 12). Thể lệ yêu cầu kê khai nguồn và mức độ sử dụng AI.
4. Chạy mượt trên laptop phổ thông (Chrome/Edge) và dùng được trên máy tính bảng (cảm ứng).
5. Deploy được dạng web tĩnh (GitHub Pages / Netlify / Vercel) để gửi link cho giám khảo.
6. **Ưu tiên số 1 là thẩm mỹ**: sinh vật phải đẹp, chi tiết, nhận ra ngay loài nào. Đây là điểm tạo ấn tượng với giám khảo.

---

## 1. Ý TƯỞNG TỔNG QUAN

**Người chơi là một thợ lặn nghiên cứu trẻ** của "Trạm Nghiên cứu Biển Việt". Họ lặn ở bốn vùng biển Việt Nam, xuống ba tầng độ sâu, dùng **máy ảnh dưới nước** để chụp và ghi nhận sinh vật vào **Sổ tay Sinh vật Biển**.

**Không bắt, không giết.** Người chơi *chụp ảnh và ghi nhận*. Sinh vật càng hiếm thì càng thường là loài đang bị đe dọa. Khi tìm được loài hiếm, người chơi nhận thành tựu kèm thông điệp bảo tồn.

**Ba trụ cột thiết kế:**

- **ĐẸP**: thế giới dưới nước lung linh, ánh sáng thay đổi theo độ sâu, sinh vật chi tiết như tranh minh họa khoa học.
- **ĐÚNG**: phân bố loài, độ sâu, mức nguy hiểm và tình trạng bảo tồn dựa trên dữ liệu thật.
- **CÓ Ý NGHĨA**: lặn có trách nhiệm (không chạm san hô, không làm hoảng sinh vật, nhặt rác) được thưởng điểm.

**Tagline:** *"Mỗi bức ảnh là một lời hứa bảo vệ biển."*

---

## 2. CÔNG NGHỆ

- **Vite + TypeScript + Phaser 3** (WebGL renderer).
- Sinh vật vẽ bằng **SVG viết tay trong code**: mỗi loài một file `src/art/species/<id>.ts` export các phần SVG (thân, vây, đuôi, mắt…). Lúc khởi động, rasterize SVG thành texture ở độ phân giải 2x để sắc nét trên màn hình retina.
- Hiệu ứng nước: **custom WebGL pipeline/shader** của Phaser cho caustics (vân sáng đáy biển), god rays (tia nắng), lọc màu theo độ sâu, rung nước.
- Lưu tiến trình: `localStorage`, có try/catch. Nếu lỗi thì game vẫn chạy, chỉ không lưu.
- Font: **Be Vietnam Pro** (Google Fonts, hỗ trợ tiếng Việt đầy đủ), dự phòng `system-ui`.
- Âm thanh (khuyến khích): tạo bằng **Web Audio API** (tiếng bong bóng, tiếng ù nền dưới nước, tiếng màn trập máy ảnh). Không dùng file nhạc có bản quyền.

**Cấu trúc thư mục gợi ý:**

```
src/
  main.ts
  config.ts                 # hằng số cân bằng game
  data/species.json         # dữ liệu 43 loài (mục 11)
  data/regions.json
  data/achievements.json
  scenes/ Boot, Title, WorldMap, Dive, Journal, SpeciesCard, Upgrades, Credits
  entities/ Diver, Creature, Trash, Coral
  systems/ Oxygen, Camera, Behavior(AI), Spawner, Lighting, Save, Achievement
  art/species/*.ts          # SVG từng loài
  art/environment/*.ts      # san hô, đá, cỏ biển, núi đá vôi Hạ Long...
  shaders/ caustics, godrays, depthTint
```

---

## 3. VÒNG LẶP CHƠI

```
Bản đồ Việt Nam → chọn vùng → chọn tầng → LẶN
   → bơi khám phá, quản lý OXY
   → tiếp cận nhẹ nhàng → CHỤP ẢNH (1–3 sao)
   → né sinh vật nguy hiểm, không chạm san hô, nhặt rác
   → nổi lên (hoặc hết oxy thì tự động nổi)
→ Tổng kết lượt lặn: loài mới, điểm Nghiên cứu, Điểm Xanh
→ Sổ tay cập nhật, nâng cấp thiết bị → mở vùng/tầng mới
```

Một lượt lặn kéo dài khoảng 3–5 phút. Ngắn, phù hợp demo trước giám khảo.

---

## 4. ĐIỀU KHIỂN

| Hành động | Bàn phím/chuột | Cảm ứng |
|---|---|---|
| Bơi | WASD / phím mũi tên | Joystick ảo bên trái |
| Bơi nhanh (tốn oxy, làm cá hoảng) | Giữ Shift | Nút "Tăng tốc" |
| Ngắm máy ảnh | Giữ chuột phải / Space | Giữ nút máy ảnh |
| Chụp | Click trái khi đang ngắm / thả Space | Thả nút máy ảnh |
| Quét (lộ sinh vật ngụy trang) | E | Nút "Quét" |
| Bật/tắt đèn lặn | F | Nút đèn |
| Nổi lên | Q (giữ 1 giây) | Nút "Nổi lên" |
| Sổ tay | Tab / J | Nút sổ tay |

Thợ lặn chuyển động có **quán tính** (trôi nhẹ khi thả phím), bong bóng thở ra theo nhịp, chân vịt đập có animation.

---

## 5. CƠ CHẾ CHI TIẾT

### 5.1 Oxy
- Thanh oxy giảm theo thời gian, giảm nhanh hơn khi tăng tốc và khi ở tầng sâu.
- Dưới 25%: viền màn hình đỏ nhạt nhấp nháy, nhịp thở dồn.
- Hết oxy: tự động nổi lên, chỉ giữ lại ảnh đã chụp (không mất tiến trình, game thân thiện với học sinh).

### 5.2 Máy ảnh và chất lượng ảnh
Khi ngắm: màn hình hơi tối viền, hiện khung ngắm, thanh lấy nét. Ảnh chấm **1–3 sao** dựa trên:
- Sinh vật nằm gần tâm khung.
- Sinh vật chiếm đủ diện tích khung (đủ gần).
- Sinh vật không bị che, quay ngang (thấy rõ hình dáng).
- Tay giữ ổn định (người chơi không di chuyển mạnh lúc chụp).

Ảnh chụp được **lưu thật**: render vùng khung ngắm ra texture/dataURL nhỏ, hiện trong Sổ tay. Mỗi loài giữ ảnh đẹp nhất.

Điểm Nghiên cứu = điểm theo độ hiếm × hệ số sao (1★ ×1, 2★ ×1.5, 3★ ×2). Chụp lại loài cũ được 25% điểm.

| Độ hiếm | Điểm | Tỉ lệ xuất hiện trong tầng |
|---|---|---|
| Thường gặp | 10 | ~60% |
| Ít gặp | 25 | ~25% |
| Hiếm | 60 | ~12% |
| Huyền thoại | 150 | ~3% (tối đa 1 con mỗi lượt lặn) |

### 5.3 Hành vi sinh vật (AI)
Mỗi loài có trường `behavior` (xem dữ liệu):

- `static`: đứng yên hoặc bò rất chậm (sao biển, trai, hải sâm).
- `buried`: vùi dưới cát, chỉ lộ mắt/viền; đến gần mới nhô lên (đuối bồng, sá sùng).
- `drift`: trôi theo dòng, co bóp nhịp nhàng (sứa).
- `shy`: bơi xa nếu người chơi lao tới nhanh; phải **bơi chậm** để tiếp cận (cá ngựa, dugong, cá heo).
- `school`: bơi theo đàn (boids: tách, gióng hàng, gắn kết) (cá ngừ, cá đèn lồng, cá dìa).
- `wander`: bơi lượn tự do quanh khu vực.
- `fast_pass`: lướt ngang màn hình rất nhanh rồi biến mất, phải chụp kịp (cá cờ, cá thu).
- `camouflage`: gần như vô hình, lẫn vào đá/cát; phải dùng **Quét (E)** mới hiện ra (cá mặt quỷ).
- `curious`: tò mò bơi lại gần người chơi đang đứng yên (cá Napoleon, cá mập vây đen).
- `deep_glow`: chỉ thấy rõ khi bật đèn, có điểm phát quang sinh học (sinh vật Tầng 3).

**Thanh "độ hoảng"** của mỗi sinh vật tăng khi người chơi lao tới nhanh hoặc bật đèn chiếu thẳng; đầy thì sinh vật bỏ chạy. Đây là cách dạy **lặn có trách nhiệm** qua lối chơi.

### 5.4 Sinh vật nguy hiểm
- Mức `can_than`: hiện biểu tượng cảnh báo vàng khi lại gần; không gây sát thương.
- Mức `nguy_hiem` / `cuc_ky_nguy_hiem`: chạm vào thì bị **đẩy lùi, mất 15% / 30% oxy**, màn hình lóe đỏ, và hiện thẻ cảnh báo ngắn: tên loài, vì sao nguy hiểm, và câu cố định:
  > "Ngoài đời thật: tuyệt đối không chạm vào. Nếu bị chích/đốt, lên bờ ngay, báo người lớn và gọi cấp cứu 115."
- Sinh vật nguy hiểm **không chủ động tấn công**. Chỉ gây hại khi người chơi va chạm (đúng với thực tế).

### 5.5 Điểm Xanh (lặn có trách nhiệm)
- **+** Nhặt rác nhựa trôi (túi nilon, chai, lưới ma, ống hút), cho vào túi lưới.
- **−** Va vào san hô: san hô chuyển màu nhạt trong chốc lát, kèm thông báo "San hô cần hàng chục năm để phục hồi".
- **−** Làm hoảng sinh vật hiếm.
- Điểm Xanh mở khóa một số thành tựu và trang phục thợ lặn.

### 5.6 Nâng cấp thiết bị (đổi bằng Điểm Nghiên cứu)
| Thiết bị | Tác dụng |
|---|---|
| Bình oxy lớn (3 cấp) | +thời gian lặn |
| Chân vịt carbon (2 cấp) | +tốc độ, ít tốn oxy khi tăng tốc |
| Ống kính macro | Chụp sinh vật nhỏ (cá ngựa, bạch tuộc, ốc cối) dễ đạt 3★ hơn |
| Máy quét sinh học | Mở khả năng Quét (E) |
| Đèn lặn công suất cao | Bắt buộc để thấy rõ Tầng 3 |
| **Tàu lặn mini "Hải Âu"** | Bắt buộc cho Tầng 3 (>200m). Thực tế người không thể lặn tự do xuống độ sâu này. Hiển thị giải thích khoa học khi mở khóa. |

Ở Tầng 3, người chơi điều khiển tàu lặn mini (hình dáng khác, có đèn pha, cánh tay robot) thay cho thợ lặn.

---

## 6. VÙNG BIỂN VÀ TẦNG ĐỘ SÂU

### 6.1 Bản đồ thế giới
- Bản đồ Việt Nam cách điệu (vẽ SVG, phong cách bản đồ hải đồ cổ pha hiện đại): đất liền màu kem, biển xanh nhiều sắc độ, đường đẳng sâu mảnh.
- **Bắt buộc thể hiện quần đảo Hoàng Sa và Trường Sa thuộc Việt Nam**, có nhãn tên.
- Bốn điểm lặn phát sáng, có biểu tượng khóa nếu chưa mở. Di chuột hiện thẻ xem trước: tên vùng, số loài đã ghi nhận / tổng.

### 6.2 Thứ tự mở khóa
1. **Biển miền Trung**: mở sẵn (vùng hướng dẫn).
2. **Vịnh Bắc Bộ**: ghi nhận 6 loài bất kỳ.
3. **Biển miền Nam**: ghi nhận 14 loài.
4. **Vùng khơi xa (Hoàng Sa – Trường Sa)**: ghi nhận 24 loài + có Bình oxy cấp 2.
   - Tầng 3 vùng khơi xa: cần Tàu lặn mini + Đèn lặn công suất cao.

### 6.3 Bản sắc thị giác từng vùng
| Vùng | Tầng có | Không khí | Bảng màu nước | Cảnh vật đặc trưng |
|---|---|---|---|---|
| Vịnh Bắc Bộ | 1, 2 | Huyền ảo, hơi sương | Xanh ngọc bích đục nhẹ (#3E8E7E → #1F4E4A) | Chân núi đá vôi Hạ Long nhô xuống nước (parallax), hang đá, đáy bùn cát, bãi sá sùng |
| Biển miền Trung | 1, 2 | Rực rỡ, trong vắt | Xanh lam ngọc trong (#3FC1D9 → #0F5C8C) | Rạn san hô dày đặc nhiều màu: san hô bàn, san hô sừng hươu, hải quỳ, quạt biển; nắng chiếu mạnh |
| Biển miền Nam | 1, 2 | Ấm áp, nắng vàng | Xanh lục ngả vàng (#7CC6A4 → #1E6B6B) | Thảm cỏ biển đung đưa, cát trắng, đá granite tròn (Côn Đảo) |
| Vùng khơi xa | 1, 2, 3 | Bao la, sâu thẳm | Xanh coban đậm (#1E6FD9 → #031A3D → đen) | Rạn san hô vòng nguyên sơ, vách đá dốc đứng đổ xuống vực sâu, đại dương mở |

### 6.4 Ánh sáng theo độ sâu (đúng khoa học, là điểm nhấn thẩm mỹ)
Nước hấp thụ ánh sáng đỏ trước, rồi cam, vàng; xuống sâu chỉ còn xanh lam.
- **Tầng 1 (0–30m)**: đủ màu, god rays rõ, caustics nhảy múa trên cát và sinh vật, mặt nước lấp lánh phía trên.
- **Tầng 2 (30–200m)**: màu đỏ/cam của sinh vật bị "tắt" dần (áp shader giảm kênh đỏ theo độ sâu), ánh sáng mờ, tia nắng yếu. **Bật đèn lặn thì màu thật hiện lại trong vùng chiếu sáng.** Đây là hiệu ứng "wow" quan trọng.
- **Tầng 3 (>200m)**: gần như tối đen. Chỉ có vùng sáng hình nón của đèn tàu lặn, các đốm **phát quang sinh học** (xanh lam/xanh lục) và "tuyết biển" (hạt hữu cơ trôi chậm).
- Đồng hồ độ sâu (mét) và áp suất (atm ≈ 1 + độ sâu/10) luôn hiện góc màn hình.

---

## 7. ĐỊNH HƯỚNG THẨM MỸ (QUAN TRỌNG NHẤT)

### 7.1 Phong cách chung
**"Tranh minh họa sinh học hiện đại"**: bán tả thực, nét vẽ vector mềm mại, chuyển màu (gradient) phong phú, cảm giác như trang sách bách khoa sinh vật cao cấp được làm sống động. Không phải kiểu hoạt hình mắt to ngây ngô, cũng không phải pixel art.

### 7.2 Quy tắc vẽ sinh vật (SVG bằng code)
Mỗi loài **phải nhận ra ngay** nhờ hình dáng và hoa văn đặc trưng (xem `visual` trong dữ liệu). **Tuyệt đối không** dùng một khuôn cá chung rồi đổi màu.

Mỗi sinh vật vẽ theo lớp, tách thành bộ phận để animate:
1. **Thân**: path dáng chuẩn của loài. Gradient **đổ bóng ngược** (lưng đậm, bụng sáng; đúng cơ chế ngụy trang trong tự nhiên).
2. **Hoa văn**: sọc, đốm, vạch, mạng lưới vẽ bằng path/`<pattern>` riêng, khớp đặc điểm thật.
3. **Vảy**: lớp `<pattern>` vảy cá cực mảnh (opacity 0.08–0.15) cho loài có vảy.
4. **Vây**: bán trong suốt (opacity 0.5–0.8), có **tia vây** là các đường mảnh tỏa ra.
5. **Mắt**: tròng có gradient tròn, đồng tử, **chấm sáng phản chiếu (specular)**. Mắt là thứ làm sinh vật "có hồn".
6. **Ánh sáng viền (rim light)**: nét sáng mảnh ở mép lưng phía trên, mô phỏng nắng từ mặt nước.
7. **Bóng đổ mềm** lên đáy khi sinh vật ở gần đáy (Tầng 1).

Độ chi tiết: viewBox gốc tối thiểu 512×256 cho cá. **Thẻ Sổ tay dùng bản vẽ lớn hơn** với chi tiết cao hơn bản trong game.

### 7.3 Animation
- **Cá**: chia thân 3–4 đoạn (hoặc dùng Phaser Rope/mesh) để thân uốn lượn sóng sin, biên độ tăng dần về đuôi; đuôi quẫy; vây ngực vẫy lệch pha; nhấp nhô nhẹ khi đứng yên.
- **Đặc thù từng loài**:
  - Sứa: chuông co bóp, xúc tu uốn lượn theo vật lý dây.
  - Mực nang / mực: **đổi màu, đổi hoa văn** gợn sóng chạy dọc thân (hiệu ứng tế bào sắc tố), vây viền gợn.
  - Bạch tuộc đốm xanh: **vòng xanh nhấp nháy sáng** khi bị lại gần (cảnh báo).
  - Cá đuối, đuối ó, manta: cánh vỗ như chim bay chậm.
  - Cá ngựa: dựng đứng, vây lưng rung rất nhanh, đuôi quấn cỏ biển.
  - Cá mao tiên: xòe vây ngực như quạt lông vũ, trôi chậm uy nghi.
  - Cá mặt quỷ: bất động, mắt chớp rất hiếm.
  - Dugong: cúi xuống gặm cỏ biển, để lại vệt cát.
  - Rùa: vỗ chân trước nhịp nhàng, lướt dài.
  - Cá cờ: dựng vây buồm khi tăng tốc.
  - Cá cần câu: mồi câu phát sáng đung đưa trước miệng.
- Mọi sinh vật **quay mặt theo hướng bơi** (flip mượt bằng scaleX tween, không lật cụt).

### 7.4 Môi trường
- **Parallax 5 lớp**: (1) nền gradient nước, (2) bóng mờ xa (vách đá, núi đá vôi, đàn cá xa), (3) cảnh giữa, (4) lớp chơi, (5) tiền cảnh mờ (bong bóng to, cỏ biển cận cảnh, hạt lơ lửng có depth-of-field).
- San hô, cỏ biển, rong **đung đưa** theo dòng chảy.
- Particle: bong bóng, hạt phù du lấp lánh, tuyết biển (Tầng 3), cát cuộn khi chân vịt quạt gần đáy.
- Mặt nước nhìn từ dưới lên ở Tầng 1: gợn sóng có ánh sáng khúc xạ.

### 7.5 Giao diện (UI)
- Phong cách **kính mờ dưới nước**: panel nền xanh đậm trong suốt, blur, viền sáng mảnh, góc bo.
- Màu nhấn: xanh ngọc #4FE3D3, vàng san hô #FFC75F, đỏ cảnh báo #FF6B6B.
- Huy hiệu độ hiếm:
  - Thường gặp: xám bạc.
  - Ít gặp: xanh lá.
  - Hiếm: xanh lam phát sáng.
  - Huyền thoại: vàng kim, có hạt lấp lánh và viền chuyển động.
- Khi ghi nhận loài mới: thẻ lật ra 3D (flip), hiệu ứng ánh sáng; với loài Huyền thoại có thêm khoảnh khắc chậm (slow-motion) và nhạc nền ngân lên.
- Mọi chữ dễ đọc: tối thiểu 16px, tương phản tốt.

### 7.6 Ảnh tham khảo cho từng loài (CHỈ ĐỂ NHÌN, KHÔNG ĐƯA VÀO GAME)

Trước khi vẽ mỗi loài, agent phải **xem ảnh thật** của loài đó để vẽ đúng hình dáng, tỉ lệ, hoa văn. Nguồn dùng: **Wikimedia Commons** (ảnh có giấy phép mở CC/public domain).

**Quy trình cho mỗi loài:**
1. Dùng Wikimedia Commons API để lấy danh sách ảnh trong category của loài (bảng dưới). Ví dụ:
   `https://commons.wikimedia.org/w/api.php?action=query&list=categorymembers&cmtitle=Category:Amphiprion_ocellaris&cmtype=file&cmlimit=30&format=json`
   Sau đó lấy URL ảnh bằng `prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=1024`.
2. Chọn **3–5 ảnh rõ nhất**, ưu tiên: chụp ngang thân, thấy rõ vây và hoa văn, chụp dưới nước, không bị che.
3. Tải về `references/<id>/` ở kích thước tối đa 1024px. Thư mục `references/` phải nằm trong `.gitignore` và **không bao giờ được đưa vào bản build**.
4. Mở ảnh ra xem (đọc ảnh bằng công cụ xem hình), ghi chú các đặc điểm quan trọng vào `references/<id>/notes.md`: tỉ lệ thân, vị trí vây, số sọc/đốm, màu sắc chính xác (mã hex lấy mẫu từ ảnh).
5. **Vẽ SVG mới hoàn toàn bằng tay trong code**, dựa trên quan sát. **Cấm:** nhúng ảnh, chuyển ảnh thành SVG tự động (trace/vectorize), hay dùng ảnh làm texture.
6. Ghi tác giả, giấy phép và link mỗi ảnh đã xem vào `references/CREDITS.md`, để đội dự án kê khai nguồn tham khảo trong thuyết minh.
7. Nếu category không tồn tại hoặc ít ảnh: tìm trên Commons bằng tên khoa học, hoặc dùng category của chi/họ gần nhất. Nếu vẫn không có, vẽ theo trường `visual` và ghi vào `DECISIONS.md`.

Agent kiểm tra độc lập (mục 15.3) cũng phải đặt hình đã vẽ **cạnh ảnh tham khảo** để so sánh.

**Category Wikimedia Commons của từng loài:**

| id | Category |
|---|---|
| sa_sung | `Category:Sipunculus_nudus` |
| sua_ro | `Category:Rhopilema_esculentum` |
| ca_ngua_den | `Category:Hippocampus_kuda` |
| sam_bien | `Category:Tachypleus_tridentatus` |
| bao_ngu_chin_lo | `Category:Haliotis_diversicolor` |
| ca_heo_trang | `Category:Sousa_chinensis` |
| muc_ong | `Category:Uroteuthis_chinensis` |
| ca_duoi_bong | `Category:Hemitrygon_akajei` |
| ca_song_cham_nau | `Category:Epinephelus_coioides` |
| ca_khoang_co | `Category:Amphiprion_ocellaris` |
| sao_bien_gai | `Category:Acanthaster_planci` |
| ca_mao_tien | `Category:Pterois_volitans` |
| ca_mat_quy | `Category:Synanceia_verrucosa` |
| oc_coi_dia_ly | `Category:Conus_geographus` |
| trai_tai_tuong | `Category:Tridacna_squamosa` |
| bach_tuoc_dom_xanh | `Category:Hapalochlaena` |
| ca_map_vay_den | `Category:Carcharhinus_melanopterus` |
| rua_doi_moi | `Category:Eretmochelys_imbricata` |
| muc_nang | `Category:Sepia_pharaonis` |
| ca_vet_dau_gu | `Category:Bolbometopon_muricatum` |
| duoi_o_dom | `Category:Aetobatus_ocellatus` |
| sao_bien_goi | `Category:Protoreaster_nodosus` |
| hai_sam_den | `Category:Holothuria_atra` |
| ca_dia | `Category:Siganus_guttatus` |
| ran_bien_khoanh | `Category:Hydrophis_cyanocinctus` |
| sua_hop | `Category:Chironex_fleckeri` (chi Chironex) |
| rua_xanh | `Category:Chelonia_mydas` |
| ca_heo_irrawaddy | `Category:Orcaella_brevirostris` |
| bo_bien | `Category:Dugong_dugon` |
| muc_la | `Category:Sepioteuthis_lessoniana` |
| ca_thu_vach | `Category:Scomberomorus_commerson` |
| ca_buom_chi | `Category:Chaetodon_auriga` |
| ca_napoleon | `Category:Cheilinus_undulatus` |
| ca_ngu_vay_vang | `Category:Thunnus_albacares` |
| ca_co | `Category:Istiophorus_platypterus` |
| duoi_manta | `Category:Mobula_birostris` |
| ca_map_dau_bua | `Category:Sphyrna_lewini` |
| ca_nham_voi | `Category:Rhincodon_typus` |
| ca_den_long | `Category:Myctophidae` |
| ca_riu_bien | `Category:Sternoptychidae` |
| ca_can_cau | `Category:Melanocetus_johnsonii` |
| bo_bien_khong_lo | `Category:Bathynomus` (chi Bathynomus) |
| ca_map_sau_mang | `Category:Hexanchus_griseus` |

Nếu mạng không truy cập được Wikimedia, vẽ theo trường `visual`, ghi vào `BLOCKERS.md` và tiếp tục (đúng quy tắc mục 15.5).

---

## 8. SỔ TAY SINH VẬT (COLLECTION)

- Lưới thẻ theo vùng (tab: Bắc Bộ / Miền Trung / Miền Nam / Khơi xa / Tất cả), lọc theo tầng, độ hiếm, mức nguy hiểm, tình trạng bảo tồn.
- Loài chưa gặp: **bóng đen** + "???" + gợi ý môi trường sống ("Sống vùi trong cát ở vùng nông…").
- Thanh tiến độ % mỗi vùng, tổng số loài.

**Thẻ chi tiết sinh vật** (khi bấm vào):
- Hình minh họa lớn (animate nhẹ) + ảnh đẹp nhất người chơi đã chụp (kèm số sao).
- Tên tiếng Việt, tên khoa học (in nghiêng), tên tiếng Anh.
- Huy hiệu: Độ hiếm · Mức nguy hiểm · Tình trạng bảo tồn IUCN (bấm vào để xem giải thích bậc đó nghĩa là gì).
- Kích thước tối đa (có hình so sánh với người thợ lặn), vùng phân bố, tầng độ sâu.
- Mô tả, mục **"Bạn có biết?"**, và với loài nguy hiểm thì mục **"Vì sao nguy hiểm?"**.
- Với loài VU/EN/CR: khung **"Thông điệp bảo tồn"** màu vàng nhạt.

---

## 9. THÀNH TỰU

| Tên | Điều kiện |
|---|---|
| Cú lặn đầu tiên | Hoàn thành lượt lặn đầu |
| Nhiếp ảnh gia nhập môn | Chụp ảnh 3★ đầu tiên |
| Người bạn của hải quỳ | Ghi nhận cá khoang cổ |
| Thợ săn bóng tối | Phát hiện cá mặt quỷ bằng máy quét |
| Biết sợ là khôn | Ghi nhận đủ 6 loài "cực kỳ nguy hiểm" mà không chạm vào loài nào |
| Người giữ rạn | 10 lượt lặn liên tiếp không va vào san hô |
| Biển sạch | Nhặt tổng cộng 50 món rác |
| Hóa thạch sống | Ghi nhận sam biển |
| Gặp gỡ nàng tiên cá | Ghi nhận bò biển (dugong) |
| Khổng lồ hiền lành | Ghi nhận cá nhám voi |
| Chạm đến vực thẳm | Lần đầu xuống Tầng 3 |
| Ánh sáng trong bóng tối | Ghi nhận toàn bộ sinh vật Tầng 3 |
| Người bảo vệ | Ghi nhận toàn bộ loài VU/EN/CR |
| Nhà thám hiểm [tên vùng] | Hoàn thành 100% một vùng (4 thành tựu) |
| Sổ tay Biển Việt | Hoàn thành 100% Sổ tay |

---

## 10. MÀN HÌNH CẦN CÓ

1. **Màn hình tiêu đề**: cảnh dưới nước chuyển động làm nền, logo game, nút: Lặn ngay / Sổ tay / Nâng cấp / Nguồn & Kê khai AI.
2. **Hướng dẫn chơi** lồng vào lượt lặn đầu tiên ở miền Trung (tutorial ngắn, có thể bỏ qua).
3. **Bản đồ** (mục 6.1).
4. **Màn lặn** với HUD: oxy, độ sâu, áp suất, Điểm Xanh, số loài mới trong lượt, minimap nhỏ.
5. **Tổng kết lượt lặn**: ảnh đã chụp, loài mới, điểm.
6. **Sổ tay** + Thẻ chi tiết.
7. **Nâng cấp**.
8. **Thành tựu**.
9. **Nguồn dữ liệu & Kê khai AI**.
10. **Cài đặt**: âm lượng, chất lượng đồ họa (Thấp / Cao, tắt shader nặng cho máy yếu), xóa dữ liệu lưu.

---

## 11. DỮ LIỆU SINH VẬT

Tạo `src/data/species.json` từ dữ liệu dưới đây.

**Mã giá trị:**
- `region`: `bac_bo` | `mien_trung` | `mien_nam` | `khoi_xa`
- `tier`: 1 (0–30m) | 2 (30–200m) | 3 (>200m)
- `rarity`: `thuong_gap` | `it_gap` | `hiem` | `huyen_thoai`
- `danger`: `an_toan` | `can_than` | `nguy_hiem` | `cuc_ky_nguy_hiem`
- `iucn`: `LC` | `NT` | `VU` | `EN` | `CR` | `NE` (chưa đánh giá)
- `needsVerification: true`: dữ liệu cần đội dự án kiểm chứng thêm trước khi nộp. Code vẫn dùng bình thường.
- `sizeCm`: kích thước tối đa ước lượng (chiều dài, hoặc sải cánh với cá đuối, đường kính với sứa).

```json
[
  {
    "id": "sa_sung", "nameVi": "Sá sùng", "nameSci": "Sipunculus nudus", "nameEn": "Peanut worm",
    "region": "bac_bo", "tier": 1, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "NE",
    "sizeCm": 35, "behavior": "buried",
    "visual": "Thân hình trụ dài như xúc xích, màu hồng nhạt đến trắng ngà, bề mặt có lưới ô vuông nổi rất mảnh như vải dệt, phần đầu thu nhỏ có thể thò ra thụt vào. Khi vùi chỉ lộ một đoạn đầu khỏi cát.",
    "description": "Loài giun biển sống vùi trong cát bùn vùng triều, đặc sản nổi tiếng của Quan Lạn, Vân Đồn (Quảng Ninh).",
    "funFact": "Sá sùng phơi khô được dùng để nấu nước dùng ngọt thanh, có giá rất cao."
  },
  {
    "id": "sua_ro", "nameVi": "Sứa rô", "nameSci": "Rhopilema esculentum", "nameEn": "Flame jellyfish",
    "region": "bac_bo", "tier": 1, "rarity": "thuong_gap", "danger": "can_than", "iucn": "NE",
    "sizeCm": 50, "behavior": "drift",
    "visual": "Chuông dày hình bán cầu màu nâu đỏ đến cam trong mờ, mép chuông xẻ thùy nhỏ. Bên dưới là 8 tay miệng dày, phân nhánh xù xì như súp lơ, kèm nhiều sợi phụ dài.",
    "description": "Loài sứa lớn xuất hiện theo mùa ở ven biển miền Bắc, được ngư dân khai thác làm thực phẩm.",
    "funFact": "Sứa không có não, không có tim, cơ thể chứa khoảng 95% là nước.",
    "dangerNote": "Tế bào châm trên tay miệng có thể gây ngứa rát da."
  },
  {
    "id": "ca_ngua_den", "nameVi": "Cá ngựa đen", "nameSci": "Hippocampus kuda", "nameEn": "Spotted seahorse",
    "region": "bac_bo", "tier": 1, "rarity": "hiem", "danger": "an_toan", "iucn": "VU",
    "sizeCm": 17, "behavior": "shy",
    "visual": "Dáng đứng thẳng, đầu như đầu ngựa với mõm ống dài, mào đầu thấp. Thân có các đốt vòng xương, màu nâu đen đến vàng nâu với lấm tấm chấm sáng nhỏ. Đuôi cuộn tròn, thường quấn vào cỏ biển. Vây lưng nhỏ trong suốt.",
    "description": "Cá ngựa sống ở thảm cỏ biển và rạn đá ven bờ, bơi rất chậm bằng vây lưng nhỏ.",
    "funFact": "Ở cá ngựa, con đực mới là con mang thai: con cái đẻ trứng vào túi bụng con đực.",
    "conservation": "Bị khai thác quá mức để làm thuốc và cá cảnh. Thảm cỏ biển, nhà của cá ngựa, đang bị thu hẹp."
  },
  {
    "id": "sam_bien", "nameVi": "Sam biển", "nameSci": "Tachypleus tridentatus", "nameEn": "Tri-spine horseshoe crab",
    "region": "bac_bo", "tier": 1, "rarity": "hiem", "danger": "an_toan", "iucn": "EN",
    "sizeCm": 80, "behavior": "static",
    "visual": "Mai lớn hình móng ngựa màu nâu ô liu bóng, phần sau là mai bụng hình lục giác có gai mép, đuôi là một gai cứng dài thẳng. Hai mắt kép nhỏ trên mai. Bò chậm trên đáy cát bùn.",
    "description": "Một 'hóa thạch sống', sống ở vùng cát bùn ven biển và rừng ngập mặn. Thường đi theo cặp.",
    "funFact": "Sam đã tồn tại hơn 400 triệu năm, có máu màu xanh lam được dùng trong y học để kiểm tra độ an toàn của thuốc tiêm.",
    "conservation": "Bị bắt làm thực phẩm và mất bãi đẻ. Số lượng giảm mạnh ở khắp châu Á."
  },
  {
    "id": "bao_ngu_chin_lo", "nameVi": "Bào ngư chín lỗ", "nameSci": "Haliotis diversicolor", "nameEn": "Variously coloured abalone",
    "region": "bac_bo", "tier": 1, "rarity": "it_gap", "danger": "an_toan", "iucn": "NE",
    "sizeCm": 9, "behavior": "static",
    "visual": "Vỏ dẹt hình bầu dục như tai, mặt ngoài loang xanh rêu và nâu đỏ có gợn sóng, một hàng lỗ thở nhỏ chạy dọc mép vỏ. Mép dưới lộ chân cơ màu kem và tua viền. Bám chặt vào đá.",
    "description": "Sống bám trên đá ở vùng nước trong, có nhiều ở đảo Bạch Long Vĩ, Cô Tô.",
    "funFact": "Mặt trong vỏ bào ngư là lớp xà cừ óng ánh bảy màu, từng được dùng làm đồ khảm."
  },
  {
    "id": "ca_heo_trang", "nameVi": "Cá heo trắng Trung Hoa", "nameSci": "Sousa chinensis", "nameEn": "Indo-Pacific humpback dolphin",
    "region": "bac_bo", "tier": 1, "rarity": "huyen_thoai", "danger": "an_toan", "iucn": "VU",
    "sizeCm": 280, "behavior": "shy", "needsVerification": true,
    "visual": "Cá heo thân chắc, mõm dài thon. Con trưởng thành màu trắng hồng (hồng rõ ở bụng và vây), lốm đốm xám. Vây lưng nhỏ hình tam giác nằm trên một gờ lưng nhô cao.",
    "description": "Loài cá heo sống ven bờ, cửa sông. Rất hiếm khi được nhìn thấy ở vùng biển phía Bắc.",
    "funFact": "Cá heo con sinh ra màu xám, lớn lên chuyển dần sang hồng trắng; màu hồng là do mạch máu sát da.",
    "conservation": "Bị đe dọa bởi ô nhiễm, giao thông tàu thuyền và mắc lưới đánh cá."
  },
  {
    "id": "muc_ong", "nameVi": "Mực ống", "nameSci": "Uroteuthis chinensis", "nameEn": "Mitre squid",
    "region": "bac_bo", "tier": 2, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "NE",
    "sizeCm": 40, "behavior": "school",
    "visual": "Thân ống thon dài trong mờ, phủ dày chấm sắc tố nâu đỏ có thể co giãn đổi màu. Đuôi có hai vây hình thoi. Đầu có mắt to óng ánh và 10 tua (2 tua dài).",
    "description": "Sống theo đàn, ban đêm bị thu hút bởi ánh sáng, là nguồn hải sản quan trọng của ngư dân.",
    "funFact": "Mực đổi màu trong chớp mắt nhờ hàng nghìn tế bào sắc tố trên da và phun mực để trốn kẻ thù."
  },
  {
    "id": "ca_duoi_bong", "nameVi": "Cá đuối bồng", "nameSci": "Hemitrygon akajei", "nameEn": "Red stingray",
    "region": "bac_bo", "tier": 2, "rarity": "it_gap", "danger": "nguy_hiem", "iucn": "NT",
    "sizeCm": 100, "behavior": "buried", "needsVerification": true,
    "visual": "Thân dẹt hình đĩa gần tròn, mặt lưng nâu đến nâu đỏ, mép đĩa ngả cam. Hai mắt lồi phía trên. Đuôi dài như roi, có một gai nhọn răng cưa ở gốc đuôi.",
    "description": "Nằm vùi dưới đáy cát bùn, chỉ lộ mắt, săn giáp xác và cá nhỏ.",
    "funFact": "Cá đuối là họ hàng của cá mập: bộ xương làm bằng sụn chứ không phải xương cứng.",
    "dangerNote": "Gai đuôi có nọc, gây đau dữ dội nếu bị giẫm phải. Cá đuối chỉ dùng gai để tự vệ."
  },
  {
    "id": "ca_song_cham_nau", "nameVi": "Cá song chấm nâu", "nameSci": "Epinephelus coioides", "nameEn": "Orange-spotted grouper",
    "region": "bac_bo", "tier": 2, "rarity": "it_gap", "danger": "an_toan", "iucn": "LC",
    "sizeCm": 120, "behavior": "wander",
    "visual": "Thân to bè, miệng rộng, hàm dưới chìa ra. Nền màu nâu ô liu nhạt, phủ dày chấm nhỏ màu cam nâu; có 5 vạch tối mờ chạy dọc thân. Vây tròn, đuôi tròn.",
    "description": "Sống quanh rạn đá và hang hốc, rình mồi rồi đớp nhanh.",
    "funFact": "Cá song sinh ra đều là con cái, khi lớn một số con chuyển giới thành con đực."
  },
  {
    "id": "ca_khoang_co", "nameVi": "Cá khoang cổ (cá hề)", "nameSci": "Amphiprion ocellaris", "nameEn": "Clown anemonefish",
    "region": "mien_trung", "tier": 1, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "LC",
    "sizeCm": 11, "behavior": "wander",
    "visual": "Thân thuôn tròn nhỏ màu cam rực, ba dải trắng (sau mắt, giữa thân, gốc đuôi) viền đen mảnh. Các vây cam viền đen. Mắt tròn nâu cam. Luôn bơi quanh một cụm hải quỳ có xúc tu tím hồng đung đưa.",
    "description": "Sống cộng sinh với hải quỳ: hải quỳ bảo vệ cá, cá giữ sạch và xua kẻ thù cho hải quỳ.",
    "funFact": "Lớp nhầy trên da giúp cá hề không bị xúc tu hải quỳ chích. Con lớn nhất trong nhóm sẽ trở thành con cái."
  },
  {
    "id": "sao_bien_gai", "nameVi": "Sao biển gai", "nameSci": "Acanthaster planci", "nameEn": "Crown-of-thorns starfish",
    "region": "mien_trung", "tier": 1, "rarity": "thuong_gap", "danger": "nguy_hiem", "iucn": "NE",
    "sizeCm": 35, "behavior": "static",
    "visual": "Sao biển to có 13–20 cánh, toàn thân phủ gai nhọn dài. Màu tím xám, đỏ tía đến xanh rêu; đầu gai ngả đỏ cam. Bò chậm trên san hô và để lại vệt san hô trắng.",
    "description": "Ăn polyp san hô. Khi bùng phát số lượng có thể phá hủy cả rạn san hô.",
    "funFact": "Một con sao biển gai có thể ăn khoảng 6 m² san hô mỗi năm.",
    "dangerNote": "Gai có nọc, đâm vào da gây đau, sưng và buồn nôn."
  },
  {
    "id": "ca_mao_tien", "nameVi": "Cá mao tiên", "nameSci": "Pterois volitans", "nameEn": "Red lionfish",
    "region": "mien_trung", "tier": 1, "rarity": "it_gap", "danger": "nguy_hiem", "iucn": "LC",
    "sizeCm": 38, "behavior": "wander",
    "visual": "Thân sọc dọc đỏ nâu xen trắng kem. Vây ngực cực lớn xòe như quạt lông vũ, vây lưng là các gai dài tách rời, đều có sọc đỏ trắng. Có tua da nhỏ trên mắt. Bơi chậm, uy nghi.",
    "description": "Thợ săn rạn san hô, dùng vây xòe dồn cá nhỏ vào góc rồi đớp.",
    "funFact": "Vẻ ngoài sặc sỡ của cá mao tiên chính là lời cảnh báo: 'Đừng động vào tôi!'",
    "dangerNote": "Gai vây lưng, vây bụng và vây hậu môn có nọc độc gây đau dữ dội."
  },
  {
    "id": "ca_mat_quy", "nameVi": "Cá mặt quỷ", "nameSci": "Synanceia verrucosa", "nameEn": "Reef stonefish",
    "region": "mien_trung", "tier": 1, "rarity": "it_gap", "danger": "cuc_ky_nguy_hiem", "iucn": "LC",
    "sizeCm": 40, "behavior": "camouflage",
    "visual": "Thân thô kệch, sần sùi nhiều u bướu như hòn đá phủ rêu. Màu loang nâu xám, có mảng cam, đỏ gạch, vàng rêu. Miệng rộng hướng lên trên, mắt nhỏ nằm sâu. Khi ngụy trang gần như không phân biệt với đá.",
    "description": "Bậc thầy ngụy trang: nằm bất động giữa đá, đợi cá nhỏ bơi qua rồi đớp trong nháy mắt.",
    "funFact": "Đây là một trong những loài cá có nọc độc mạnh nhất thế giới.",
    "dangerNote": "13 gai vây lưng chứa nọc cực mạnh, giẫm phải có thể nguy hiểm đến tính mạng. Luôn mang giày khi đi trên rạn."
  },
  {
    "id": "oc_coi_dia_ly", "nameVi": "Ốc cối địa lý", "nameSci": "Conus geographus", "nameEn": "Geography cone",
    "region": "mien_trung", "tier": 1, "rarity": "it_gap", "danger": "cuc_ky_nguy_hiem", "iucn": "LC",
    "sizeCm": 15, "behavior": "static",
    "visual": "Vỏ hình nón thuôn, nền trắng hồng phủ mạng lưới hoa văn nâu đỏ như bản đồ địa hình, có những dải nâu đậm. Miệng vỏ rộng. Có ống siphon nhô ra phía trước.",
    "description": "Ốc săn cá: ban đêm rình mồi, phóng răng có nọc để làm tê liệt con mồi.",
    "funFact": "Nọc ốc cối đang được nghiên cứu để làm thuốc giảm đau mạnh.",
    "dangerNote": "Răng như kim tiêm có nọc độc, đã ghi nhận trường hợp tử vong ở người. Không bao giờ nhặt vỏ ốc hình nón còn sống."
  },
  {
    "id": "trai_tai_tuong", "nameVi": "Trai tai tượng vảy", "nameSci": "Tridacna squamosa", "nameEn": "Fluted giant clam",
    "region": "mien_trung", "tier": 1, "rarity": "hiem", "danger": "an_toan", "iucn": "NE",
    "sizeCm": 40, "behavior": "static", "needsVerification": true,
    "visual": "Vỏ hai mảnh trắng ngà, có các gờ lớn uốn lượn với những vảy xòe như diềm áo. Giữa hai mép vỏ là màng áo dày rực rỡ: hoa văn loang xanh lam, xanh lục, nâu vàng lấp lánh. Khép vỏ chậm khi bị lại gần.",
    "description": "Sống trên rạn san hô nông nhiều nắng, sống đến hàng chục năm.",
    "funFact": "Tảo cộng sinh trong màng áo quang hợp và 'nuôi' trai bằng đường, nên trai cần nắng như cây xanh.",
    "conservation": "Bị khai thác lấy thịt và vỏ. Tình trạng trên đây cần tra lại Sách Đỏ Việt Nam."
  },
  {
    "id": "bach_tuoc_dom_xanh", "nameVi": "Bạch tuộc đốm xanh", "nameSci": "Hapalochlaena sp.", "nameEn": "Blue-ringed octopus",
    "region": "mien_trung", "tier": 1, "rarity": "hiem", "danger": "cuc_ky_nguy_hiem", "iucn": "NE",
    "sizeCm": 20, "behavior": "shy", "needsVerification": true,
    "visual": "Bạch tuộc nhỏ cỡ bàn tay, nền vàng nâu. Khi bình thường các vòng mờ nhạt; khi bị đe dọa toàn thân hiện rõ hàng chục vòng tròn xanh lam ánh kim sáng rực nhấp nháy, viền đen.",
    "description": "Ẩn trong khe đá, vỏ ốc rỗng, săn cua tôm nhỏ.",
    "funFact": "Vòng xanh nhấp nháy là tín hiệu cảnh báo. Con bạch tuộc này nhỏ nhưng nọc của nó đủ làm tê liệt người lớn.",
    "dangerNote": "Nọc chứa tetrodotoxin gây liệt cơ, ngừng thở. Vết cắn thường không đau nên càng nguy hiểm."
  },
  {
    "id": "ca_map_vay_den", "nameVi": "Cá mập vây đen", "nameSci": "Carcharhinus melanopterus", "nameEn": "Blacktip reef shark",
    "region": "mien_trung", "tier": 1, "rarity": "hiem", "danger": "can_than", "iucn": "VU",
    "sizeCm": 160, "behavior": "curious",
    "visual": "Cá mập thân thon, lưng xám nâu nhạt, bụng trắng. Đầu mõm tròn ngắn. Mọi chóp vây (đặc biệt vây lưng thứ nhất) có đầu đen đậm rõ nét, ngay dưới đầu đen là dải trắng tương phản. Vệt sáng chạy dọc hông.",
    "description": "Cá mập rạn san hô, thường bơi ở vùng nước rất nông. Nhút nhát và hiếm khi gây nguy hiểm.",
    "funFact": "Cá mập phải bơi liên tục để nước đi qua mang, cung cấp oxy.",
    "dangerNote": "Hiền lành nhưng vẫn là động vật hoang dã: giữ khoảng cách, không cho ăn.",
    "conservation": "Bị đánh bắt lấy vây. Mỗi rạn san hô khỏe đều cần cá mập để giữ cân bằng sinh thái."
  },
  {
    "id": "rua_doi_moi", "nameVi": "Rùa đồi mồi", "nameSci": "Eretmochelys imbricata", "nameEn": "Hawksbill turtle",
    "region": "mien_trung", "tier": 1, "rarity": "huyen_thoai", "danger": "an_toan", "iucn": "CR",
    "sizeCm": 100, "behavior": "shy",
    "visual": "Mai hình bầu dục, các tấm vảy xếp chồng lên nhau như ngói. Hoa văn đồi mồi đặc trưng: hổ phách, nâu đỏ, vàng loang tỏa tia. Đầu hẹp với mỏ nhọn cong như mỏ chim ưng. Chân chèo có vảy viền sáng.",
    "description": "Sống quanh rạn san hô, ăn bọt biển, giúp san hô có chỗ phát triển.",
    "funFact": "Rùa biển cái quay về đúng bãi biển nơi nó được sinh ra để đẻ trứng.",
    "conservation": "Cực kỳ nguy cấp. Từng bị săn để lấy mai làm đồ mỹ nghệ. Mua bán sản phẩm từ đồi mồi là vi phạm pháp luật."
  },
  {
    "id": "muc_nang", "nameVi": "Mực nang vằn", "nameSci": "Sepia pharaonis", "nameEn": "Pharaoh cuttlefish",
    "region": "mien_trung", "tier": 2, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "NE",
    "sizeCm": 42, "behavior": "wander",
    "visual": "Thân bầu dục dẹt, vây mỏng viền quanh toàn thân gợn sóng liên tục. Hoa văn sọc vằn ngang nâu tím xen kem, có thể đổi màu nhanh với sóng màu chạy dọc thân. Mắt có đồng tử hình chữ W. 8 tay ngắn và 2 tua bắt mồi.",
    "description": "Sống gần đáy, săn tôm cá bằng cách phóng nhanh hai tua bắt mồi.",
    "funFact": "Mai mực trôi dạt vào bờ chính là xương bên trong của mực nang, giúp nó nổi chìm.",
    "dangerNote": null
  },
  {
    "id": "ca_vet_dau_gu", "nameVi": "Cá vẹt đầu gù", "nameSci": "Bolbometopon muricatum", "nameEn": "Green humphead parrotfish",
    "region": "mien_trung", "tier": 2, "rarity": "hiem", "danger": "an_toan", "iucn": "VU",
    "sizeCm": 130, "behavior": "school",
    "visual": "Cá lớn thân chắc màu xanh lục ô liu đến xanh lam xám, trán gồ cao như cái bướu thẳng đứng, mặt ngả hồng nhạt hoặc xanh nhạt. Miệng có bộ răng hợp thành mỏ như mỏ vẹt, lộ ra ngoài.",
    "description": "Đi theo đàn, dùng đầu húc và mỏ cắn vụn san hô để ăn tảo.",
    "funFact": "Mỗi con có thể nghiền san hô và thải ra hàng tấn cát trắng mỗi năm. Nhiều bãi cát trắng có công của cá vẹt.",
    "conservation": "Lớn chậm, ngủ theo đàn ở chỗ cố định nên rất dễ bị săn bắt bằng súng bắn cá ban đêm."
  },
  {
    "id": "duoi_o_dom", "nameVi": "Cá đuối ó đốm", "nameSci": "Aetobatus ocellatus", "nameEn": "Ocellated eagle ray",
    "region": "mien_trung", "tier": 2, "rarity": "hiem", "danger": "can_than", "iucn": "VU",
    "sizeCm": 300, "behavior": "wander",
    "visual": "Thân hình thoi rộng như đôi cánh, mặt lưng xanh đen đến nâu đen phủ đầy đốm trắng nhỏ (một số đốm có viền tối). Đầu nhô rõ, mõm tròn như mỏ vịt. Bụng trắng. Đuôi rất dài như roi.",
    "description": "'Bay' giữa làn nước bằng đôi vây ngực lớn, dùng mõm đào cát tìm sò ốc.",
    "funFact": "Đuối ó có thể nhảy vọt khỏi mặt nước.",
    "dangerNote": "Có gai độc ở gốc đuôi. Giữ khoảng cách.",
    "conservation": "Bị đánh bắt nhiều, sinh sản chậm (mỗi lần chỉ vài con)."
  },
  {
    "id": "sao_bien_goi", "nameVi": "Sao biển gối", "nameSci": "Protoreaster nodosus", "nameEn": "Chocolate chip sea star",
    "region": "mien_nam", "tier": 1, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "NE",
    "sizeCm": 30, "behavior": "static",
    "visual": "Năm cánh dày, mập, thân phồng như cái gối. Nền màu cam đỏ, nâu vàng hoặc kem, phủ các núm u nhọn màu đen nâu như hạt sô-cô-la xếp theo hàng trên lưng.",
    "description": "Sống trên thảm cỏ biển và cát nông, nổi tiếng ở Phú Quốc.",
    "funFact": "Sao biển không có máu. Chúng dùng nước biển để vận chuyển chất dinh dưỡng trong cơ thể.",
    "conservation": "Rất nhiều sao biển chết vì du khách nhấc khỏi nước để chụp ảnh. Hãy ngắm, đừng nhấc lên!"
  },
  {
    "id": "hai_sam_den", "nameVi": "Hải sâm đen", "nameSci": "Holothuria atra", "nameEn": "Black sea cucumber",
    "region": "mien_nam", "tier": 1, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "LC",
    "sizeCm": 60, "behavior": "static",
    "visual": "Thân hình trụ mềm màu đen tuyền, thường phủ lớp cát trắng mỏng loang lổ trên lưng tạo các đốm tròn. Đầu có vòng xúc tu nhỏ hình cánh hoa xúc cát.",
    "description": "Bò chậm trên đáy cát, nuốt cát để ăn chất hữu cơ rồi thải ra cát sạch.",
    "funFact": "Hải sâm là 'máy lọc cát' của đại dương, giúp đáy biển sạch và khỏe."
  },
  {
    "id": "ca_dia", "nameVi": "Cá dìa", "nameSci": "Siganus guttatus", "nameEn": "Orange-spotted spinefoot",
    "region": "mien_nam", "tier": 1, "rarity": "thuong_gap", "danger": "can_than", "iucn": "LC",
    "sizeCm": 42, "behavior": "school",
    "visual": "Thân dẹt hình bầu dục, màu xám bạc ánh xanh lục, phủ đầy chấm tròn màu vàng cam. Có một đốm vàng lớn ở gốc phía sau vây lưng. Miệng nhỏ như mỏ thỏ. Vây lưng có các gai nhọn.",
    "description": "Bơi theo đàn ở thảm cỏ biển, rừng ngập mặn, chuyên ăn rong tảo.",
    "funFact": "Nhờ ăn rong tảo, cá dìa giúp san hô không bị tảo phủ kín.",
    "dangerNote": "Gai vây có nọc nhẹ, chích phải gây đau buốt."
  },
  {
    "id": "ran_bien_khoanh", "nameVi": "Rắn biển khoanh", "nameSci": "Hydrophis cyanocinctus", "nameEn": "Annulated sea snake",
    "region": "mien_nam", "tier": 1, "rarity": "it_gap", "danger": "cuc_ky_nguy_hiem", "iucn": "LC",
    "sizeCm": 180, "behavior": "wander",
    "visual": "Thân rắn dài, có các khoanh đen hoặc xanh đen xen với nền xám vàng nhạt. Đuôi dẹt như mái chèo. Đầu nhỏ. Bơi uốn lượn hình chữ S, thỉnh thoảng ngoi lên mặt nước thở.",
    "description": "Sống ở vùng ven biển, cửa sông, săn cá trong hang hốc.",
    "funFact": "Rắn biển thở bằng phổi nên phải ngoi lên lấy không khí, nhưng có thể nín thở khá lâu.",
    "dangerNote": "Nọc độc rất mạnh, nhưng rắn biển hiếm khi cắn nếu không bị bắt hay dồn ép."
  },
  {
    "id": "sua_hop", "nameVi": "Sứa hộp", "nameSci": "Chironex sp.", "nameEn": "Box jellyfish",
    "region": "mien_nam", "tier": 1, "rarity": "hiem", "danger": "cuc_ky_nguy_hiem", "iucn": "NE",
    "sizeCm": 30, "behavior": "drift", "needsVerification": true,
    "visual": "Chuông hình hộp vuông gần như trong suốt hoàn toàn, chỉ thấy viền mờ ánh xanh nhạt khi nắng chiếu. Từ bốn góc chuông tỏa ra các chùm xúc tu dài mảnh như sợi chỉ. Bơi chủ động, nhanh hơn sứa thường.",
    "description": "Gần như vô hình trong nước, xuất hiện theo mùa ở vùng biển nông.",
    "funFact": "Sứa hộp có mắt thật: tổng cộng 24 con mắt quanh chuông.",
    "dangerNote": "Một trong những sinh vật biển độc nhất thế giới. Xúc tu chạm vào da gây đau dữ dội, có thể ngừng tim."
  },
  {
    "id": "rua_xanh", "nameVi": "Rùa xanh", "nameSci": "Chelonia mydas", "nameEn": "Green sea turtle",
    "region": "mien_nam", "tier": 1, "rarity": "hiem", "danger": "an_toan", "iucn": "EN",
    "sizeCm": 120, "behavior": "shy",
    "visual": "Mai hình trái tim trơn nhẵn, màu nâu ô liu với hoa văn tỏa tia vàng nâu trên từng tấm vảy. Đầu nhỏ tròn, mỏ ngắn không nhọn. Vảy đầu viền sáng màu kem. Chân chèo lớn.",
    "description": "Ăn cỏ biển và rong. Côn Đảo là bãi đẻ quan trọng nhất của rùa xanh ở Việt Nam.",
    "funFact": "Tên 'rùa xanh' đến từ lớp mỡ màu xanh lục bên trong cơ thể, do ăn nhiều cỏ biển.",
    "conservation": "Rác nhựa (túi nilon trông giống sứa), lưới đánh cá và trộm trứng là mối đe dọa lớn nhất."
  },
  {
    "id": "ca_heo_irrawaddy", "nameVi": "Cá heo Irrawaddy", "nameSci": "Orcaella brevirostris", "nameEn": "Irrawaddy dolphin",
    "region": "mien_nam", "tier": 1, "rarity": "huyen_thoai", "danger": "an_toan", "iucn": "EN",
    "sizeCm": 270, "behavior": "shy",
    "visual": "Đầu tròn trịa, trán vồng cao, không có mõm dài như cá heo thường. Thân xám xanh nhạt, bụng sáng. Vây lưng nhỏ, tròn đầu, nằm lùi về sau. Gương mặt hiền như đang mỉm cười.",
    "description": "Sống ở vùng nước lợ ven biển và cửa sông. Từng được ghi nhận ở vùng biển Kiên Giang.",
    "funFact": "Cá heo Irrawaddy có thể phun tia nước từ miệng, có lẽ để dồn cá.",
    "conservation": "Mắc lưới, ô nhiễm và mất môi trường sống khiến loài này còn rất ít."
  },
  {
    "id": "bo_bien", "nameVi": "Bò biển (Dugong)", "nameSci": "Dugong dugon", "nameEn": "Dugong",
    "region": "mien_nam", "tier": 1, "rarity": "huyen_thoai", "danger": "an_toan", "iucn": "VU",
    "sizeCm": 300, "behavior": "shy",
    "visual": "Thân to tròn như con hải cẩu lớn, da xám nâu nhẵn có vết sẹo nhạt. Đuôi dẹt hai thùy như đuôi cá voi. Mõm to cúi xuống phía dưới, có lông cứng. Mắt nhỏ hiền. Hai chân trước như mái chèo ngắn.",
    "description": "Loài thú biển ăn cỏ duy nhất, gặm cỏ biển dưới đáy. Ở Việt Nam chỉ còn rất ít cá thể quanh Phú Quốc và Côn Đảo.",
    "funFact": "Họ hàng gần nhất của dugong là… con voi! Thủy thủ xưa có thể đã nhầm dugong với nàng tiên cá.",
    "conservation": "Thảm cỏ biển bị phá và lưới đánh cá đang đẩy dugong đến bờ biến mất khỏi Việt Nam."
  },
  {
    "id": "muc_la", "nameVi": "Mực lá", "nameSci": "Sepioteuthis lessoniana", "nameEn": "Bigfin reef squid",
    "region": "mien_nam", "tier": 2, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "NE",
    "sizeCm": 38, "behavior": "school",
    "visual": "Thân trong suốt như thủy tinh ánh xanh lục, vây rộng chạy dọc gần hết chiều dài thân, gợn sóng mềm mại. Lấm tấm sắc tố nâu và các chấm ánh kim lam lục lấp lánh. Mắt to ánh xanh.",
    "description": "Bơi theo nhóm nhỏ quanh rạn và thảm cỏ biển.",
    "funFact": "Mực lá lớn rất nhanh, cả vòng đời thường chưa đến một năm."
  },
  {
    "id": "ca_thu_vach", "nameVi": "Cá thu vạch", "nameSci": "Scomberomorus commerson", "nameEn": "Narrow-barred Spanish mackerel",
    "region": "mien_nam", "tier": 2, "rarity": "it_gap", "danger": "an_toan", "iucn": "NT",
    "sizeCm": 240, "behavior": "fast_pass",
    "visual": "Thân thon dài như mũi tên, lưng xanh lam ánh kim, hông bạc sáng có nhiều vạch đứng mảnh màu xám đậm uốn lượn. Đuôi chẻ sâu hình lưỡi liềm, có hàng vây nhỏ phía sau. Miệng nhiều răng sắc.",
    "description": "Thợ săn tốc độ ở vùng nước khơi ven bờ, đuổi bắt cá cơm, cá trích.",
    "funFact": "Cá thu là một trong những loại cá được ăn nhiều nhất ở Việt Nam.",
    "conservation": "Bị khai thác quá mức. Cần đánh bắt có giới hạn và bảo vệ cá con."
  },
  {
    "id": "ca_buom_chi", "nameVi": "Cá bướm chỉ", "nameSci": "Chaetodon auriga", "nameEn": "Threadfin butterflyfish",
    "region": "khoi_xa", "tier": 1, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "LC",
    "sizeCm": 23, "behavior": "wander",
    "visual": "Thân dẹt tròn như cánh bướm, nửa trước trắng có các đường chéo xám tạo thành hình chữ V nghiêng hai hướng, nửa sau vàng tươi. Một dải đen đứng che mắt. Đốm đen nhỏ trên vây lưng và một sợi vây dài mảnh kéo ra phía sau.",
    "description": "Thường đi theo cặp, dùng mõm nhỏ nhặt thức ăn trong khe san hô.",
    "funFact": "Dải đen che mắt và đốm đen giả trên vây khiến kẻ săn mồi nhầm đầu và đuôi."
  },
  {
    "id": "ca_napoleon", "nameVi": "Cá Napoleon", "nameSci": "Cheilinus undulatus", "nameEn": "Humphead wrasse",
    "region": "khoi_xa", "tier": 1, "rarity": "hiem", "danger": "an_toan", "iucn": "EN",
    "sizeCm": 200, "behavior": "curious",
    "visual": "Cá khổng lồ có bướu trán to, môi dày. Thân xanh lam đến xanh lục, mỗi vảy có vạch tối tạo vân như lưới. Mặt có các đường vân ngoằn ngoèo màu xanh vàng tỏa ra từ mắt như hình xăm. Vây đuôi tròn.",
    "description": "Tò mò, thường bơi lại gần thợ lặn. Có thể sống khoảng 30 năm.",
    "funFact": "Napoleon là một trong số ít loài dám ăn sao biển gai và cá nóc độc, giúp bảo vệ rạn san hô.",
    "conservation": "Bị săn bắt để bán làm món ăn đắt tiền và cá cảnh. Sinh sản chậm nên rất khó phục hồi."
  },
  {
    "id": "ca_ngu_vay_vang", "nameVi": "Cá ngừ vây vàng", "nameSci": "Thunnus albacares", "nameEn": "Yellowfin tuna",
    "region": "khoi_xa", "tier": 2, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "LC",
    "sizeCm": 240, "behavior": "school",
    "visual": "Thân hình thoi khí động học. Lưng xanh lam đậm ánh kim, bụng bạc, dải vàng ánh chạy dọc hông. Vây lưng thứ hai và vây hậu môn rất dài, cong như lưỡi liềm, màu vàng tươi. Hàng vây nhỏ màu vàng viền đen gần đuôi. Đuôi chẻ hình trăng khuyết.",
    "description": "Bơi đàn lớn ở vùng biển khơi, di cư rất xa.",
    "funFact": "Cá ngừ phải bơi liên tục suốt đời để thở. Thân nhiệt của chúng ấm hơn nước xung quanh."
  },
  {
    "id": "ca_co", "nameVi": "Cá cờ", "nameSci": "Istiophorus platypterus", "nameEn": "Indo-Pacific sailfish",
    "region": "khoi_xa", "tier": 2, "rarity": "it_gap", "danger": "can_than", "iucn": "LC",
    "sizeCm": 340, "behavior": "fast_pass",
    "visual": "Thân dài thon, mỏ nhọn dài như cây kiếm. Vây lưng cực lớn như cánh buồm màu xanh lam đậm điểm chấm đen, dựng lên khi săn mồi. Lưng xanh đen, hông bạc có các sọc đứng chấm xanh nhạt.",
    "description": "Thợ săn đại dương, dựng vây buồm để dồn đàn cá mồi.",
    "funFact": "Cá cờ là một trong những loài cá bơi nhanh nhất đại dương.",
    "dangerNote": "Mỏ nhọn có thể gây thương tích khi cá phóng nhanh. Giữ khoảng cách."
  },
  {
    "id": "duoi_manta", "nameVi": "Cá đuối manta", "nameSci": "Mobula birostris", "nameEn": "Giant oceanic manta ray",
    "region": "khoi_xa", "tier": 2, "rarity": "hiem", "danger": "an_toan", "iucn": "EN",
    "sizeCm": 700, "behavior": "wander",
    "visual": "Đuối khổng lồ hình thoi rộng. Lưng đen bóng với hai mảng trắng hình chữ T ở vai. Bụng trắng có vài đốm xám. Hai vây đầu cuộn ra phía trước như sừng. Miệng rộng nằm ở trước đầu. Lượn chậm, uyển chuyển như bay.",
    "description": "Ăn sinh vật phù du, hiền lành, không có gai độc như các loài đuối khác.",
    "funFact": "Manta có bộ não lớn nhất so với cơ thể trong tất cả các loài cá.",
    "conservation": "Bị săn để lấy tấm mang. Mỗi con cái chỉ sinh một con non sau vài năm."
  },
  {
    "id": "ca_map_dau_bua", "nameVi": "Cá mập đầu búa vây vòm", "nameSci": "Sphyrna lewini", "nameEn": "Scalloped hammerhead",
    "region": "khoi_xa", "tier": 2, "rarity": "huyen_thoai", "danger": "nguy_hiem", "iucn": "CR",
    "sizeCm": 400, "behavior": "wander",
    "visual": "Đầu dẹt bè ngang hình chiếc búa, mép trước có rãnh lõm ở giữa tạo dáng gợn sóng, hai mắt ở hai đầu búa. Thân xám đồng ánh nâu, bụng trắng. Vây lưng cao nhọn hình lưỡi liềm. Hay bơi thành đàn.",
    "description": "Thường tụ đàn lớn quanh các núi ngầm ngoài khơi.",
    "funFact": "Chiếc đầu búa chứa rất nhiều cơ quan cảm nhận điện, giúp tìm mồi vùi dưới cát.",
    "dangerNote": "Hiếm khi tấn công người, nhưng là thợ săn lớn: luôn giữ khoảng cách.",
    "conservation": "Cực kỳ nguy cấp vì bị cắt vây. Số lượng đã giảm hơn 80% trong vài thập kỷ."
  },
  {
    "id": "ca_nham_voi", "nameVi": "Cá nhám voi", "nameSci": "Rhincodon typus", "nameEn": "Whale shark",
    "region": "khoi_xa", "tier": 2, "rarity": "huyen_thoai", "danger": "an_toan", "iucn": "EN",
    "sizeCm": 1800, "behavior": "wander",
    "visual": "Khổng lồ, đầu dẹt rộng, miệng ngang cực lớn ở mũi. Lưng xám xanh đậm phủ các đốm trắng và vạch ngang trắng tạo hoa văn như bàn cờ. Có các gờ chạy dọc lưng. Đuôi hình lưỡi liềm. Bơi rất chậm. Cần vẽ to hơn màn hình, có đàn cá nhỏ bơi theo dưới bụng.",
    "description": "Loài cá lớn nhất thế giới nhưng chỉ ăn sinh vật phù du và cá nhỏ, rất hiền.",
    "funFact": "Hoa văn đốm trên lưng mỗi con là duy nhất, như dấu vân tay.",
    "conservation": "Bị va chạm tàu, mắc lưới và săn bắt. Cần được bảo vệ ở mọi vùng biển."
  },
  {
    "id": "ca_den_long", "nameVi": "Cá đèn lồng", "nameSci": "Myctophidae", "nameEn": "Lanternfish",
    "region": "khoi_xa", "tier": 3, "rarity": "thuong_gap", "danger": "an_toan", "iucn": "LC",
    "sizeCm": 15, "behavior": "school",
    "visual": "Cá nhỏ thân thon, mắt rất to. Thân đen bạc ánh kim. Các hàng chấm phát sáng xanh lam (cơ quan phát quang) chạy dọc bụng và hông, nhấp nháy trong bóng tối. Bơi thành đàn lớn như dải sao.",
    "description": "Nhóm cá có số lượng đông nhất biển sâu, là thức ăn của rất nhiều loài khác.",
    "funFact": "Mỗi đêm, cá đèn lồng bơi từ vực sâu lên gần mặt nước để ăn, rồi lặn xuống lại lúc bình minh."
  },
  {
    "id": "ca_riu_bien", "nameVi": "Cá rìu biển", "nameSci": "Sternoptychidae", "nameEn": "Marine hatchetfish",
    "region": "khoi_xa", "tier": 3, "rarity": "it_gap", "danger": "an_toan", "iucn": "LC",
    "sizeCm": 12, "behavior": "deep_glow",
    "visual": "Thân cực dẹt hình lưỡi rìu, màu bạc như gương phản chiếu ánh đèn. Mắt to hình ống nhìn thẳng lên trên. Hàng cơ quan phát sáng xanh lam dọc mép bụng. Miệng hướng lên.",
    "description": "Sống ở vùng chạng vạng của đại dương, nhìn lên trên để tìm bóng con mồi.",
    "funFact": "Bụng phát sáng để xóa bóng của chính mình, nên kẻ săn từ bên dưới không thấy được nó."
  },
  {
    "id": "ca_can_cau", "nameVi": "Cá cần câu biển sâu", "nameSci": "Melanocetus johnsonii", "nameEn": "Humpback anglerfish",
    "region": "khoi_xa", "tier": 3, "rarity": "hiem", "danger": "an_toan", "iucn": "LC",
    "sizeCm": 18, "behavior": "deep_glow",
    "visual": "Thân tròn như quả bóng, màu đen nhung. Miệng khổng lồ hé mở với hàng răng nhọn dài trong suốt. Mắt rất nhỏ. Trên đầu có một 'cần câu' mảnh, đầu cần là mồi phát sáng xanh lục nhạt đung đưa. Đây là khoảnh khắc ấn tượng nhất Tầng 3.",
    "description": "Treo lơ lửng trong bóng tối, dụ mồi đến gần bằng ánh sáng.",
    "funFact": "Ánh sáng ở đầu cần câu do vi khuẩn phát quang sống cộng sinh tạo ra. Cá cần câu có thể nuốt con mồi to gần bằng mình."
  },
  {
    "id": "bo_bien_khong_lo", "nameVi": "Bọ biển khổng lồ", "nameSci": "Bathynomus jamesi", "nameEn": "Giant isopod",
    "region": "khoi_xa", "tier": 3, "rarity": "hiem", "danger": "an_toan", "iucn": "NE",
    "sizeCm": 30, "behavior": "static", "needsVerification": true,
    "visual": "Trông như con rận gỗ phóng to, thân dẹt có nhiều đốt giáp xếp chồng màu trắng ngà ánh tím xám. Đôi mắt kép to màu đen bóng phản chiếu ánh đèn. Nhiều cặp chân bò dưới bụng, hai râu dài. Bò chậm trên đáy bùn.",
    "description": "Sinh vật dọn dẹp đáy biển sâu, ăn xác sinh vật chìm xuống từ phía trên.",
    "funFact": "Bọ biển khổng lồ có thể nhịn ăn rất lâu, có con trong thủy cung nhịn ăn suốt nhiều năm."
  },
  {
    "id": "ca_map_sau_mang", "nameVi": "Cá mập sáu mang", "nameSci": "Hexanchus griseus", "nameEn": "Bluntnose sixgill shark",
    "region": "khoi_xa", "tier": 3, "rarity": "huyen_thoai", "danger": "can_than", "iucn": "NT",
    "sizeCm": 500, "behavior": "deep_glow", "needsVerification": true,
    "visual": "Cá mập lớn thân dày màu nâu xám tối, đầu dẹt mõm tròn tù. Sáu khe mang rõ ở bên đầu. Chỉ có một vây lưng nằm lùi sát về phía đuôi. Đôi mắt ánh lên màu xanh lục huỳnh quang khi gặp ánh đèn. Bơi chậm rãi, chậm rãi trồi lên từ bóng tối.",
    "description": "Loài cá mập cổ xưa sống ở biển sâu, ban đêm có thể lên vùng nông hơn.",
    "funFact": "Hầu hết cá mập có 5 khe mang. Dòng họ cá mập sáu mang đã tồn tại từ thời khủng long.",
    "dangerNote": "Không hung dữ với người, nhưng kích thước lớn: luôn giữ khoảng cách."
  }
]
```

Lưu ý cho code:
- Khi một trường `dangerNote` / `conservation` không có hoặc là `null` thì ẩn mục đó trên thẻ.
- Hiện mục "Thông điệp bảo tồn" cho mọi loài có `iucn` là `VU`, `EN` hoặc `CR`.
- Viết một bảng `iucnInfo` giải thích ngắn từng bậc IUCN bằng tiếng Việt để hiện khi người chơi bấm vào huy hiệu.

**Tổng kết dữ liệu:** 43 loài: Vịnh Bắc Bộ 9 · Miền Trung 12 · Miền Nam 10 · Khơi xa 12.

---

## 12. MÀN HÌNH "NGUỒN DỮ LIỆU & KÊ KHAI AI"

Nội dung cố định (đội dự án sẽ chỉnh lại cho đúng thực tế):

- **Nguồn dữ liệu sinh vật:** IUCN Red List (iucnredlist.org), FishBase (fishbase.se), World Register of Marine Species (marinespecies.org), Sách Đỏ Việt Nam.
- **Hình ảnh:** Toàn bộ hình minh họa sinh vật và môi trường được vẽ bằng mã (SVG/WebGL), không sử dụng ảnh chụp hay hình vẽ của bên thứ ba.
- **Kê khai sử dụng AI:** "Mã nguồn và hình minh họa của game được xây dựng với sự hỗ trợ của công cụ AI (Claude). Ý tưởng, thiết kế lối chơi, lựa chọn và kiểm chứng dữ liệu khoa học do nhóm học sinh thực hiện."
- Tên các thành viên nhóm và giáo viên hướng dẫn (để trống cho đội tự điền, đọc từ `src/data/credits.json`).

---

## 13. LỘ TRÌNH XÂY DỰNG (THEO THỨ TỰ ƯU TIÊN)

Hạn nộp vòng trường: **16:00 thứ Ba 17/11/2026**. Làm theo thứ tự sau để luôn có bản chạy được:

**Giai đoạn 1 – Nền móng**
1. Khởi tạo dự án Vite + TS + Phaser, scene Boot / Title / Dive.
2. Thợ lặn bơi có quán tính, camera theo dõi, thanh oxy, nổi lên.
3. Nền nước gradient + parallax + bong bóng + god rays.

**Giai đoạn 2 – Lõi lối chơi (chỉ vùng Miền Trung)**
4. Load `species.json`, Spawner theo vùng/tầng/độ hiếm, các behavior.
5. Hệ thống máy ảnh + chấm sao + lưu ảnh.
6. Va chạm sinh vật nguy hiểm + thẻ cảnh báo.
7. Sổ tay + Thẻ chi tiết + lưu tiến trình.

**Giai đoạn 3 – Thẩm mỹ (ưu tiên đầu tư nhiều nhất)**
8. Vẽ SVG chi tiết **12 loài miền Trung** theo mục 7.2 và trường `visual`.
9. Caustics, lọc màu theo độ sâu, đèn lặn ở Tầng 2.
10. Rạn san hô miền Trung đầy đủ, đung đưa, va chạm san hô.
11. Hiệu ứng ghi nhận loài mới, thẻ lật 3D.

**→ Bản demo nộp vòng trường: hoàn thành đến bước 11.**

**Giai đoạn 4 – Mở rộng**
12. Bản đồ Việt Nam (có Hoàng Sa, Trường Sa) + mở khóa vùng.
13. Ba vùng còn lại + 31 loài còn lại.
14. Tầng 3: tàu lặn mini, bóng tối, phát quang sinh học.
15. Nâng cấp, Điểm Xanh, rác, thành tựu, âm thanh, cài đặt, màn Nguồn & AI.

---

## 14. TIÊU CHÍ HOÀN THÀNH

- [ ] Chạy `npm run build` thành công, bản build mở được trực tiếp trên web tĩnh.
- [ ] 60 FPS ổn định trên laptop phổ thông ở chất lượng Cao; chế độ Thấp chạy được trên máy yếu.
- [ ] Không có ảnh/âm thanh từ nguồn bên ngoài; chỉ tải font Be Vietnam Pro từ Google Fonts.
- [ ] Mọi chữ hiển thị là tiếng Việt có dấu, không lỗi font.
- [ ] Mỗi loài có hình riêng, đặt cạnh nhau nhận ra ngay; không loài nào dùng chung khuôn thân.
- [ ] Tầng 2 thấy rõ hiệu ứng mất màu đỏ và màu thật hiện lại khi bật đèn.
- [ ] Bản đồ thể hiện Hoàng Sa và Trường Sa thuộc Việt Nam.
- [ ] Xóa localStorage hoặc chặn storage, game vẫn khởi động bình thường.
- [ ] Có màn hình Nguồn dữ liệu & Kê khai AI.

Sau mỗi giai đoạn, chạy game, chụp màn hình kiểm tra thẩm mỹ, tự đánh giá và sửa trước khi sang giai đoạn tiếp theo.

---

## 15. CHỈ DẪN CHO CHẾ ĐỘ ULTRACODE (CHẠY NHIỀU AGENT SONG SONG)

Dự án này được chạy với **ultracode**. Hãy tổ chức công việc thành workflow song song theo các quy tắc dưới đây để đạt chất lượng cao nhất mà không bị xung đột.

### 15.1 Nguyên tắc vàng: làm "hợp đồng" trước, chia việc sau
Trước khi tách agent song song, **agent điều phối phải tự làm tuần tự** các phần dùng chung sau:

1. Khung dự án (Giai đoạn 1 ở mục 13) build và chạy được.
2. **`src/art/contract.ts`**: interface chung mà mọi file hình sinh vật phải tuân theo, ví dụ:
   ```ts
   export interface CreatureArt {
     id: string;                       // khớp species.json
     viewBox: [number, number];
     parts: {                          // mỗi phần là chuỗi SVG, tách để animate
       body: string; pattern?: string; fins?: string[];
       tail?: string; eye: string; extras?: string[];
     };
     pivots: Record<string, [number, number]>;   // điểm xoay cho vây/đuôi
     animation: AnimationProfile;      // kiểu bơi: 'fish' | 'jelly' | 'ray' | 'cephalopod' | 'turtle' | 'static' | 'eel' | 'mammal' | 'seahorse'
     cardDetailLevel: 'hi';            // bản cho Sổ tay
   }
   ```
3. **`src/art/style-bible.ts`**: bảng màu từng vùng, độ dày nét, cách vẽ gradient đổ bóng ngược, pattern vảy dùng chung, cách vẽ mắt chuẩn, rim light. Tất cả là hàm tiện ích dùng lại được.
4. **Hai sinh vật mẫu chuẩn** do chính agent điều phối vẽ đến mức hoàn hảo: **cá khoang cổ** và **cá mao tiên**. Đây là "thước đo chất lượng" mà mọi agent vẽ khác phải đạt và đồng bộ phong cách.
5. Công cụ **xem trước hình**: script `npm run art:preview` dùng Playwright (cài làm devDependency) render từng sinh vật ra PNG và ghép thành `preview/contact-sheet.png` (lưới tất cả loài trên nền nước), để agent và người kiểm tra nhìn được kết quả.
6. `species.json` đã được nạp và kiểm tra hợp lệ (đủ 43 loài, đúng mã giá trị).

Chỉ khi 6 mục trên xong mới bắt đầu chia việc song song.

### 15.2 Các làn việc song song
| Làn | Số agent | Mỗi agent làm gì | File được phép sửa |
|---|---|---|---|
| A. Hình sinh vật | 1 agent / loài | Lấy và xem ảnh tham khảo theo mục 7.6, rồi vẽ SVG theo ảnh + trường `visual` + `style-bible`, đạt chuẩn 2 loài mẫu; chạy preview, đặt cạnh ảnh tham khảo, tự soi và sửa ít nhất 2 vòng | `src/art/species/<id>.ts` và `references/<id>/` của loài mình |
| B. Môi trường | 1 agent / vùng | Parallax, địa hình, san hô/cỏ biển/núi đá vôi theo bảng 6.3 | Chỉ `src/art/environment/<region>/*` |
| C. Hệ thống | 1 agent / hệ thống | Camera chụp ảnh, Behavior AI, Spawner, Lighting & shader, Save, Achievement | Chỉ file trong `src/systems/<tên>` |
| D. Giao diện | 1 agent / nhóm màn hình | Sổ tay + Thẻ chi tiết; Bản đồ; Nâng cấp + Thành tựu; Title + Credits | Chỉ `src/scenes/<tên>` |

- File dùng chung (`contract.ts`, `style-bible.ts`, registry `src/art/species/index.ts`, `config.ts`) **chỉ agent điều phối được sửa**. Agent làn khác cần thay đổi thì ghi đề xuất vào báo cáo.
- Mỗi agent kết thúc bằng: build không lỗi + ảnh preview phần mình làm + báo cáo ngắn.

### 15.3 Làn kiểm tra độc lập (bắt buộc)
Sau mỗi đợt, chạy **agent kiểm tra không tham gia làm** để đánh giá:
- **Thẩm mỹ:** so `contact-sheet.png` với trường `visual` của từng loài. Loài nào nhận không ra, sai hoa văn đặc trưng, lệch phong cách so với 2 loài mẫu, hoặc trông như dùng chung khuôn thân thì đánh dấu để làm lại.
- **Khoa học:** sinh vật ở đúng vùng/tầng, huy hiệu IUCN và nguy hiểm khớp dữ liệu.
- **Chơi thử tự động:** Playwright mở game, lặn ở mỗi tầng đã làm, chụp màn hình, kiểm tra không lỗi console, FPS ổn.
- **Tiêu chí mục 14.**
Loài/phần bị đánh dấu được giao lại cho một agent mới sửa, rồi kiểm tra lại.

### 15.4 Thứ tự các đợt chạy (bám hạn 17/11)
1. **Đợt 1** – Nền móng và hợp đồng (mục 15.1). Không song song.
2. **Đợt 2** – Song song: 10 loài miền Trung còn lại (làn A) + môi trường Miền Trung (làn B) + Camera, Behavior, Spawner, Lighting (làn C) + Sổ tay & Thẻ chi tiết (làn D). Sau đó kiểm tra độc lập.
3. **Đợt 3** – Đánh bóng bản demo miền Trung: sửa mọi thứ bị đánh dấu, hiệu ứng ghi nhận loài mới, âm thanh. **→ Đây là bản nộp vòng trường.**
4. **Đợt 4** – Song song: 31 loài còn lại + 3 môi trường còn lại + Tầng 3, tàu lặn mini + Bản đồ, Nâng cấp, Thành tựu, Credits. Sau đó kiểm tra độc lập.
5. **Đợt 5** – Kiểm tra toàn bộ, cân bằng độ khó, tối ưu hiệu năng, build và deploy.

### 15.5 CHẠY TỰ ĐỘNG LIÊN TỤC — KHÔNG DỪNG LẠI

**Người dùng sẽ vắng mặt (AFK) trong suốt quá trình làm. Hãy chạy liên tục từ Đợt 1 đến hết Đợt 5 mà không dừng lại chờ xác nhận hay hỏi ý kiến.**

Quy tắc khi làm việc không có người giám sát:

1. **Không hỏi, tự quyết.** Khi gặp lựa chọn chưa rõ, chọn phương án hợp lý nhất theo tinh thần bản đặc tả (ưu tiên: thẩm mỹ > đúng khoa học > nhiều tính năng). Ghi quyết định đó vào `DECISIONS.md` (ngày giờ, vấn đề, lựa chọn, lý do) để người dùng xem lại sau.
2. **Không dừng giữa các đợt.** Xong đợt nào thì tự chạy kiểm tra độc lập, sửa lỗi, rồi chuyển ngay sang đợt tiếp theo.
3. **Gặp lỗi thì tự gỡ.** Thử sửa ít nhất 3 cách khác nhau. Nếu vẫn kẹt, ghi vào `BLOCKERS.md`, tạm bỏ qua (hoặc làm phiên bản đơn giản hơn) và tiếp tục phần khác. **Không để một lỗi làm dừng cả dự án.**
4. **Luôn giữ bản chạy được.** Khởi tạo git từ đầu. Sau mỗi đợt (và sau mỗi cụm việc lớn), commit với thông điệp rõ ràng, ví dụ `Đợt 2: 12 loài miền Trung + môi trường`. Tạo tag `demo-vong-truong` khi xong Đợt 3. Nếu một thay đổi làm hỏng build, quay lại commit trước.
5. **Ưu tiên hạn nộp.** Nếu thời gian hoặc hạn mức có thể không đủ cho tất cả, phải bảo đảm Đợt 3 (bản demo miền Trung) hoàn thiện và đẹp trước tiên.
6. **Giới hạn an toàn:** chỉ làm việc trong thư mục dự án. Không tạo tài khoản, không đăng nhập dịch vụ nào, không tự deploy lên Internet. Chỉ chạy `npm run build` và để sẵn thư mục `dist/` cùng hướng dẫn deploy trong `README.md` để người dùng tự làm.
7. **Báo cáo cuối cùng.** Khi hoàn tất (hoặc khi hết khả năng làm tiếp), viết `REPORT.md` bằng tiếng Việt gồm:
   - Đã hoàn thành những gì theo từng đợt, cái gì chưa xong.
   - Đường dẫn ảnh `preview/contact-sheet.png` và ảnh chụp màn hình từng vùng/tầng.
   - Cách chạy game (`npm install`, `npm run dev`) và cách deploy.
   - Tóm tắt `DECISIONS.md` và `BLOCKERS.md`.
   - Danh sách việc đội dự án cần tự làm: kiểm chứng các loài có `needsVerification`, điền tên thành viên vào `credits.json`, chơi thử với bạn bè để lấy minh chứng.
