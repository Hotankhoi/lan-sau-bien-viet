# Báo cáo kiểm tra độc lập – Đợt 2 (bản demo vòng trường, vùng Biển miền Trung)

- Ngày kiểm tra: 2026-11-10
- Người kiểm tra: làn kiểm tra độc lập (mục 15.3 của `MASTER_PROMPT.md`), không tham gia viết code.
- Phạm vi: 12 loài miền Trung, vòng chơi Tầng 1 + Tầng 2 miền Trung, các màn hình mục 10, tiêu chí mục 14.
- Cách làm: xem `preview/species/<id>.png`, `preview/contact-sheet.png`; chạy `tools/playtest.ts`; kịch bản Playwright riêng (đặt ngoài dự án); đọc `src/data/species.json` và chữ giao diện.
- Trạng thái báo cáo: **ĐANG VIẾT – cập nhật dần theo từng phần** (xem mục "Tiến độ" cuối file).

---

## PHẦN 1 – THẨM MỸ VÀ ĐỐI CHIẾU ẢNH THAM KHẢO

### 1.1 Nhận xét chung

- Cả 12 loài đều có dáng riêng, không loài nào dùng chung khuôn thân → đạt tiêu chí "đặt cạnh nhau nhận ra ngay" của mục 14.
- Chất lượng chung ở mức "tranh minh họa sinh học" khá tốt: có đổ bóng ngược, viền sáng lưng, mắt có chấm phản chiếu, vây bán trong.
- Không thấy khớp nối bị hở trong 4 khung động của bất kỳ loài nào (đã soi từng khung). Chỉ có 1 chỗ lộ "đường nối" nhẹ ở bạch tuộc (xem bảng).
- 4 loài dưới 8 điểm cần sửa trước vòng trường: **ốc cối địa lý (7)**, **mực nang (7)**, **cá mao tiên (7,5)**, **sao biển gai (7,5)**.
- Phong cách chưa đều: cá khoang cổ dùng viền đen dày + miệng cười (hơi hoạt hình) trong khi cá mập, rùa, cá mặt quỷ vẽ bán tả thực không viền. Nên kéo cá khoang cổ về phía bán tả thực.

### 1.2 Bảng điểm 12 loài

