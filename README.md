# Thư sinh nhật Hal · "Mười Ngàn Năm"

Thiệp sinh nhật tương tác: một bầu trời đi từ đêm sao sang bình minh, 8 cảnh, khoảng 2–3 phút.
HTML/CSS/JS thuần, không cần build. Thư viện tải qua CDN (GSAP 3.13, Three.js r149, Lenis, canvas-confetti) nên **cần có mạng** khi mở.

## Chạy local

```
npx serve .
```

rồi mở địa chỉ được in ra. Mở thẳng `index.html` cũng chạy, nhưng micro (thổi nến) cần `http://localhost` hoặc `https://`.

Thử các chế độ bằng tham số URL: `?q=low` / `?q=mid` / `?q=high` (ép bậc chất lượng), `?rm=1` (giảm chuyển động), `?nowebgl=1` (không WebGL).

## Đưa lên mạng

- **GitHub Pages:** push repo → Settings → Pages → Source: `main`, thư mục `/ (root)`.
- **Vercel:** Import repo, Framework Preset chọn "Other", không cần lệnh build.
- **Netlify Drop:** kéo cả thư mục vào https://app.netlify.com/drop.

Phải là `https://` thì "Thổi thật vào micro" mới xin được quyền; không có thì trang tự dùng "Chạm và giữ để thổi".

## Thay nội dung

| Muốn thay | Ở đâu |
|---|---|
| Ảnh | Bỏ file vào `assets/photos/` với tên `1.jpg` … `6.jpg` (vuông, ~1000px, <300KB; đổi tên/đuôi `.webp` trong `js/config.js` → `photos`). Thiếu ảnh thì hiện khung trời sao có nhãn. Ảnh 1 và 4 còn dùng cho hai polaroid nhỏ cạnh lá thư (desktop). |
| Nhạc | Bỏ file vào `assets/music/10-ngan-nam-piano.mp3` (đổi tên/tiêu đề trong `config.js` → `music`). Thiếu file thì trang phát piano tổng hợp. |
| Lá thư | Sửa trực tiếp trong `index.html`, phần `CẢNH 6`. |
| Tên, ngày sinh, dòng thời gian, voucher, chữ ô điều ước, câu bí mật | `js/config.js`. Tuổi và năm tự tính từ ngày sinh. |
| Màu, font, nhịp chuyển động | `css/tokens.css` (xem `DESIGN.md`). |

## Cấu trúc

```
index.html
css/tokens.css        design tokens
css/style.css         toàn bộ giao diện
js/config.js          nội dung
js/core.js            tiện ích, bậc chất lượng
js/audio.js           nhạc nền + SFX tổng hợp
js/sky.js             bầu trời WebGL: nền, sao, bụi sao biến hình, sao băng, pháo hoa
js/cake3d.js          bánh kem 3D
js/ui.js              con trỏ, nút từ tính, nút âm thanh
js/scenes/*.js        mỗi cảnh một file
js/main.js            khởi động, cuộn mượt, "Đọc lại từ đầu"
assets/music, assets/photos
```

## Ghi chú

- Điều ước người xem nhập chỉ hiện trên máy họ, không được lưu hay gửi đi đâu.
- Khi thiếu ảnh/nhạc, trình duyệt ghi lỗi 404 của các file đó trong console; bỏ đủ file vào là hết.
- Thư mục `vendor/` là của bản cũ, trang hiện không dùng nữa, có thể xoá.
