/* ==========================================================
   CẤU HÌNH — sửa nội dung ở đây, không cần đụng vào các file khác
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

  /* Ảnh kỷ niệm: đặt ảnh vào assets/photos/ (jpg/png/webp, cạnh dài ~1280px, <300KB), thêm bớt bao nhiêu tấm cũng được.
     Khung ảnh hình vuông: pos là điểm giữ lại khi cắt (ngang dọc, giống object-position).
     Thiếu ảnh nào thì ô đó hiện khung trời sao + nhãn, không bị vỡ trang. */
  photos: [
    { src: 'assets/photos/01.jpg', pos: '50% 56%', label: 'cả hội', caption: 'Hồi mình còn đứng lẫn giữa cả hội' },
    { src: 'assets/photos/02.jpg', pos: '55% 100%', label: 'ngày bảo vệ đồ án', caption: 'Ngày anh bảo vệ đồ án, có iu đứng cạnh' },
    { src: 'assets/photos/03.jpg', pos: '50% 20%', label: 'nặn gốm', caption: 'Đi nặn gốm, tay lấm lem mà vui' },
    { src: 'assets/photos/04.jpg', pos: '66% 50%', label: 'đi ăn', caption: 'Ăn gì cũng ngon, miễn là ngồi cạnh iu' },
    { src: 'assets/photos/05.jpg', pos: '50% 26%', label: 'selfie', caption: 'Iu lúc nào cũng phải giơ tay chữ V' },
    { src: 'assets/photos/06.jpg', pos: '50% 24%', label: 'soi gương', caption: 'Hai đứa một cây đen ♥' },
    { src: 'assets/photos/07.jpg', pos: '50% 78%', label: 'góc dìm hàng', caption: 'Góc chụp dìm hàng của hai đứa' },
    { src: 'assets/photos/08.jpg', pos: '24% 50%', label: 'dạo đêm', caption: 'Chở iu dạo đêm Hà Nội' },
    { src: 'assets/photos/09.jpg', pos: '46% 50%', label: 'photobooth', caption: 'Chạm mũi một cái ♥' },
    { src: 'assets/photos/10.jpg', pos: '50% 40%', label: 'ảnh studio', caption: 'Ôm iu thật chặt' },
    { src: 'assets/photos/11.jpg', pos: '50% 38%', label: 'hai đứa tí hon', caption: 'Phiên bản tí hon của hai đứa' },
    { src: 'assets/photos/12.jpg', pos: '50% 48%', label: 'sân bay', caption: 'Ở sân bay, trước lúc xa nhau' },
    { src: 'assets/photos/13.jpg', pos: '50% 52%', label: 'tạm xa', caption: 'Xa nhau một chút thôi, rồi mình lại gặp' }
  ],

  /* Mỗi mốc là một ngôi sao trong chòm sao "Chuyện của mình".
     cloud: true → có mây trôi qua ngôi sao đó. {age} được thay bằng số tuổi. */
  timeline: [
    { tone: 'gold', date: 'NGÀY ĐỊNH MỆNH', title: 'Giải muay thái',
      text: 'Anh trên sàn, em ở góc giữ găng giáp.',
      story: 'Anh chuẩn bị tinh thần cho mọi cú đá của đối thủ, nhưng không ai báo trước cho anh về ánh mắt của cô gái giữ găng cả.' },
    { tone: 'peach', date: '26 · 12', title: 'Chính thức là của nhau',
      text: 'Món quà Giáng sinh muộn một ngày.',
      story: 'Muộn một ngày nhưng là món quà xịn nhất anh từng nhận. Không cần gói, không cần nơ.' },
    { tone: 'cloud', date: 'THÁNG 4', title: 'Một quãng lặng',
      text: 'Mình lạc nhau một chút. Trời hơi mây.', cloud: true,
      story: 'Có những ngày cả hai đều mệt. Anh không giỏi nói, chỉ biết là thiếu em thì cái gì cũng nhạt.' },
    { tone: 'peach', date: 'THÁNG 8', title: 'Quay về',
      text: 'Hiệp hai — lần này anh không buông.',
      story: 'Em quay lại, và anh hiểu có những người sinh ra là để về bên nhau.' },
    { tone: 'gold', date: '13 · 11 · HÔM NAY', title: 'Em tròn {age}',
      text: 'Và vẫn là mình.',
      story: 'Còn mười ngàn năm nữa để kể tiếp. Anh hứa sẽ kể thật dài.' }
  ],

  /* Món quà: bó hoa (vẽ bằng code trong js/bouquet.js), ở đây chỉ có lời. */
  bouquet: {
    wait: 'Có một thứ rực rỡ đang chờ em',
    title: ['Một bó hoa cho em,', 'rực rỡ như chính em vậy'],
    note: 'Chạm vào từng bông hoa thử xem ♥'
  },

  /* Điều ước: chỉ hiện trên máy người xem, không gửi đi đâu cả. */
  wish: {
    label: 'Điều ước của em',
    placeholder: 'Viết một điều ước…',
    send: 'Gửi lên trời',
    note: 'Chỉ mình em biết thôi, điều ước không gửi đi đâu cả.',
    done: 'Điều ước đã bay lên trời rồi ✦'
  },

  /* Easter egg: chạm 5 lần vào trái tim ở cảnh kết. */
  secret: 'Bí mật nè: trận đó anh thua em từ hiệp một rồi.'
};