| # | Loài (`id`) | Điểm | Nhận ra ngay? | Khớp ảnh thật + `visual` | Khớp nối | Ghi chú ngắn |
|---|---|---|---|---|---|---|
| 1 | Cá khoang cổ `ca_khoang_co` | 8,5 | Có | 3 dải trắng viền đen đúng, dải giữa phình về trước đúng loài *A. ocellaris* | Kín | Hơi hoạt hình: viền đen dày, miệng cười; vây ngực thiếu viền đen |
| 2 | Sao biển gai `sao_bien_gai` | 7,5 | Có | 16 cánh, gai đầu cam đúng `visual` | Kín | Các cánh phía trước ngắn, mập, chúc xuống như "chân" → nhìn giống nhím/con vật có chân hơn là sao biển nằm bẹt |
| 3 | Cá mao tiên `ca_mao_tien` | 7,5 | Có | Sọc đỏ–kem, vây mềm trong có chấm đúng | Kín | Thân thon dài như điếu xì gà, đầu nhỏ; gai lưng như răng lược song song; miệng cười |
| 4 | Cá mặt quỷ `ca_mat_quy` | 8 | Có | U bướu, mảng cam/rêu, miệng hướng lên đúng | Kín | Mắt quá to và nổi (viền cam) so với "mắt nhỏ nằm sâu"; thân hơi thuôn kiểu cá thường |
| 5 | Ốc cối địa lý `oc_coi_dia_ly` | **7** | Nhận ra "ốc cối", **chưa đúng loài** | Hoa văn tam giác trắng là của ốc cối vải (*Conus textile*), không phải mạng lưới mảnh của *C. geographus* | Kín | Mắt đen tròn trên đầu râu như ốc sên hoạt hình; vỏ quá "nón", thiếu dáng phình trụ – miệng rộng |
| 6 | Trai tai tượng vảy `trai_tai_tuong` | 8,5 | Có | Gờ + vảy xòe, màng áo xanh lam/lục/nâu vàng đúng | Kín | Đẹp. Màng áo hơi tối; có thể tăng sáng 10–15% |
| 7 | Bạch tuộc đốm xanh `bach_tuoc_dom_xanh` | 8 | Có (rõ nhất ở trạng thái cảnh báo) | Trạng thái thường vòng mờ, cảnh báo vòng xanh viền đen – đúng `visual` | Kín, nhưng lớp `head` có cạnh đa giác lộ rõ | Trạng thái thường dễ lẫn bạch tuộc thường; nên giữ vòng xanh nhạt thay vì xám |
| 8 | Cá mập vây đen `ca_map_vay_den` | **9** | Có | Chóp vây đen + dải trắng, vệt sáng hông, mõm tròn ngắn – rất khớp | Kín | Tốt nhất bộ. Dải trắng dưới chóp vây lưng hơi rộng quá |
| 9 | Rùa đồi mồi `rua_doi_moi` | 8 | Có | Vảy mai tỏa tia hổ phách, mép sau răng cưa, mỏ cong – đúng | Kín | Mỏ cường điệu như mỏ vẹt; đầu + cổ quá to/dài so với mai |
| 10 | Mực nang vằn `muc_nang` | **7** | Chưa chắc – dễ nhầm mực ống | Sọc vằn và đường ánh tím gốc vây đúng ảnh | Kín | Thân quá dài (≈4:1), đồng tử chữ W thành "kính râm", chỉ thấy 4 tay cứng |
| 11 | Cá vẹt đầu gù `ca_vet_dau_gu` | 8,5 | Có | Bướu trán thẳng đứng, màu lục xám, mặt hồng nhạt – khớp | Kín | Răng vẽ như răng người có môi dày, hơi hoạt hình |
| 12 | Cá đuối ó đốm `duoi_o_dom` | 8,5 | Có | Đốm trắng, mõm mỏ vịt, đuôi roi – khớp | Kín | Nhìn từ trên xuống trong khi cả game nhìn ngang; vây bụng to như "tai thỏ" |

Điểm trung bình: **8,0/10**.

### 1.3 Loài dưới 8 điểm – sai ở đâu, sửa thế nào

#### (a) Ốc cối địa lý – `src/art/species/oc_coi_dia_ly.ts` – 7/10 – ƯU TIÊN CAO NHẤT (sai đặc điểm nhận dạng loài)

1. **Hoa văn sai loài.** Hàm `tents()` (dòng ~156) rải tam giác trắng "hình lều". Đây là hoa văn kinh điển của *Conus textile*. *Conus geographus* thật: nền trắng hồng/trắng xanh, phủ **mạng lưới đường nâu rất mảnh, mắt lưới không đều** như đường đồng mức bản đồ, cộng 2–3 dải mảng nâu sẫm loang lổ (đúng như trường `visual`: "mạng lưới hoa văn nâu đỏ như bản đồ địa hình").
   - Sửa: thay `tents()` bằng hàm vẽ lưới: các đường `stroke={NET}` dày 0,6–0,9 px, dạng tổ ong méo (dùng nhiễu theo seed để mắt lưới to nhỏ khác nhau), opacity 0,7. Giữ `bandShapes()` nhưng làm mép dải loang hơn, và giảm `whiteBlobs()` (hiện tạo cảm giác "lốm đốm trắng sắc cạnh").
2. **Dáng vỏ.** `W = 86` với `TIP_X - SHOULDER_X = 312` cho dáng nón nhọn điển hình. *C. geographus* có vỏ **mỏng, phình hình trụ, hai bên gần song song, miệng rất rộng loe về phía trước**, tháp thấp có mấu ở vai.
   - Sửa: trong `hw(t)` giữ bề rộng gần như không đổi tới t≈0,6 rồi mới thuôn; hạ tháp (`spireHw`, rút `SHOULDER_X - APEX_X` từ 68 xuống ~45); mở `apPhi` để thấy miệng vỏ rộng màu trắng hồng.
