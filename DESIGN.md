# DESIGN · "Mười Ngàn Năm"

Một bộ phim ngắn tương tác: bầu trời đi từ đêm sao sang bình minh trong lúc Hal đọc thư.
Ý lấy thẳng từ nội dung gốc: "Từ một đêm đầy sao… sang một ngày thật ấm" và "Mười ngàn năm nữa, anh vẫn chọn em".

## Nguyên tắc

1. **Bầu trời là nhân vật chính.** Một canvas WebGL duy nhất chạy suốt; mọi thứ khác (chữ, giấy, polaroid) nằm yên trên đó. Sự táo bạo dồn vào bầu trời, phần còn lại giữ tĩnh.
2. **Mỗi cảnh một ý.** Không trang trí thừa, không emoji làm đồ trang trí (emoji chỉ còn trong lời văn của người viết).
3. **Chuyển động có lý do.** Vào bằng `expo.out`/`power4`, tương tác bằng spring, không có gì linear trừ parallax bám cuộn.
4. **Hỏng đâu thì lùi đó, không vỡ.** Thiếu ảnh, thiếu nhạc, không WebGL, máy yếu, giảm chuyển động: đều có đường lùi.

## Tokens (`css/tokens.css`)

| Nhóm | Token | Giá trị | Dùng cho |
|---|---|---|---|
| Màu | `--night-deep` / `--night` | `#060914` / `#0B1026` | nền đêm |
| | `--dusk` | `#3A2E5C` | lớp chuyển, khung ảnh chờ |
| | `--gold` | `#F4D58D` | sao, đường nối, nút, tên |
| | `--peach` | `#FFB89A` | hơi ấm bình minh, highlight trong thư |
| | `--milk` | `#FBF3E7` | chữ trên trời, giấy |
| | `--ink` | `#2A2440` | chữ trên giấy |
| | `--rose` | `#E8909C` | dấu "đã nhận" |
| Chữ | `--f-display` | Cormorant Garamond (nghiêng) | tiêu đề, lá thư |
| | `--f-body` | Be Vietnam Pro | thân bài, nút, nhãn |
| | `--f-hand` | Dancing Script | chỉ chữ ký và caption polaroid |
| Cỡ chữ | `--t-xs … --t-hero` | 13px → `clamp(5.2rem, 30vw, 15rem)` | thang cỡ, phần lớn dùng `clamp()` |
| Khoảng cách | `--s1 … --s9` | 4 → 112px | nhịp 4px |
| Thời lượng | `--d-fast/base/slow/epic` | .25 / .6 / 1.2 / 2.4s | phản hồi / vào cảnh / chuyển cảnh / khoảnh khắc lớn |
| Easing | `--e-out` | `cubic-bezier(.16,1,.3,1)` | xuất hiện |
| | `--e-inout` | `cubic-bezier(.76,0,.24,1)` | chuyển cảnh |
| | `--e-spring` | `cubic-bezier(.34,1.56,.64,1)` | tương tác |

Trong JS các giá trị tương ứng nằm ở `HB.M` (`js/core.js`).
Cả ba font đều có subset `vietnamese` trên Google Fonts; đã kiểm tra hiển thị dấu ở mọi cảnh.

## Storyboard

| # | Cảnh | Module | Điều xảy ra | Độ nặng |
|---|---|---|---|---|
| 0 | Preloader | `scenes/gate.js` | Chòm sao "Hal" nối dần theo tiến độ tải thật, phần trăm số lăn | nhẹ |
| 1 | Mở màn | `scenes/gate.js` + `sky.js` | Chạm → mở khoá âm thanh, chòm sao vỡ thành bụi sao, camera "warp", sắc sai, confetti | **nặng** (ngắn) |
| 2 | Lời chào | `scenes/hello.js` | "Happy Birthday" bung từng ký tự 3D (SplitText), tên được gõ ra, nghiêng theo con trỏ/con quay | nhẹ |
| 3 | Chuyện của mình | `scenes/story.js` | Cảnh ghim: 5 mốc là 5 ngôi sao, đường nối vẽ bằng DrawSVG, mây tháng 4 | nhẹ |
| 4 | Ký ức | `scenes/memories.js` | Cảnh ghim: polaroid bay từ xa tới (CSS 3D), caption gõ chữ, lightbox | vừa |
| 5 | Bánh kem & điều ước | `scenes/cake.js` + `cake3d.js` | Bánh 3D hai tầng (kem chảy, dâu, cốm màu, nến sọc, tim vàng), lửa shader, thổi micro / chạm-giữ, khói, pháo hoa, điều ước thành sao băng | **nặng** |
| 6 | Lá thư | `scenes/letter.js` | Giấy có vân, từng dòng hiện như mực thấm, nhạc dịu lại | vừa (blur) |
| 7 | Món quà | `scenes/gift.js` + `bouquet.js` | Sao băng tụ lại, bó hoa SVG nở từng cánh (28 bông, 8 loài), hào quang, cánh hoa rơi, bướm, lấp lánh, pháo hoa; chạm bông nào bông đó tung cánh | vừa |
| 8 | Kết | `scenes/ending.js` | Chữ ký, bộ đếm số ngày hai đứa đã bên nhau (từ `together` trong config), camera lùi, bụi sao thành tim → "Hal" → tuổi → tim; easter egg chạm tim 5 lần | **nặng** |

Lớp tinh tế (`ui.js`): con trỏ quán tính + vệt sao (desktop), chạm nở tim (cảm ứng), nút từ tính, âm UI, nút tắt tiếng luôn hiện, grain + vignette.

## Chất lượng thích ứng

- Ba bậc `low / mid / high` (`js/core.js`): đoán ban đầu theo thiết bị, rồi `sky.js` đo FPS thật 2 giây đầu và mỗi 3 giây sau đó, tụt thì hạ một bậc (giảm DPR, số sao, số bụi, số octave nhiễu, tắt pass sắc sai).
- Không có WebGL: nền gradient CSS, bánh SVG, trái tim chữ, pháo hoa bằng confetti.
- `prefers-reduced-motion`: không ghim cuộn, không Lenis, dòng thời gian và ảnh thành danh sách tĩnh, mọi hiệu ứng thành hiện ngay.
- Ép bậc để thử: thêm `?q=low|mid|high`, `?rm=1`, `?nowebgl=1` vào URL.
