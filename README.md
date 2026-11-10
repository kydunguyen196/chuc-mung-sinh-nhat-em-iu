# Thư sinh nhật Hal 💌

Landing page dạng "mở một bức thư", code từ bản vẽ `Giao diện NCC trá hình/Thư Sinh Nhật Hal.dc.html`.
Không cần build: HTML + CSS + JS thuần, thư viện (GSAP, ScrollTrigger, canvas-confetti) đã nằm sẵn trong `vendor/`.

## 1. Thêm nhạc "10 Ngàn Năm" (piano)
Đặt file mp3 vào đúng đường dẫn:

```
assets/music/10-ngan-nam-piano.mp3
```

- Đổi tên/tiêu đề trong `js/config.js` → `music`.
- Chưa có file thì trang tự phát một đoạn piano nhẹ do Web Audio tạo ra, để không bị im lặng.
- Nhạc bật khi Hal chạm "Chạm để mở thư" (trình duyệt chỉ cho phát nhạc sau một lần chạm).

## 2. Thêm ảnh kỷ niệm
Đặt ảnh vào `assets/photos/` với tên `1.jpg` … `6.jpg` (nên là ảnh vuông, khoảng 1000px, dưới 300KB).
Caption và tên file sửa trong `js/config.js` → `photos`. Ảnh nào thiếu thì hiện khung sọc + nhãn, trang không bị vỡ.
Ảnh số 1 và số 4 cũng được dùng làm 2 polaroid trang trí cạnh bức thư (bản desktop).

## 3. Sửa nội dung
- Thư: sửa trực tiếp trong `index.html`, phần `CẢNH 4`.
- Dòng thời gian, voucher, tên: sửa trong `js/config.js`.
- Tuổi và năm tự tính từ ngày sinh 13/11/2005.

## 4. Chạy thử
Mở thẳng `index.html` bằng Chrome là chạy được. Nếu muốn sóng nhạc nhảy theo đúng beat của file mp3, chạy qua server:

```
npx serve .
```

## 5. Đưa lên mạng để gửi link
Kéo cả thư mục `thu-sinh-nhat-hal` vào https://app.netlify.com/drop (miễn phí, có link ngay), hoặc dùng GitHub Pages / Vercel.

## Cấu trúc
```
index.html        8 cảnh
css/style.css     style, 3D, keyframes, responsive, reduced-motion
js/config.js      nội dung có thể sửa
js/main.js        hiệu ứng: phong bì 3D, sao, confetti, bánh kem, thư, polaroid, carousel, timeline, hộp quà, pháo hoa, nhạc
vendor/           gsap 3.12.5, ScrollTrigger, canvas-confetti 1.9.3
assets/           music/, photos/
```
