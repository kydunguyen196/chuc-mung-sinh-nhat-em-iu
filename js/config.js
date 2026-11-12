/* ==========================================================
   CẤU HÌNH — sửa nội dung ở đây, không cần đụng vào các file khác
   ========================================================== */
window.HAL = {
  recipient: { full: 'Nguyễn Thúy Hà', nick: 'Hal' },
  sender: { full: 'Nguyễn Tự Kỳ Du', short: 'Kỳ Du' },
  birthday: { day: 13, month: 11, year: 2006 },
  /* Ngày chính thức yêu nhau: cảnh kết đếm số ngày từ hôm đó tới hôm nay (theo giờ máy người xem). */
  together: { day: 26, month: 12, year: 2025 },

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
    { src: 'assets/photos/01.jpg', pos: '50% 56%', label: 'ngày bắt đầu', caption: 'Ảnh này là ngày bắt đầu chuyện tình iu của hai đứa mình, mà trông iu chẳng vui gì cả' },
    { src: 'assets/photos/02.jpg', pos: '55% 100%', label: 'ngày bảo vệ đồ án', caption: 'Ngày anh đi bảo vệ đồ án, anh bất ngờ lắm khi thấy em xuất hiện. Trước mặt mọi người thì ngại, nhưng anh rất muốn chụp với em, hihi chụp được rùi' },
    { src: 'assets/photos/03.jpg', pos: '50% 20%', label: 'chuyến đi xa đầu tiên', caption: 'Chuyến đi chơi xa đầu tiên của hai đứa mình, đi vầy đất có sản phẩm đem về :>' },
    { src: 'assets/photos/10.jpg', pos: '50% 40%', label: 'photobooth đầu tiên', caption: 'Tấm ảnh photobooth đầu tiên của hai đứa mình nè, hồi ý tóc em ngắn mà hai đứa còn ngượng' },
    { src: 'assets/photos/11.jpg', pos: '50% 38%', label: 'phiên bản mini', caption: 'Phiên bản mini của hai đứa nha' },
    { src: 'assets/photos/07.jpg', pos: '50% 78%', label: 'sau khi gặp lại', caption: 'Lần đi chơi sau khoảng thời gian gặp lại. Anh chụp xấu vì ít khi hai đứa chụp với nhau, anh muốn có thật nhiều ảnh với em, cũng hơi run' },
    { src: 'assets/photos/04.jpg', pos: '66% 50%', label: 'nhiều ảnh hơn', caption: 'Sau đấy thì mình bắt đầu có nhiều ảnh chụp với nhau hơn rồi nè' },
    { src: 'assets/photos/05.jpg', pos: '50% 26%', label: 'không cần make', caption: 'Hì, không cần make iu vẫn lun là người xinh nhấttt' },
    { src: 'assets/photos/08.jpg', pos: '24% 50%', label: 'đi bão', caption: 'Ngày kỉ niệm, anh đòi đi bão thì được iu chiều đồng ý. Lần đầu anh được đi bão riêng với gái hehe, sau này kể cho con cháu: ngày xưa ông bà cháy lắm' },
    { src: 'assets/photos/06.jpg', pos: '50% 24%', label: 'quay trở lại', caption: 'Ngày mình chính thức quay trở lại với nhau nè. Cảm ơn iu vì đã tha thứ cho anh ạ' },
    { src: 'assets/photos/09.jpg', pos: '46% 50%', label: 'photobooth lần hai', caption: 'Photobooth lần này tóc iu dài hơn rùiiii' },
    { src: 'assets/photos/12.jpg', pos: '50% 48%', label: 'selfie gần nhất', caption: 'Bức ảnh selfie gần nhất của hai đứa' },
    { src: 'assets/photos/13.jpg', pos: '50% 52%', label: 'iu đi học xa', caption: 'Iu đi học xa nhớ giữ gìn sức khoẻ nha. Mình xa nhau một xíu, nhưng vẫn luôn về với nhau nhen' }
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
      text: 'Áp lực công việc, anh lại im lặng.', cloud: true,
      story: 'Anh đi làm, áp lực công việc đè nén mà anh lại không chia sẻ với em. Hai đứa gặp rào cản, đáng lẽ phải giải quyết vấn đề thì anh lại chọn giải quyết nhau.' },
    { tone: 'peach', date: 'THÁNG 8', title: 'Quay về',
      text: 'Hiệp hai, lần này anh chiến đấu hết mình.',
      story: 'Mình gặp lại nhau, trong lòng vẫn còn có nhau, nhưng cũng đã bỏ lỡ nhiều ngày tháng. Được em chấp nhận và tha thứ, hai đứa mình quay trở lại với nhau.' },
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