3. **Đầu như ốc sên hoạt hình.** `TENT_NEAR`/`TENT_FAR` có mắt đen tròn + chấm trắng ở chóp. Ốc cối có mắt nhỏ nằm **bên sườn râu, khoảng giữa**, không phải trên chóp.
   - Sửa: lớp `tentacleNear`, `tentacleFar` – dời chấm mắt về ~55% chiều dài râu, thu còn r≈1,2, bỏ chấm phản chiếu to.
4. **Vòi miệng (`ROSTRUM`)** vẽ như ống tròn có lỗ đỏ ("mõm lợn"). Loài này săn cá bằng **miệng giả loe rộng như cái phễu/lưới** – nên vẽ miệng phễu mỏng, mép gợn, màu trong hơn.
5. Ghi nhận trong `BLOCKERS.md` là không có ảnh con sống → nên chạy lại `npm run refs` với category có ảnh sống (ví dụ "Conus geographus (living)") trước khi sửa.

#### (b) Mực nang vằn – `src/art/species/muc_nang.ts` – 7/10

1. **Thân quá dài, giống mực ống.** `TOP_PTS`/`BOT_PTS` (dòng 64–65): thân dài 370 px, cao tối đa ~122 px (tỉ lệ ≈ 3:1, cộng đầu + tay thành ≈ 4,5:1). *Sepia pharaonis* nhìn ngang: áo bầu dục dày, tỉ lệ dài:cao ≈ 2–2,3:1.
   - Sửa: rút chiều dài áo còn ~290 px (x từ 100 → 414) hoặc tăng chiều cao (lưng lên y≈82, bụng xuống y≈232); đầu `HEAD` to tương ứng (đầu mực nang rộng gần bằng thân).
2. **Vây vẽ thành vòng bao cả lưng lẫn bụng** (`finTop0–5`, `finBot0–5`, `finBase`) → trộn góc nhìn từ trên với góc nhìn ngang. Nhìn ngang thì vây là **một dải chạy dọc sườn dưới**, phía lưng không thấy vây.
   - Sửa (ít tốn công nhất): bỏ nhóm `finTop*`, giữ `finBot*` nhưng dời lên sát đường sườn (khoảng 70% chiều cao thân) và cho cao hơn (H +30%); giữ đường ánh tím `iridLines()` ở gốc vây dưới.
3. **Mắt chữ W** (`theEye`, dòng ~182): mảng đen quá dày trên nền vàng nhạt → trông như đeo kính râm/mặt cau có. Sửa: vẽ đồng tử là **một nét cong chữ W mảnh** (dày ~15% đường kính mắt), mống mắt nâu vàng đậm hơn, mí trên che 1/3 mắt như ảnh tham khảo.
4. **Tay**: `nearArms` chỉ 4 tay hình nón cứng tách rời. Ảnh tham khảo cho thấy các tay **chụm lại thành một khối nón nhọn liền** phía trước đầu. Sửa: thêm một lớp nền "bó tay" liền khối (nối từ `HEAD` ra), 4 tay hiện tại vẽ đè lên với gốc rộng hơn (`w0` +40%), giảm chấm trắng thẳng hàng trên tay.
5. Chỉ có 1 ảnh tham khảo (vướng mắc đã ghi) → tải thêm 2–3 ảnh trước khi sửa.

#### (c) Cá mao tiên – `src/art/species/ca_mao_tien.ts` – 7,5/10

1. **Thân (`BODY`, dòng 26)** thon dài như ngư lôi, đầu nhỏ. Cá mao tiên thật: thân cao (cao ≈ 35–40% chiều dài), **đầu to chiếm ~1/3 thân**, trán dốc, miệng rộng chúc xuống.
   - Sửa: nâng lưng thêm ~25 px ở đoạn x 330–470, hạ bụng ~15 px; kéo dài đầu.
2. **Sọc (`stripes()`)** đều tăm tắp và thẳng đứng trên toàn thân. Thật: sọc rộng hẹp xen kẽ không đều, **trên đầu sọc chạy chéo/tỏa quanh mắt**. Sửa: thêm nhiễu bề rộng ±40%, nghiêng sọc vùng đầu 20–35°, một sọc đậm chạy xuyên qua mắt.
3. **Gai lưng (`dorsalSpines()`, dòng 68)**: 13 que thẳng song song cùng nghiêng về sau như răng lược. Thật: gai **tỏa hình quạt** (gai đầu gần thẳng đứng/hơi ngả trước, gai sau ngả về sau), mỗi gai có **màng mỏng hình lá cờ** phía sau.
   - Sửa: cho góc mỗi gai biến thiên từ −8° đến +35°, độ dài dạng vòm (dài nhất ở gai 4–6), thêm màng tam giác bán trong (opacity 0,45) sau mỗi gai.
