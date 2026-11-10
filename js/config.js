/* ==========================================================
   CẤU HÌNH — sửa nội dung ở đây, không cần đụng vào main.js
   ========================================================== */
window.HAL = {
  recipient: { full: 'Nguyễn Thúy Hà', nick: 'Hal' },
  sender: { full: 'Nguyễn Tự Kỳ Du', short: 'Kỳ Du' },
  birthday: { day: 13, month: 11, year: 2005 },

  /* Nhạc nền: đặt file mp3 vào assets/music/ đúng tên dưới đây.
     Nếu chưa có file, trang tự phát một đoạn piano dịu nhẹ thay thế. */
  music: {
    src: 'assets/music/10-ngan-nam-piano.mp3',
    title: '10 Ngàn Năm',
    sub: 'piano',
    fallbackTitle: 'Bài hát của mình',
    fallbackSub: 'piano dịu nhẹ',
    volume: 0.6
  },

  /* Ảnh kỷ niệm: đặt ảnh vào assets/photos/ (jpg/png/webp).
     Thiếu ảnh nào thì ô đó hiện khung sọc + nhãn, không bị vỡ trang. */
  photos: [
    { src: 'assets/photos/1.jpg', label: 'giải muay thái', caption: 'Ngày định mệnh ở góc sàn 🥊' },
    { src: 'assets/photos/2.jpg', label: 'buổi hẹn đầu', caption: 'Buổi hẹn đầu, anh run hơn lúc lên sàn' },
    { src: 'assets/photos/3.jpg', label: '26.12', caption: 'Chính thức là của nhau ♥' },
    { src: 'assets/photos/4.jpg', label: 'tháng 8, quay về', caption: 'Lần này nắm tay chặt hơn ♥' },
    { src: 'assets/photos/5.jpg', label: 'đi chơi', caption: 'Đi đâu cũng được, miễn là có em' },
    { src: 'assets/photos/6.jpg', label: 'selfie', caption: 'Hai đứa dở hơi nhất quả đất' }
  ],

  timeline: [
    { icon: '✦', tone: 'butter', date: 'NGÀY ĐỊNH MỆNH', title: 'Giải muay thái',
      text: 'Anh trên sàn, em ở góc giữ găng giáp.',
      story: 'Anh chuẩn bị tinh thần cho mọi cú đá của đối thủ, nhưng không ai báo trước cho anh về ánh mắt của cô gái giữ găng cả.' },
    { icon: '♥', tone: 'pink', date: '26 · 12', title: 'Chính thức là của nhau',
      text: 'Món quà Giáng sinh muộn một ngày.',
      story: 'Muộn một ngày nhưng là món quà xịn nhất anh từng nhận. Không cần gói, không cần nơ.' },
    { icon: '☁', tone: 'cloud', date: 'THÁNG 4', title: 'Một quãng lặng',
      text: 'Mình lạc nhau một chút. Trời hơi mây.', rain: true,
      story: 'Có những ngày cả hai đều mệt. Anh không giỏi nói, chỉ biết là thiếu em thì cái gì cũng nhạt.' },
    { icon: '↺', tone: 'lav', date: 'THÁNG 8', title: 'Quay về',
      text: 'Hiệp hai — lần này anh không buông.',
      story: 'Em quay lại, và anh hiểu có những người sinh ra là để về bên nhau.' },
    { icon: '✿', tone: 'today', date: '13 · 11 · HÔM NAY', title: 'Em tròn {age}',
      text: 'Và vẫn là mình.',
      story: 'Còn mười ngàn năm nữa để kể tiếp. Anh hứa sẽ kể thật dài.' }
  ],

  vouchers: [
    { main: true, title: 'Một ngày làm công chúa', text: 'Anh lo trọn: đón, ăn, xem phim, xách đồ. Không hạn sử dụng.' },
    { tone: 'butter', title: 'Ôm không giới hạn', text: 'Đổi được bất cứ lúc nào, kể cả lúc đang giận.' },
    { tone: 'lav', title: 'Thắng 1 trận cãi nhau', text: 'Anh nhận thua ngay, không cần lý do.' }
  ]
};