4. **Vây ngực (`pectoralFan`)**: các tia là que thẳng. Nên cho tia hơi cong, có màng nối ở 1/2 gốc và đốm trắng trên màng, để ra "quạt lông vũ".
5. **Lớp `face`**: bỏ nét miệng cong hình cười, thay bằng miệng rộng trễ xuống; râu cằm giữ.

#### (d) Sao biển gai – `src/art/species/sao_bien_gai.ts` – 7,5/10

1. **Phối cảnh làm cánh trước thành "chân".** Với `K = 0.68`, `KH = 0.74` (dòng 30–31) và các cánh phía trước ngắn, dày, đầu tròn sẫm → nhìn như con vật đứng trên chùm chân. Ảnh thật: cánh **dẹt, dài, tỏa đều**, bám sát nền.
   - Sửa: giảm `KH` xuống ~0,5 (thấp hơn), tăng `K` lên ~0,8 (nhìn từ trên nhiều hơn); trong `ARMS` tăng chiều dài cánh ~25% và cho đầu cánh thuôn nhọn hơn; giảm độ dày cánh ở `renderArm` (nửa bề rộng gốc −20%).
2. **Mút cánh màu sẫm bo tròn** trông như móng. Đổi thành thuôn nhọn, cùng màu thân.
3. Gai trên cánh nên **dựng đứng** hơn (hiện nằm xiên ra hai bên như lông vũ), dày hơn một chút ở gốc.
4. Đĩa trung tâm (`disc`) hơi vồng cao (`HC = 38`); hạ xuống ~26.

### 1.4 Góp ý cho loài từ 8 điểm trở lên (không bắt buộc)

- `ca_khoang_co.ts`: giảm độ dày viền đen thân (`stroke-width` của outline) ~40%; lớp `face` bỏ nét miệng cười; lớp `pectoral` thêm viền đen mảnh ở mép.
- `ca_mat_quy.ts`: lớp `eye` thu nhỏ ~35%, bỏ viền cam, cho mí da sần che nửa trên; thân (`body`) rút ngắn cuống đuôi để ra dáng "cục đá".
- `bach_tuoc_dom_xanh.ts`: lớp `head` làm tròn đường bao (hiện là đa giác 6 cạnh thấy rõ nét gãy ở chỗ giáp `mantle`); ở trạng thái thường đổi vòng xám thành xanh lam nhạt (opacity ~0,35) để vẫn nhận ra loài khi chưa bị dọa.
- `rua_doi_moi.ts`: lớp `head` – rút mỏ ngắn ~30% và bớt cong; rút cổ ~20%.
- `ca_vet_dau_gu.ts`: lớp `face` – thay hàng răng tách từng chiếc bằng hai tấm mỏ liền (trên/dưới) màu trắng xanh, môi mỏng hơn.
- `duoi_o_dom.ts`: thu nhỏ hai vây bụng ở gốc đuôi ~40%. Cân nhắc sau vòng trường: vẽ thêm tư thế nhìn nghiêng 3/4 để khớp góc nhìn ngang của cả game.
- `ca_map_vay_den.ts`: thu hẹp dải trắng dưới chóp đen vây lưng 1 (`dorsal1`) còn một nửa.

---

## PHẦN 2 – CHƠI THỬ

*(đang làm – sẽ cập nhật)*

## PHẦN 3 – KHOA HỌC

*(chưa làm)*

## PHẦN 4 – TIÊU CHÍ MỤC 14 VÀ MÀN HÌNH MỤC 10

*(chưa làm)*

---

## Tiến độ

- [x] Phần 1 – Thẩm mỹ
- [ ] Phần 2 – Chơi thử
- [ ] Phần 3 – Khoa học
- [ ] Phần 4 – Tiêu chí
