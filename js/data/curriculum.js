/**
 * ============================================================================
 * MODULE 1: CURRICULUM DATA (當代中文課程 1 — 100% 繁體中文)
 * Includes Vocabulary (with Sino-Vietnamese & Radical Etymology), Grammar,
 * Sentences, Roleplay, Error Detective, and Tone Sandhi / Pinyin Analyzer.
 * ============================================================================
 */
window.CurriculumDB = (function () {
  "use strict";

  const LESSONS_META = [
    {
      id: 1,
      titleZh: "第一課：歡迎你來臺灣！",
      titleVi: "Bài 1: Chào mừng bạn đến Đài Loan!",
      goal: "Chào hỏi, hỏi quý danh, quốc tịch và đồ uống yêu thích (Trà Ô Long, Trà sữa trân châu).",
      part1Topic: "Nửa đầu (P.1): Hỏi họ tên & Quốc tịch (請問、貴姓、哪國人)",
      part2Topic: "Nửa sau (P.2): Đồ uống Đài Loan & Câu hỏi 嗎 / 呢 (喜歡、喝茶、珍珠奶茶)"
    },
    {
      id: 2,
      titleZh: "第二課：我的家人",
      titleVi: "Bài 2: Gia đình của tôi",
      goal: "Giới thiệu thành viên gia đình, nghề nghiệp, lượng từ 張 / 個 và sở hữu Có/Không có (有 / 沒有).",
      part1Topic: "Nửa đầu (P.1): Thành viên gia đình & Lượng từ (這張照片、兩個人)",
      part2Topic: "Nửa sau (P.2): Nghề nghiệp & Phó từ 都 (老師、醫生、大學生)"
    },
    {
      id: 3,
      titleZh: "第三課：週末做什麼？",
      titleVi: "Bài 3: Cuối tuần làm gì?",
      goal: "Lên kế hoạch cuối tuần, thể thao, giải trí, mời ăn tối và cấu trúc thời gian.",
      part1Topic: "Nửa đầu (P.1): Hoạt động cuối tuần & Thể thao (打網球、看電影、聽音樂)",
      part2Topic: "Nửa sau (P.2): Ăn uống, mời mọc & Rủ rê (請客、臺灣菜、一起去吧)"
    },
    {
      id: 4,
      titleZh: "第四課：請問一共多少錢？",
      titleVi: "Bài 4: Thời tiết bốn mùa & Mua sắm",
      goal: "Miêu tả thời tiết bốn mùa, cảm nhận 覺得, so sánh 沒有...那麼... và hỏi giá tiền.",
      part1Topic: "Nửa đầu (P.1): Thời tiết bốn mùa & So sánh (春天、夏天、覺得、舒服)",
      part2Topic: "Nửa sau (P.2): Mua sắm, giá tiền & Số lượng (多少錢、太貴了、手機)"
    }
  ];

  const SCENE_SVGS = {
    greeting: `<svg viewBox="0 0 240 100" width="210" height="90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="100" rx="14" fill="hsl(36,35%,94%)"/>
      <circle cx="195" cy="26" r="13" fill="hsl(12,78%,62%)" opacity="0.25"/>
      <path d="M115 18L122 34H108L115 18Z" fill="hsl(8,72%,48%)"/>
      <rect x="109" y="34" width="12" height="46" rx="2" fill="hsl(200,32%,36%)"/>
      <circle cx="72" cy="44" r="13" fill="hsl(24,55%,45%)"/>
      <rect x="56" y="60" width="32" height="26" rx="8" fill="hsl(8,72%,50%)"/>
      <circle cx="164" cy="44" r="13" fill="hsl(220,30%,32%)"/>
      <rect x="148" y="60" width="32" height="26" rx="8" fill="hsl(160,55%,36%)"/>
      <rect x="86" y="14" width="68" height="20" rx="6" fill="#fff" stroke="hsl(34,20%,82%)"/>
      <text x="120" y="28" text-anchor="middle" font-size="11" font-weight="700" fill="hsl(8,72%,42%)">你好！請問貴姓？</text>
    </svg>`,
    tea: `<svg viewBox="0 0 240 100" width="210" height="90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="100" rx="14" fill="hsl(36,35%,94%)"/>
      <rect x="64" y="38" width="44" height="44" rx="10" fill="hsl(158,48%,38%)"/>
      <path d="M108 48H118C122 48 122 68 118 68H108" stroke="hsl(158,48%,38%)" stroke-width="5"/>
      <path d="M78 28C78 20 84 20 84 14M92 28C92 20 98 20 98 14" stroke="hsl(34,60%,55%)" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="138" y="30" width="38" height="52" rx="8" fill="hsl(32,72%,72%)" stroke="hsl(28,45%,42%)" stroke-width="2"/>
      <line x1="157" y1="14" x2="157" y2="38" stroke="hsl(8,72%,48%)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="148" cy="72" r="3.5" fill="hsl(24,45%,22%)"/><circle cx="158" cy="74" r="3.5" fill="hsl(24,45%,22%)"/><circle cx="166" cy="71" r="3.5" fill="hsl(24,45%,22%)"/>
    </svg>`,
    family: `<svg viewBox="0 0 240 100" width="210" height="90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="100" rx="14" fill="hsl(36,35%,94%)"/>
      <rect x="42" y="14" width="156" height="72" rx="10" fill="#fff" stroke="hsl(32,35%,70%)" stroke-width="3"/>
      <circle cx="80" cy="44" r="10" fill="hsl(212,45%,42%)"/><rect x="67" y="57" width="26" height="20" rx="6" fill="hsl(212,45%,42%)"/>
      <circle cx="120" cy="44" r="10" fill="hsl(8,68%,52%)"/><rect x="107" y="57" width="26" height="20" rx="6" fill="hsl(8,68%,52%)"/>
      <circle cx="160" cy="48" r="8.5" fill="hsl(158,52%,38%)"/><rect x="149" y="59" width="22" height="18" rx="6" fill="hsl(158,52%,38%)"/>
    </svg>`,
    weekend: `<svg viewBox="0 0 240 100" width="210" height="90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="100" rx="14" fill="hsl(36,35%,94%)"/>
      <circle cx="85" cy="50" r="22" stroke="hsl(8,72%,48%)" stroke-width="3.5" fill="hsl(38,40%,98%)"/>
      <line x1="69" y1="35" x2="101" y2="65" stroke="hsl(34,20%,75%)" stroke-width="1.5"/>
      <line x1="101" y1="35" x2="69" y2="65" stroke="hsl(34,20%,75%)" stroke-width="1.5"/>
      <circle cx="145" cy="56" r="12" fill="hsl(158,62%,42%)"/>
      <path d="M136 49C142 54 142 58 136 63M154 49C148 54 148 58 154 63" stroke="#fff" stroke-width="2"/>
    </svg>`,
    seasons: `<svg viewBox="0 0 240 100" width="210" height="90" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="100" rx="14" fill="hsl(36,35%,94%)"/>
      <circle cx="76" cy="42" r="16" fill="hsl(34,90%,54%)"/>
      <path d="M135 62C135 51 144 44 154 44C163 44 171 50 172 59C178 59 182 63 182 69C182 75 177 78 171 78H138C131 78 127 73 127 67C127 62 131 60 135 62Z" fill="hsl(210,55%,62%)"/>
      <path d="M55 80Q95 68 135 80T205 78" stroke="hsl(158,52%,38%)" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  };

  // Character-level Radical & Etymology decomposition for Traditional Chinese characters
  const CHAR_RADICAL_NOTES = {
    "請": "請 (Thỉnh): Bộ Ngôn 言 (lời nói) + chữ Thanh 青 (trong sáng) ➔ lời thỉnh cầu lịch sự.",
    "問": "問 (Vấn): Bộ Môn 門 (khung cửa hai cánh) + Bộ Khẩu 口 (miệng) ➔ mở miệng hỏi thăm.",
    "貴": "貴 (Quý): Phía dưới là Bộ Bối 貝 (vỏ sò/tiền tệ cổ) ➔ vật quý giá, tôn quý.",
    "姓": "姓 (Tính): Bộ Nữ 女 (người mẹ) + chữ Sinh 生 (sinh ra) ➔ dòng họ từ nguồn gốc mẫu hệ.",
    "名": "名 (Danh): Bộ Tịch 夕 (buổi tối) + Bộ Khẩu 口 (miệng) ➔ trời tối không thấy mặt nên phải xưng tên.",
    "字": "字 (Tự): Bộ Miên 宀 (mái nhà) + chữ Tử 子 (đứa trẻ) ➔ chữ viết được nuôi dưỡng dưới mái nhà.",
    "小": "小 (Tiểu): Hình 3 hạt nhỏ tách đôi ➔ nhỏ bé.",
    "姐": "姐 (Tỷ): Bộ Nữ 女 (phụ nữ) + chữ Thả 且 (chỉ âm) ➔ chị gái, cô.",
    "先": "先 (Tiên): Hình bước chân người đi phía trước ➔ trước tiên, tiên sinh.",
    "生": "生 (Sinh): Hình mầm cây mọc lên từ mặt đất ➔ sinh sôi, học sinh.",
    "臺": "臺 (Đài): Chữ Đài Phồn thể gồm Cát 吉 + Miên 冖 + Chí 至 (đài cao vững chãi).",
    "灣": "灣 (Loan): Bộ Thủy 氵 (nước) + chữ Loan 彎 (uốn cong) ➔ vịnh biển uốn lượn (Đài Loan).",
    "越": "越 (Việt): Bộ Tẩu 走 (chạy/vượt qua) + chữ Việt 戉 ➔ vượt lên (Việt Nam).",
    "南": "南 (Nam): Phương Nam ấm áp, cây cối sinh trưởng.",
    "哪": "哪 (Na): Bộ Khẩu 口 (miệng hỏi) + chữ Na 那 ➔ nào, ở đâu.",
    "國": "國 (Quốc): Bộ Vi 囗 (biên giới quốc gia) bao quanh chữ Hoặc 或 (vũ khí bảo vệ đất nước & con người).",
    "人": "人 (Nhân): Hình dáng con người đứng thẳng bằng hai chân.",
    "喜": "喜 (Hỷ): Hình chiếc trống nhạc 壴 + cái miệng cười 口 ➔ vui mừng, yêu thích.",
    "歡": "歡 (Hoan): Bên phải là Bộ Khiếm 欠 (há miệng reo vui) ➔ hân hoan, thích.",
    "喝": "喝 (Hát): Bộ Khẩu 口 (miệng) + chữ Yết 曷 ➔ dùng miệng để uống.",
    "茶": "茶 (Trà): Bộ Thảo 艹 (cỏ cây ở trên) + Người 人 ở giữa + Bộ Mộc 木 (cây gỗ ở dưới) ➔ người hái lá trà trên cây.",
    "咖": "咖 (Gia): Bộ Khẩu 口 + chữ Gia 加 (mượn âm).",
    "啡": "啡 (Phê): Bộ Khẩu 口 + chữ Phi 非 (mượn âm: kāfēi).",
    "烏": "烏 (Ô): Hình con quạ màu đen (giống chữ Điểu 鳥 nhưng bớt 1 nét mắt vì lông đen tuyền) ➔ Trà Ô Long.",
    "龍": "龍 (Long): Chữ Long Phồn thể tượng hình đầu rồng, thân rồng và vảy rồng bay lượn.",
    "珍": "珍 (Trân): Bộ Ngọc 王 (đá quý) + chữ Chẩn 㐱 ➔ hạt trân châu quý.",
    "珠": "珠 (Châu): Bộ Ngọc 王 + chữ Chu 朱 (màu đỏ tròn) ➔ viên ngọc châu.",
    "奶": "奶 (Nãi): Bộ Nữ 女 (người mẹ) + chữ Nãi 乃 ➔ sữa.",
    "迎": "迎 (Nghênh): Bộ Sước 辶 (bước đi) + chữ Ngang 卬 ➔ bước ra đón tiếp.",
    "照": "照 (Chiếu): Mặt trời 日 + chữ Chiêu 召 + 4 chấm Hỏa 灬 ở dưới ➔ ánh sáng chiếu rọi (chụp ảnh).",
    "片": "片 (Phiến): Hình mảnh gỗ mỏng phẳng ➔ tấm hình, bức ảnh.",
    "張": "張 (Trương): Bộ Cung 弓 (cây cung) + chữ Trường 長 (kéo dài/mở rộng) ➔ lượng từ cho vật phẳng (ảnh, bàn, vé).",
    "家": "家 (Gia): Bộ Miên 宀 (mái nhà) + chữ Thỉ 豕 (đàn gia súc dưới mái nhà) ➔ gia đình ấm no.",
    "爸": "爸 (Ba): Bộ Phụ 父 (người cha ở trên) + chữ Ba 巴 (chỉ âm).",
    "媽": "媽 (Ma): Bộ Nữ 女 (người mẹ) + chữ Mã 馬 (chỉ âm: mā).",
    "哥": "哥 (Ca): Hai chữ Khả 可 chồng lên nhau (tiếng hát vang) ➔ anh trai.",
    "姐": "姐 (Tỷ): Bộ Nữ 女 + chữ Thả 且 ➔ chị gái.",
    "兩": "兩 (Lưỡng): Hình chiếc cân hai bên cân xứng ➔ số 2 khi đi trước lượng từ.",
    "老": "老 (Lão): Hình người già chống gậy ➔ thầy giáo, người đáng kính.",
    "師": "師 (Sư): Người chỉ dạy khuôn phép ➔ thầy/cô giáo.",
    "醫": "醫 (Y): Phía dưới có Bộ Dậu 酉 (bình rượu thuốc chữa bệnh) ➔ y học, bác sĩ.",
    "大": "大 (Đại): Hình người dang rộng hai tay ➔ to lớn.",
    "學": "學 (Học): Hai bàn tay truyền đạt tri thức dưới mái trường 冖 cho đứa trẻ 子 ở dưới.",
    "漂": "漂 (Phiếu): Bộ Thủy 氵 (nước trong) + chữ Phiếu 票 ➔ sáng sủa, xinh đẹp.",
    "亮": "亮 (Lượng): Phía dưới có chữ Nhi 儿 (người đứng trên cao tỏa sáng) ➔ sáng, đẹp.",
    "都": "都 (Đô): Chữ Giả 者 + Bộ Ấp 阝 (kinh đô, tất cả hội tụ) ➔ đều.",
    "沒": "沒 (Một): Bộ Thủy 氵 (nước) + chữ Một 殳 (lặn xuống nước) ➔ không có.",
    "有": "有 (Hữu): Bàn tay nắm giữ miếng thịt 月 ➔ có, sở hữu.",
    "週": "週 (Chu): Bộ Sước 辶 (vòng quay bước đi) + chữ Chu 周 ➔ chu kỳ, tuần lễ.",
    "末": "末 (Mạt): Cây gỗ 木 có nét ngang dài ở ngọn cây ➔ phần cuối (cuối tuần).",
    "常": "常 (Thường): Mũ thượng 尚 + Khăn cân 巾 ➔ điều giữ gìn thường xuyên.",
    "打": "打 (Đả): Bộ Thủ 扌 (bàn tay) + chữ Đinh 丁 ➔ dùng tay đánh/chơi bóng.",
    "網": "網 (Võng): Bộ Mịch 糹 (sợi tơ đan) + chữ Võng 亡 ➔ tấm lưới (quần vợt/Internet).",
    "球": "球 (Cầu): Bộ Ngọc 王 (viên ngọc tròn) + chữ Cầu 求 ➔ quả bóng.",
    "籃": "籃 (Lam): Bộ Trúc 竹 (đan bằng tre ở trên) + chữ Giám 監 ➔ cái rổ (bóng rổ).",
    "看": "看 (Khán): Bàn tay 手 đặt lên trên con mắt 目 để nhìn ra xa ➔ xem, nhìn.",
    "電": "電 (Điện): Bộ Vũ 雨 (mưa) ở trên + tia chớp kéo dài ở dưới ➔ điện, điện ảnh.",
    "影": "影 (Ảnh): Mặt trời 日 chiếu lên đài cao 京 tạo ra bóng 彡 ➔ hình bóng, phim ảnh.",
    "聽": "聽 (Thính): Bộ Nhĩ 耳 (lỗ tai) + Vương 王 + Thập Mục 十目 (mười mắt quan sát) + Nhất Tâm 一心 (một lòng lắng nghe).",
    "音": "音 (Âm): Lời nói 言 phát ra một tiếng ➔ âm thanh.",
    "樂": "樂 (Nhạc): Hình dây đàn căng trên khung gỗ 木 ➔ âm nhạc, vui vẻ.",
    "運": "運 (Vận): Bộ Sước 辶 (di chuyển) + chữ Quân 軍 ➔ vận chuyển, vận động.",
    "動": "動 (Động): Chữ Trọng 重 (nặng) + Bộ Lực 力 (sức lực) ➔ dùng sức làm chuyển động.",
    "客": "客 (Khách): Bộ Miên 宀 (mái nhà) + chữ Các 各 (mỗi người đến thăm) ➔ vị khách.",
    "菜": "菜 (Thái): Bộ Thảo 艹 (rau cỏ) + chữ Thải 采 (bàn tay hái trên cây) ➔ rau, món ăn.",
    "時": "時 (Thời): Bộ Nhật 日 (mặt trời) + chữ Tự 寺 ➔ thời gian mặt trời di chuyển.",
    "候": "候 (Hậu): Người 亻 đứng quan sát chờ đợi thời khắc.",
    "天": "天 (Thiên): Bầu trời cao ở trên đầu con người 大.",
    "氣": "氣 (Khí): Những luồng hơi mây 气 bốc lên từ hạt gạo 米 ➔ không khí, thời tiết.",
    "春": "春 (Xuân): Cỏ cây đâm chồi dưới ánh mặt trời 日 mùa xuân.",
    "夏": "夏 (Hạ): Hình người đội mũ lớn dưới nắng mùa hè.",
    "覺": "覺 (Giác): Học hỏi 學 + Bộ Kiến 見 (nhìn nhận ra) ➔ cảm thấy, nhận thức.",
    "得": "得 (Đắc): Bộ Xích 彳 (bước đi) + mặt trời + chữ Thốn 寸 ➔ đạt được.",
    "舒": "舒 (Thư): Chữ Xá 舍 (ngôi nhà nghỉ ngơi) + chữ Dự 予 ➔ thư thái, thoải mái.",
    "服": "服 (Phục): Quần áo mặc vừa vặn trên thân thể 月.",
    "錢": "錢 (Tiền): Bộ Kim 金 (kim loại vàng bạc) + hai cây qua 戔 ➔ tiền bạc.",
    "太": "太 (Thái): Chữ Đại 大 (to lớn) thêm 1 dấu chấm nhấn mạnh ở dưới ➔ quá, lắm."
  };

  // Core Vocabulary Database (Lessons 1–4, Part 1 & Part 2 — 100% Traditional Chinese)
  const VOCAB_DB = [
    // LESSON 1 - PART 1
    { id: "v1_1", lesson: 1, part: 1, hz: "請問", py: "qǐngwèn", hv: "THỈNH VẤN", vi: "Xin hỏi", pos: "Động từ", scene: "greeting", exZh: "請問您貴姓？", exPy: "Qǐngwèn nín guìxìng?", exVi: "Xin hỏi quý danh của ngài là gì?" },
    { id: "v1_2", lesson: 1, part: 1, hz: "貴姓", py: "guìxìng", hv: "QUÝ TÍNH", vi: "Quý danh (hỏi họ lịch sự)", pos: "Danh/Động", scene: "greeting", exZh: "請問你貴姓？", exPy: "Qǐngwèn nǐ guìxìng?", exVi: "Xin hỏi bạn họ gì?" },
    { id: "v1_3", lesson: 1, part: 1, hz: "名字", py: "míngzi", hv: "DANH TỰ", vi: "Tên", pos: "Danh từ", scene: "greeting", exZh: "你叫什麼名字？", exPy: "Nǐ jiào shénme míngzi?", exVi: "Bạn tên là gì?" },
    { id: "v1_4", lesson: 1, part: 1, hz: "小姐", py: "xiǎojiě", hv: "TIỂU TỶ", vi: "Cô, tiểu thư", pos: "Danh từ", scene: "greeting", exZh: "陳小姐是臺灣人。", exPy: "Chén xiǎojiě shì Táiwānrén.", exVi: "Cô Trần là người Đài Loan." },
    { id: "v1_5", lesson: 1, part: 1, hz: "先生", py: "xiānsheng", hv: "TIÊN SINH", vi: "Ông, ngài, tiên sinh", pos: "Danh từ", scene: "greeting", exZh: "王先生你好！", exPy: "Wáng xiānsheng nǐ hǎo!", exVi: "Xin chào ông Vương!" },
    { id: "v1_6", lesson: 1, part: 1, hz: "臺灣", py: "Táiwān", hv: "ĐÀI LOAN", vi: "Đài Loan", pos: "Danh từ riêng", scene: "greeting", exZh: "歡迎你來臺灣！", exPy: "Huānyíng nǐ lái Táiwān!", exVi: "Chào mừng bạn đến Đài Loan!" },
    { id: "v1_7", lesson: 1, part: 1, hz: "越南", py: "Yuènán", hv: "VIỆT NAM", vi: "Việt Nam", pos: "Danh từ riêng", scene: "greeting", exZh: "我是越南人。", exPy: "Wǒ shì Yuènánrén.", exVi: "Tôi là người Việt Nam." },
    { id: "v1_8", lesson: 1, part: 1, hz: "哪國人", py: "nǎ guó rén", hv: "NA QUỐC NHÂN", vi: "Người nước nào", pos: "Cụm danh từ", scene: "greeting", exZh: "請問你是哪國人？", exPy: "Qǐngwèn nǐ shì nǎ guó rén?", exVi: "Xin hỏi bạn là người nước nào?" },

    // LESSON 1 - PART 2
    { id: "v1_9", lesson: 1, part: 2, hz: "喜歡", py: "xǐhuān", hv: "HỶ HOAN", vi: "Thích", pos: "Động từ", scene: "tea", exZh: "我很喜歡喝臺灣茶。", exPy: "Wǒ hěn xǐhuān hē Táiwān chá.", exVi: "Tôi rất thích uống trà Đài Loan." },
    { id: "v1_10", lesson: 1, part: 2, hz: "喝茶", py: "hē chá", hv: "HÁT TRÀ", vi: "Uống trà", pos: "Động-Tân", scene: "tea", exZh: "你喜歡喝茶嗎？", exPy: "Nǐ xǐhuān hē chá ma?", exVi: "Bạn có thích uống trà không?" },
    { id: "v1_11", lesson: 1, part: 2, hz: "咖啡", py: "kāfēi", hv: "GIA PHÊ", vi: "Cà phê", pos: "Danh từ", scene: "tea", exZh: "我不喝咖啡，我喝茶。", exPy: "Wǒ bù hē kāfēi, wǒ hē chá.", exVi: "Tôi không uống cà phê, tôi uống trà." },
    { id: "v1_12", lesson: 1, part: 2, hz: "烏龍茶", py: "wūlóngchá", hv: "Ô LONG TRÀ", vi: "Trà Ô Long", pos: "Danh từ", scene: "tea", exZh: "臺灣的烏龍茶很好喝。", exPy: "Táiwān de wūlóngchá hěn hǎohē.", exVi: "Trà Ô Long của Đài Loan rất ngon." },
    { id: "v1_13", lesson: 1, part: 2, hz: "珍珠奶茶", py: "zhēnzhū nǎichá", hv: "TRÂN CHÂU NÃI TRÀ", vi: "Trà sữa trân châu", pos: "Danh từ", scene: "tea", exZh: "我也很喜歡喝珍珠奶茶。", exPy: "Wǒ yě hěn xǐhuān hē zhēnzhū nǎichá.", exVi: "Tôi cũng rất thích uống trà sữa trân châu." },
    { id: "v1_14", lesson: 1, part: 2, hz: "歡迎", py: "huānyíng", hv: "HOAN NGHÊNH", vi: "Hoan nghênh, chào mừng", pos: "Động từ", scene: "greeting", exZh: "歡迎你們來我家！", exPy: "Huānyíng nǐmen lái wǒ jiā!", exVi: "Chào mừng các bạn đến nhà tôi!" },

    // LESSON 2 - PART 1
    { id: "v2_1", lesson: 2, part: 1, hz: "照片", py: "zhàopiàn", hv: "CHIẾU PHIẾN", vi: "Bức ảnh", pos: "Danh từ", scene: "family", exZh: "這張照片很好看。", exPy: "Zhè zhāng zhàopiàn hěn hǎokàn.", exVi: "Bức ảnh này rất đẹp." },
    { id: "v2_2", lesson: 2, part: 1, hz: "張", py: "zhāng", hv: "TRƯƠNG", vi: "Tấm, bức (lượng từ vật phẳng)", pos: "Lượng từ", scene: "family", exZh: "我有兩張家人的照片。", exPy: "Wǒ yǒu liǎng zhāng jiārén de zhàopiàn.", exVi: "Tôi có hai bức ảnh gia đình." },
    { id: "v2_3", lesson: 2, part: 1, hz: "家人", py: "jiārén", hv: "GIA NHÂN", vi: "Người nhà, gia đình", pos: "Danh từ", scene: "family", exZh: "他們都是我的家人。", exPy: "Tāmen dōu shì wǒ de jiārén.", exVi: "Họ đều là người nhà của tôi." },
    { id: "v2_4", lesson: 2, part: 1, hz: "爸爸", py: "bàba", hv: "BA BA", vi: "Bố, ba", pos: "Danh từ", scene: "family", exZh: "我爸爸是醫生。", exPy: "Wǒ bàba shì yīshēng.", exVi: "Bố tôi là bác sĩ." },
    { id: "v2_5", lesson: 2, part: 1, hz: "媽媽", py: "māma", hv: "MA MA", vi: "Mẹ, má", pos: "Danh từ", scene: "family", exZh: "我媽媽是老師。", exPy: "Wǒ māma shì lǎoshī.", exVi: "Mẹ tôi là giáo viên." },
    { id: "v2_6", lesson: 2, part: 1, hz: "哥哥", py: "gēge", hv: "CA CA", vi: "Anh trai", pos: "Danh từ", scene: "family", exZh: "我有一個哥哥。", exPy: "Wǒ yǒu yí ge gēge.", exVi: "Tôi có một người anh trai." },
    { id: "v2_7", lesson: 2, part: 1, hz: "姐姐", py: "jiějie", hv: "TỶ TỶ", vi: "Chị gái", pos: "Danh từ", scene: "family", exZh: "我姐姐很漂亮。", exPy: "Wǒ jiějie hěn piàoliang.", exVi: "Chị gái tôi rất xinh đẹp." },
    { id: "v2_8", lesson: 2, part: 1, hz: "兩", py: "liǎng", hv: "LƯỠNG", vi: "Hai (đi trước lượng từ)", pos: "Số từ", scene: "family", exZh: "我家有兩個人。", exPy: "Wǒ jiā yǒu liǎng ge rén.", exVi: "Nhà tôi có hai người." },

    // LESSON 2 - PART 2
    { id: "v2_9", lesson: 2, part: 2, hz: "老師", py: "lǎoshī", hv: "LÃO SƯ", vi: "Giáo viên, thầy/cô giáo", pos: "Danh từ", scene: "family", exZh: "王老師教我們中文。", exPy: "Wáng lǎoshī jiāo wǒmen Zhōngwén.", exVi: "Thầy Vương dạy chúng tôi tiếng Trung." },
    { id: "v2_10", lesson: 2, part: 2, hz: "醫生", py: "yīshēng", hv: "Y SINH", vi: "Bác sĩ", pos: "Danh từ", scene: "family", exZh: "他爸爸也是醫生嗎？", exPy: "Tā bàba yě shì yīshēng ma?", exVi: "Bố anh ấy cũng là bác sĩ phải không?" },
    { id: "v2_11", lesson: 2, part: 2, hz: "大學生", py: "dàxuéshēng", hv: "ĐẠI HỌC SINH", vi: "Sinh viên đại học", pos: "Danh từ", scene: "family", exZh: "我和妹妹都是大學生。", exPy: "Wǒ hé mèimei dōu shì dàxuéshēng.", exVi: "Tôi và em gái đều là sinh viên đại học." },
    { id: "v2_12", lesson: 2, part: 2, hz: "漂亮", py: "piàoliang", hv: "PHIẾU LƯỢNG", vi: "Xinh đẹp", pos: "Tính từ", scene: "family", exZh: "這張照片很漂亮！", exPy: "Zhè zhāng zhàopiàn hěn piàoliang!", exVi: "Bức ảnh này đẹp quá!" },
    { id: "v2_13", lesson: 2, part: 2, hz: "都", py: "dōu", hv: "ĐÔ", vi: "Đều", pos: "Phó từ", scene: "family", exZh: "我們都喜歡學中文。", exPy: "Wǒmen dōu xǐhuān xué Zhōngwén.", exVi: "Chúng tôi đều thích học tiếng Trung." },
    { id: "v2_14", lesson: 2, part: 2, hz: "沒有", py: "méiyǒu", hv: "MỘT HỮU", vi: "Không có", pos: "Động từ", scene: "family", exZh: "我沒有弟弟，我有妹妹。", exPy: "Wǒ méiyǒu dìdi, wǒ yǒu mèimei.", exVi: "Tôi không có em trai, tôi có em gái." },

    // LESSON 3 - PART 1
    { id: "v3_1", lesson: 3, part: 1, hz: "週末", py: "zhōumò", hv: "CHU MẠT", vi: "Cuối tuần", pos: "Danh từ", scene: "weekend", exZh: "這個週末你做什麼？", exPy: "Zhège zhōumò nǐ zuò shénme?", exVi: "Cuối tuần này bạn làm gì?" },
    { id: "v3_2", lesson: 3, part: 1, hz: "常", py: "cháng", hv: "THƯỜNG", vi: "Thường, hay", pos: "Phó từ", scene: "weekend", exZh: "我週末常跟朋友去運動。", exPy: "Wǒ zhōumò cháng gēn péngyou qù yùndòng.", exVi: "Cuối tuần tôi thường đi tập thể thao với bạn." },
    { id: "v3_3", lesson: 3, part: 1, hz: "打網球", py: "dǎ wǎngqiú", hv: "ĐẢ VÕNG CẦU", vi: "Đánh quần vợt (tennis)", pos: "Động-Tân", scene: "weekend", exZh: "他喜歡跟朋友去打網球。", exPy: "Tā xǐhuān gēn péngyou qù dǎ wǎngqiú.", exVi: "Anh ấy thích đi đánh quần vợt với bạn." },
    { id: "v3_4", lesson: 3, part: 1, hz: "打籃球", py: "dǎ lánqiú", hv: "ĐẢ LAM CẦU", vi: "Chơi bóng rổ", pos: "Động-Tân", scene: "weekend", exZh: "我們下午一起去打籃球吧！", exPy: "Wǒmen xiàwǔ yìqǐ qù dǎ lánqiú ba!", exVi: "Chiều nay chúng mình cùng đi chơi bóng rổ nhé!" },
    { id: "v3_5", lesson: 3, part: 1, hz: "看電影", py: "kàn diànyǐng", hv: "KHÁN ĐIỆN ẢNH", vi: "Xem phim điện ảnh", pos: "Động-Tân", scene: "weekend", exZh: "我常跟家人去看臺灣電影。", exPy: "Wǒ cháng gēn jiārén qù kàn Táiwān diànyǐng.", exVi: "Tôi thường đi xem phim Đài Loan với gia đình." },
    { id: "v3_6", lesson: 3, part: 1, hz: "聽音樂", py: "tīng yīnyuè", hv: "THÍNH ÂM NHẠC", vi: "Nghe nhạc", pos: "Động-Tân", scene: "weekend", exZh: "我在家看書、聽音樂。", exPy: "Wǒ zài jiā kànshū, tīng yīnyuè.", exVi: "Tôi ở nhà đọc sách, nghe nhạc." },
    { id: "v3_7", lesson: 3, part: 1, hz: "運動", py: "yùndòng", hv: "VẬN ĐỘNG", vi: "Tập thể thao, vận động", pos: "Động/Danh", scene: "weekend", exZh: "你常做什麼運動？", exPy: "Nǐ cháng zuò shénme yùndòng?", exVi: "Bạn thường chơi môn thể thao gì?" },

    // LESSON 3 - PART 2
    { id: "v3_8", lesson: 3, part: 2, hz: "請客", py: "qǐngkè", hv: "THỈNH KHÁCH", vi: "Mời khách, đãi tiệc", pos: "Động-Tân", scene: "weekend", exZh: "今天晚上我請客！", exPy: "Jīntiān wǎnshàng wǒ qǐngkè!", exVi: "Tối nay tôi khao nhé!" },
    { id: "v3_9", lesson: 3, part: 2, hz: "臺灣菜", py: "Táiwāncài", hv: "ĐÀI LOAN THÁI", vi: "Món ăn Đài Loan", pos: "Danh từ", scene: "weekend", exZh: "我們一起去吃臺灣菜吧！", exPy: "Wǒmen yìqǐ qù chī Táiwāncài ba!", exVi: "Chúng ta cùng đi ăn món Đài Loan nhé!" },
    { id: "v3_10", lesson: 3, part: 2, hz: "越南菜", py: "Yuènáncài", hv: "VIỆT NAM THÁI", vi: "Món ăn Việt Nam", pos: "Danh từ", scene: "weekend", exZh: "我也喜歡吃越南菜。", exPy: "Wǒ yě xǐhuān chī Yuènáncài.", exVi: "Tôi cũng thích ăn món Việt Nam." },
    { id: "v3_11", lesson: 3, part: 2, hz: "時候", py: "shíhou", hv: "THỜI HẬU", vi: "Khi, lúc (...的時候)", pos: "Danh từ", scene: "weekend", exZh: "週末的時候，我常去看電影。", exPy: "Zhōumò de shíhou, wǒ cháng qù kàn diànyǐng.", exVi: "Vào dịp cuối tuần, tôi thường đi xem phim." },
    { id: "v3_12", lesson: 3, part: 2, hz: "一起", py: "yìqǐ", hv: "NHẤT KHỞI", vi: "Cùng nhau", pos: "Phó từ", scene: "weekend", exZh: "我們晚上一起去吃晚飯吧。", exPy: "Wǒmen wǎnshàng yìqǐ qù chī wǎnfàn ba.", exVi: "Tối nay chúng mình cùng đi ăn tối nhé." },

    // LESSON 4 - PART 1
    { id: "v4_1", lesson: 4, part: 1, hz: "天氣", py: "tiānqì", hv: "THIÊN KHÍ", vi: "Thời tiết", pos: "Danh từ", scene: "seasons", exZh: "今天的天氣很好。", exPy: "Jīntiān de tiānqì hěn hǎo.", exVi: "Thời tiết hôm nay rất đẹp." },
    { id: "v4_2", lesson: 4, part: 1, hz: "春天", py: "chūntiān", hv: "XUÂN THIÊN", vi: "Mùa xuân", pos: "Danh từ", scene: "seasons", exZh: "我覺得春天很舒服。", exPy: "Wǒ juéde chūntiān hěn shūfu.", exVi: "Tôi cảm thấy mùa xuân rất dễ chịu." },
    { id: "v4_3", lesson: 4, part: 1, hz: "夏天", py: "xiàtiān", hv: "HẠ THIÊN", vi: "Mùa hè", pos: "Danh từ", scene: "seasons", exZh: "臺灣的夏天非常熱。", exPy: "Táiwān de xiàtiān fēicháng rè.", exVi: "Mùa hè ở Đài Loan vô cùng nóng." },
    { id: "v4_4", lesson: 4, part: 1, hz: "覺得", py: "juéde", hv: "GIÁC ĐẮC", vi: "Cảm thấy, cho rằng", pos: "Động từ", scene: "seasons", exZh: "你覺得這杯茶怎麼樣？", exPy: "Nǐ juéde zhè bēi chá zěnmeyàng?", exVi: "Bạn thấy ly trà này thế nào?" },
    { id: "v4_5", lesson: 4, part: 1, hz: "舒服", py: "shūfu", hv: "THƯ PHỤC", vi: "Thoải mái, dễ chịu", pos: "Tính từ", scene: "seasons", exZh: "秋天的天氣非常舒服。", exPy: "Qiūtiān de tiānqì fēicháng shūfu.", exVi: "Thời tiết mùa thu vô cùng dễ chịu." },
    { id: "v4_6", lesson: 4, part: 1, hz: "非常", py: "fēicháng", hv: "PHI THƯỜNG", vi: "Vô cùng, cực kỳ", pos: "Phó từ", scene: "seasons", exZh: "那裡的冬天非常冷。", exPy: "Nàlǐ de dōngtiān fēicháng lěng.", exVi: "Mùa đông ở đó cực kỳ lạnh." },

    // LESSON 4 - PART 2
    { id: "v4_7", lesson: 4, part: 2, hz: "多少錢", py: "duōshǎo qián", hv: "ĐA THIỂU TIỀN", vi: "Bao nhiêu tiền", pos: "Cụm nghi vấn", scene: "seasons", exZh: "請問這支手機多少錢？", exPy: "Qǐngwèn zhè zhī shǒujī duōshǎo qián?", exVi: "Xin hỏi chiếc điện thoại này bao nhiêu tiền?" },
    { id: "v4_8", lesson: 4, part: 2, hz: "一共", py: "yígòng", hv: "NHẤT CỘNG", vi: "Tổng cộng", pos: "Phó từ", scene: "seasons", exZh: "請問一共多少錢？", exPy: "Qǐngwèn yígòng duōshǎo qián?", exVi: "Xin hỏi tổng cộng bao nhiêu tiền?" },
    { id: "v4_9", lesson: 4, part: 2, hz: "太貴了", py: "tài guì le", hv: "THÁI QUÝ LIỄU", vi: "Đắt quá rồi", pos: "Cấu trúc 太...了", scene: "seasons", exZh: "那支手機太貴了！", exPy: "Nà zhī shǒujī tài guì le!", exVi: "Chiếc điện thoại đó đắt quá!" },
    { id: "v4_10", lesson: 4, part: 2, hz: "便宜", py: "piányi", hv: "TIỆN NGHI", vi: "Rẻ", pos: "Tính từ", scene: "seasons", exZh: "這家店的東西很便宜。", exPy: "Zhè jiā diàn de dōngxi hěn piányi.", exVi: "Đồ của cửa hàng này rất rẻ." }
  ];

  function getWordEtymology(hz) {
    const chars = Array.from(hz || "");
    const notes = chars
      .map((c) => CHAR_RADICAL_NOTES[c])
      .filter(Boolean);
    return notes.length
      ? notes
      : [`Tách từng chữ trong 『${hz}』 để luyện viết theo thứ tự: trên trước dưới sau, trái trước phải sau.`];
  }

  // Core Grammar Formulas by Lesson & Part
  const GRAMMAR_DB = [
    {
      lesson: 1, part: 1,
      title: "Hỏi quý danh & Quốc tịch (請問 / 貴姓 / 是...不是)",
      formula: "Chủ ngữ + 是 / 不是 + Quốc tịch / Danh từ",
      note: "『貴姓』chỉ dùng để hỏi họ của đối phương (請問您貴姓？). Khi trả lời tuyệt đối không nói 『我貴姓...』 mà chỉ nói 『我姓...』.",
      exZh: "請問您貴姓？我姓王，我是越南人。",
      exVi: "Xin hỏi quý danh của ngài? Tôi họ Vương, tôi là người Việt Nam."
    },
    {
      lesson: 1, part: 2,
      title: "Câu hỏi Có...không với 嗎 & Câu hỏi nối tiếp 呢",
      formula: "Mệnh đề trần thuật + 嗎？ / Danh từ + 呢？",
      note: "Khi đã có từ để hỏi (什麼、哪國) thì KHÔNG dùng 嗎 ở cuối câu.",
      exZh: "我喜歡喝烏龍茶，你呢？你喜歡喝珍珠奶茶嗎？",
      exVi: "Tôi thích uống trà Ô Long, còn bạn? Bạn có thích uống trà sữa trân châu không?"
    },
    {
      lesson: 2, part: 1,
      title: "Lượng từ 張 / 個 & Phân biệt 二 và 兩",
      formula: "這 / 那 + (Số từ) + Lượng từ (張 / 個) + Danh từ",
      note: "Khi chỉ số lượng 2 đi trước lượng từ (個、張、家...), bắt buộc dùng 『兩』(liǎng), không dùng 『二』.",
      exZh: "這張照片有兩個人，他們是我的家人。",
      exVi: "Bức ảnh này có hai người, họ là người nhà của tôi."
    },
    {
      lesson: 2, part: 2,
      title: "Phủ định sở hữu 沒有 & Phó từ tổng quát 都",
      formula: "Chủ ngữ (số nhiều) + 都 / 也 + Động từ",
      note: "Động từ 『有』 chỉ phủ định bằng 『沒有』 (tuyệt đối không dùng 不有). Phó từ 『都』 luôn đứng SAU chủ ngữ và TRƯỚC động từ.",
      exZh: "我沒有哥哥，我和妹妹都是大學生。",
      exVi: "Tôi không có anh trai, tôi và em gái đều là sinh viên đại học."
    },
    {
      lesson: 3, part: 1,
      title: "Trật tự thời gian, tần suất 常 & Đi cùng ai 跟",
      formula: "Chủ ngữ + Thời gian + 常 + 跟 + Người + 去 + Động từ",
      note: "Trạng ngữ chỉ thời gian (週末) và cụm 『跟 + Người』 luôn đặt TRƯỚC động từ chính.",
      exZh: "我週末常跟朋友去打網球、看電影。",
      exVi: "Cuối tuần tôi thường đi đánh quần vợt, xem phim với bạn bè."
    },
    {
      lesson: 3, part: 2,
      title: "Cấu trúc khi/lúc ...的時候 & Rủ rê 一起...吧",
      formula: "Động/Danh + 的時候，Chủ ngữ + 一起 + Động từ + 吧！",
      note: "Trợ từ 『吧』 ở cuối câu dùng để rủ rê nhẹ nhàng, lịch sự.",
      exZh: "今天晚上我請客，我們一起去吃臺灣菜吧！",
      exVi: "Tối nay tôi mời, chúng mình cùng đi ăn món Đài Loan nhé!"
    },
    {
      lesson: 4, part: 1,
      title: "So sánh kém hơn 沒有...那麼... & Cảm nhận 覺得",
      formula: "A + 沒有 + B + (那麼) + Tính từ",
      note: "Dùng để diễn đạt A không đạt tới mức độ của B (ví dụ: mùa hè không dễ chịu như mùa xuân).",
      exZh: "那裡的夏天非常熱，我覺得沒有春天那麼舒服。",
      exVi: "Mùa hè ở đó vô cùng nóng, tôi thấy không dễ chịu như mùa xuân."
    },
    {
      lesson: 4, part: 2,
      title: "Cảm thán mức độ 太 + Tính từ + 了 & Hỏi giá 多少錢",
      formula: "Chủ ngữ + 太 + Tính từ + 了！ / 一共多少錢？",
      note: "Khi phủ định 『不太 + Tính từ』 thì bỏ 『了』 ở cuối câu.",
      exZh: "請問這兩杯珍珠奶茶一共多少錢？太好喝了！",
      exVi: "Xin hỏi hai ly trà sữa trân châu này tổng cộng bao nhiêu tiền? Ngon quá!"
    }
  ];

  // Unified Sentence Database
  const SENTENCES_DB = [
    {
      id: "s1_1", lesson: 1, part: 1, scene: "greeting",
      tag: "Bài 1 (P.1) • Hỏi quý danh & Tên",
      zh: "請問您貴姓？我姓王，叫王明華。",
      py: "Qǐngwèn nín guìxìng? Wǒ xìng Wáng, jiào Wáng Mínghuá.",
      vi: "Xin hỏi quý danh của ngài là gì? Tôi họ Vương, tên là Vương Minh Hoa.",
      hint: "Công thức: 請問您貴姓？ + 我姓...，叫...",
      tiles: ["請問", "您", "貴姓", "？", "我", "姓王", "，", "叫", "王明華", "。"],
      gloss: [
        { w: "請問", py: "qǐngwèn", vi: "Xin hỏi" },
        { w: "您貴姓？", py: "nín guìxìng?", vi: "quý danh của ngài?" },
        { w: "我姓王，", py: "wǒ xìng Wáng,", vi: "Tôi họ Vương," },
        { w: "叫王明華。", py: "jiào Wáng Mínghuá.", vi: "tên là Vương Minh Hoa." }
      ]
    },
    {
      id: "s1_2", lesson: 1, part: 1, scene: "greeting",
      tag: "Bài 1 (P.1) • Quốc tịch & Phủ định 不是",
      zh: "我不是日本人，我是越南人。你呢？",
      py: "Wǒ bú shì Rìběnrén, wǒ shì Yuènánrén. Nǐ ne?",
      vi: "Tôi không phải là người Nhật Bản, tôi là người Việt Nam. Thế còn bạn?",
      hint: "Phủ định của 是 là 不是; hỏi ngược lại ngắn gọn bằng 你呢？",
      tiles: ["我", "不是", "日本人", "，", "我是", "越南人", "。", "你呢", "？"],
      gloss: [
        { w: "我不是", py: "wǒ bú shì", vi: "Tôi không phải là" },
        { w: "日本人，", py: "Rìběnrén,", vi: "người Nhật Bản," },
        { w: "我是越南人。", py: "wǒ shì Yuènánrén.", vi: "tôi là người Việt Nam." },
        { w: "你呢？", py: "nǐ ne?", vi: "Thế còn bạn?" }
      ]
    },
    {
      id: "s1_3", lesson: 1, part: 2, scene: "tea",
      tag: "Bài 1 (P.2) • Sở thích đồ uống Đài Loan",
      zh: "我很喜歡喝臺灣烏龍茶，也喜歡喝珍珠奶茶。",
      py: "Wǒ hěn xǐhuān hē Táiwān wūlóngchá, yě xǐhuān hē zhēnzhū nǎichá.",
      vi: "Tôi rất thích uống trà Ô Long Đài Loan, cũng thích uống trà sữa trân châu.",
      hint: "Phó từ 也 (cũng) đứng trước động từ 喜歡.",
      tiles: ["我很", "喜歡", "喝", "臺灣", "烏龍茶", "，", "也喜歡", "喝", "珍珠奶茶", "。"],
      gloss: [
        { w: "我很喜歡", py: "wǒ hěn xǐhuān", vi: "Tôi rất thích" },
        { w: "喝臺灣烏龍茶，", py: "hē Táiwān wūlóngchá,", vi: "uống trà Ô Long Đài Loan," },
        { w: "也喜歡喝", py: "yě xǐhuān hē", vi: "cũng thích uống" },
        { w: "珍珠奶茶。", py: "zhēnzhū nǎichá.", vi: "trà sữa trân châu." }
      ]
    },
    {
      id: "s2_1", lesson: 2, part: 1, scene: "family",
      tag: "Bài 2 (P.1) • Giới thiệu ảnh gia đình & Lượng từ",
      zh: "這張照片很漂亮，我家有五個人。",
      py: "Zhè zhāng zhàopiàn hěn piàoliang, wǒ jiā yǒu wǔ ge rén.",
      vi: "Bức ảnh này rất đẹp, gia đình tôi có năm người.",
      hint: "Lượng từ của 照片 là 張; lượng từ của 人 là 個.",
      tiles: ["這張", "照片", "很漂亮", "，", "我家", "有", "五個人", "。"],
      gloss: [
        { w: "這張照片", py: "zhè zhāng zhàopiàn", vi: "Bức ảnh này" },
        { w: "很漂亮，", py: "hěn piàoliang,", vi: "rất đẹp," },
        { w: "我家有", py: "wǒ jiā yǒu", vi: "gia đình tôi có" },
        { w: "五個人。", py: "wǔ ge rén.", vi: "năm người." }
      ]
    },
    {
      id: "s2_2", lesson: 2, part: 2, scene: "family",
      tag: "Bài 2 (P.2) • Nghề nghiệp gia đình & Phó từ 都",
      zh: "我爸爸是醫生，媽媽是老師，我們都是大學生。",
      py: "Wǒ bàba shì yīshēng, māma shì lǎoshī, wǒmen dōu shì dàxuéshēng.",
      vi: "Bố tôi là bác sĩ, mẹ là giáo viên, chúng tôi đều là sinh viên đại học.",
      hint: "Phó từ 都 đứng sau 我們 và trước động từ 是.",
      tiles: ["我爸爸", "是醫生", "，", "媽媽", "是老師", "，", "我們", "都是", "大學生", "。"],
      gloss: [
        { w: "我爸爸是醫生，", py: "wǒ bàba shì yīshēng,", vi: "Bố tôi là bác sĩ," },
        { w: "媽媽是老師，", py: "māma shì lǎoshī,", vi: "mẹ là giáo viên," },
        { w: "我們都是", py: "wǒmen dōu shì", vi: "chúng tôi đều là" },
        { w: "大學生。", py: "dàxuéshēng.", vi: "sinh viên đại học." }
      ]
    },
    {
      id: "s3_1", lesson: 3, part: 1, scene: "weekend",
      tag: "Bài 3 (P.1) • Hoạt động cuối tuần & Thể thao",
      zh: "我週末常跟朋友去打網球，也常去看電影。",
      py: "Wǒ zhōumò cháng gēn péngyou qù dǎ wǎngqiú, yě cháng qù kàn diànyǐng.",
      vi: "Cuối tuần tôi thường đi đánh quần vợt với bạn, cũng thường đi xem phim.",
      hint: "Trật tự: Chủ ngữ + 週末 + 常 + 跟朋友 + 去 + Động từ.",
      tiles: ["我", "週末", "常跟", "朋友", "去", "打網球", "，", "也常去", "看電影", "。"],
      gloss: [
        { w: "我週末", py: "wǒ zhōumò", vi: "Cuối tuần tôi" },
        { w: "常跟朋友", py: "cháng gēn péngyou", vi: "thường cùng bạn bè" },
        { w: "去打網球，", py: "qù dǎ wǎngqiú,", vi: "đi đánh quần vợt," },
        { w: "也常去看電影。", py: "yě cháng qù kàn diànyǐng.", vi: "cũng thường đi xem phim." }
      ]
    },
    {
      id: "s3_2", lesson: 3, part: 2, scene: "weekend",
      tag: "Bài 3 (P.2) • Mời ăn món Đài Loan (請客 / 吧)",
      zh: "今天晚上我請客，我們一起去吃臺灣菜吧！",
      py: "Jīntiān wǎnshàng wǒ qǐngkè, wǒmen yìqǐ qù chī Táiwāncài ba!",
      vi: "Tối hôm nay tôi mời khách, chúng ta cùng đi ăn món Đài Loan nhé!",
      hint: "Cấu trúc rủ rê: 我們一起去 + Động từ + 吧！",
      tiles: ["今天", "晚上", "我請客", "，", "我們", "一起去", "吃", "臺灣菜", "吧！"],
      gloss: [
        { w: "今天晚上", py: "jīntiān wǎnshàng", vi: "Tối hôm nay" },
        { w: "我請客，", py: "wǒ qǐngkè,", vi: "tôi đãi khách," },
        { w: "我們一起去", py: "wǒmen yìqǐ qù", vi: "chúng mình cùng đi" },
        { w: "吃臺灣菜吧！", py: "chī Táiwāncài ba!", vi: "ăn món Đài Loan nhé!" }
      ]
    },
    {
      id: "s4_1", lesson: 4, part: 1, scene: "seasons",
      tag: "Bài 4 (P.1) • Thời tiết & So sánh 沒有...那麼...",
      zh: "那裡的夏天非常熱，我覺得沒有春天那麼舒服。",
      py: "Nàlǐ de xiàtiān fēicháng rè, wǒ juéde méiyǒu chūntiān nàme shūfu.",
      vi: "Mùa hè ở đó vô cùng nóng, tôi cảm thấy không dễ chịu như mùa xuân.",
      hint: "Cấu trúc: 夏天 + 沒有 + 春天 + 那麼舒服。",
      tiles: ["那裡的", "夏天", "非常熱", "，", "我覺得", "沒有", "春天", "那麼", "舒服", "。"],
      gloss: [
        { w: "那裡的夏天", py: "nàlǐ de xiàtiān", vi: "Mùa hè ở đó" },
        { w: "非常熱，", py: "fēicháng rè,", vi: "vô cùng nóng," },
        { w: "我覺得", py: "wǒ juéde", vi: "tôi cảm thấy" },
        { w: "沒有春天那麼舒服。", py: "méiyǒu chūntiān nàme shūfu.", vi: "không dễ chịu như mùa xuân." }
      ]
    },
    {
      id: "s4_2", lesson: 4, part: 2, scene: "seasons",
      tag: "Bài 4 (P.2) • Hỏi giá tiền & Cảm thán 太...了",
      zh: "請問這兩杯珍珠奶茶一共多少錢？太好喝了！",
      py: "Qǐngwèn zhè liǎng bēi zhēnzhū nǎichá yígòng duōshǎo qián? Tài hǎohē le!",
      vi: "Xin hỏi hai ly trà sữa trân châu này tổng cộng bao nhiêu tiền? Ngon quá đi!",
      hint: "Số lượng 2 đi với lượng từ 杯 phải dùng 兩杯.",
      tiles: ["請問", "這兩杯", "珍珠奶茶", "一共", "多少錢", "？", "太好喝了", "！"],
      gloss: [
        { w: "請問", py: "qǐngwèn", vi: "Xin hỏi" },
        { w: "這兩杯珍珠奶茶", py: "zhè liǎng bēi zhēnzhū nǎichá", vi: "hai ly trà sữa trân châu này" },
        { w: "一共多少錢？", py: "yígòng duōshǎo qián?", vi: "tổng cộng bao nhiêu tiền?" },
        { w: "太好喝了！", py: "tài hǎohē le!", vi: "Ngon quá đi!" }
      ]
    }
  ];

  const ROLEPLAY_DB = [
    {
      lesson: 1, part: 1,
      speaker: "陳月美 (Bạn học tại Đài Bắc)",
      questionZh: "你好！請問你貴姓？你叫什麼名字？",
      questionPy: "Nǐ hǎo! Qǐngwèn nǐ guìxìng? Nǐ jiào shénme míngzi?",
      questionVi: "Xin chào! Xin hỏi bạn họ gì? Bạn tên là gì?",
      zh: "你好，我姓陳，我叫陳月美。",
      py: "Nǐ hǎo, wǒ xìng Chén, wǒ jiào Chén Yuèměi.",
      vi: "Xin chào, tôi họ Trần, tôi tên là Trần Nguyệt Mỹ.",
      tip: "Hai thanh 3 đi liền nhau trong 『你好』 đọc biến điệu thành Ní hǎo. Chữ 『姓』 và 『叫』 nhấn dứt khoát thanh 4."
    },
    {
      lesson: 1, part: 2,
      speaker: "李東健 (Quán trà Đài Bắc)",
      questionZh: "請問你是哪國人？你喜歡喝什麼茶？",
      questionPy: "Qǐngwèn nǐ shì nǎ guó rén? Nǐ xǐhuān hē shénme chá?",
      questionVi: "Xin hỏi bạn là người nước nào? Bạn thích uống trà gì?",
      zh: "我是越南人，我很喜歡喝臺灣烏龍茶。",
      py: "Wǒ shì Yuènánrén, wǒ hěn xǐhuān hē Táiwān wūlóngchá.",
      vi: "Tôi là người Việt Nam, tôi rất thích uống trà Ô Long Đài Loan.",
      tip: "Chữ 『茶』(chá) là âm cong lưỡi bật hơi nhẹ (ch-), kéo lên thanh 2."
    },
    {
      lesson: 2, part: 1,
      speaker: "王開文 (Xem ảnh gia đình)",
      questionZh: "這張照片很漂亮！請問你家有幾個人？",
      questionPy: "Zhè zhāng zhàopiàn hěn piàoliang! Qǐngwèn nǐ jiā yǒu jǐ ge rén?",
      questionVi: "Bức ảnh này đẹp quá! Xin hỏi nhà bạn có mấy người?",
      zh: "謝謝！我家有五個人，我有一個哥哥。",
      py: "Xièxie! Wǒ jiā yǒu wǔ ge rén, wǒ yǒu yí ge gēge.",
      vi: "Cảm ơn! Nhà tôi có 5 người, tôi có một người anh trai.",
      tip: "Chữ 『一』 đứng trước thanh 4 (個) biến điệu thành thanh 2 (yí ge)."
    },
    {
      lesson: 3, part: 1,
      speaker: "馬安同 (Lên lịch cuối tuần)",
      questionZh: "這個週末你常做什麼運動？",
      questionPy: "Zhège zhōumò nǐ cháng zuò shénme yùndòng?",
      questionVi: "Cuối tuần này bạn thường chơi môn thể thao gì?",
      zh: "我週末常跟朋友去打網球和看電影。",
      py: "Wǒ zhōumò cháng gēn péngyou qù dǎ wǎngqiú hé kàn diànyǐng.",
      vi: "Cuối tuần tôi thường đi đánh quần vợt và xem phim với bạn.",
      tip: "Hai thanh 3 trong 『打網球』(dǎ wǎngqiú) biến điệu chữ đầu thành dá wǎngqiú."
    },
    {
      lesson: 4, part: 1,
      speaker: "張怡君 (Trò chuyện về thời tiết)",
      questionZh: "你覺得臺灣夏天的天氣怎麼樣？",
      questionPy: "Nǐ juéde Táiwān xiàtiān de tiānqì zěnmeyàng?",
      questionVi: "Bạn cảm thấy thời tiết mùa hè ở Đài Loan thế nào?",
      zh: "臺灣的夏天非常熱，我覺得春天很舒服。",
      py: "Táiwān de xiàtiān fēicháng rè, wǒ juéde chūntiān hěn shūfu.",
      vi: "Mùa hè ở Đài Loan rất nóng, tôi thấy mùa xuân rất dễ chịu.",
      tip: "Chữ 『熱』(rè) là âm cong lưỡi r- thanh 4; 『舒服』(shūfu) âm sau đọc thanh nhẹ."
    }
  ];

  const DETECTIVE_DB = [
    {
      lesson: 1, part: 1,
      wrongZh: "請問您貴姓？我貴姓王。",
      correctZh: "請問您貴姓？我姓王。",
      py: "Qǐngwèn nín guìxìng? Wǒ xìng Wáng.",
      options: [
        "Sai ở 『我貴姓王』 — trả lời họ của mình chỉ nói 『我姓王』, không dùng 貴姓 cho bản thân.",
        "Sai ở 『請問』 — không được đứng đầu câu.",
        "Sai ở 『您』 — phải đổi thành 們."
      ],
      correctIdx: 0
    },
    {
      lesson: 1, part: 2,
      wrongZh: "請問你喜歡喝什麼嗎？",
      correctZh: "請問你喜歡喝什麼？",
      py: "Qǐngwèn nǐ xǐhuān hē shénme?",
      options: [
        "Thừa trợ từ 『嗎』 — câu đã có từ để hỏi 『什麼』 thì không dùng 『嗎』 ở cuối câu.",
        "Sai vị trí chữ 『喝』 — phải đặt sau 『什麼』.",
        "Thiếu chữ 『很』 trước 『喜歡』."
      ],
      correctIdx: 0
    },
    {
      lesson: 2, part: 1,
      wrongZh: "我有二張家人的照片。",
      correctZh: "我有兩張家人的照片。",
      py: "Wǒ yǒu liǎng zhāng jiārén de zhàopiàn.",
      options: [
        "Sai số từ 『二張』 — trước lượng từ (張、個) số 2 bắt buộc dùng 『兩張』.",
        "Sai lượng từ 『張』 — ảnh phải dùng lượng từ 『本』.",
        "Sai động từ 『有』 — phải dùng 『是』."
      ],
      correctIdx: 0
    },
    {
      lesson: 2, part: 2,
      wrongZh: "我不有哥哥，都我們是大學生。",
      correctZh: "我沒有哥哥，我們都是大學生。",
      py: "Wǒ méiyǒu gēge, wǒmen dōu shì dàxuéshēng.",
      options: [
        "Phủ định của 『有』 là 『沒有』 (không dùng 不有) và phó từ 『都』 phải đứng sau chủ ngữ 『我們』.",
        "Chữ 『大學生』 không đi với động từ 『是』.",
        "Phải đặt 『哥哥』 lên đầu câu."
      ],
      correctIdx: 0
    },
    {
      lesson: 3, part: 1,
      wrongZh: "我常去打網球跟朋友週末。",
      correctZh: "我週末常跟朋友去打網球。",
      py: "Wǒ zhōumò cháng gēn péngyou qù dǎ wǎngqiú.",
      options: [
        "Sai trật tự câu — trạng ngữ thời gian 『週末』 và 『跟朋友』 phải đứng TRƯỚC động từ 『去打網球』.",
        "Quần vợt phải dùng động từ 『踢』 thay vì 『打』.",
        "Chữ 『常』 phải đặt ở cuối câu."
      ],
      correctIdx: 0
    },
    {
      lesson: 4, part: 1,
      wrongZh: "夏天不有春天那麼舒服。",
      correctZh: "夏天沒有春天那麼舒服。",
      py: "Xiàtiān méiyǒu chūntiān nàme shūfu.",
      options: [
        "Cấu trúc so sánh kém hơn phải dùng 『A 沒有 B 那麼 + Tính từ』, không dùng 『不有』.",
        "Chữ 『舒服』 phải đứng trước 『春天』.",
        "Thiếu chữ 『嗎』 ở cuối câu."
      ],
      correctIdx: 0
    }
  ];

  const SC_TO_TC_MAP = {
    "\u4eec": "們", "\u8bf7": "請", "\u95ee": "問", "\u8d35": "貴", "\u4ec0": "什", "\u4e48": "麼",
    "\u5417": "嗎", "\u56fd": "國", "\u6765": "來", "\u5bf9": "對", "\u6ca1": "沒", "\u5173": "關",
    "\u7cfb": "係", "\u8c22": "謝", "\u559c": "喜", "\u6b22": "歡", "\u53f0": "臺", "\u6e7e": "灣",
    "\u5f20": "張", "\u4e24": "兩", "\u4e2a": "個", "\u8fd9": "這", "\u8c01": "誰", "\u5e08": "師",
    "\u533b": "醫", "\u5b66": "學", "\u4e60": "習", "\u6f02": "漂", "\u5468": "週", "\u7f51": "網",
    "\u7535": "電", "\u89c6": "視", "\u5f71": "影", "\u542c": "聽", "\u4e50": "樂", "\u4e66": "書",
    "\u8fd0": "運", "\u52a8": "動", "\u65f6": "時", "\u8fd8": "還", "\u996d": "飯", "\u70b9": "點",
    "\u89c9": "覺", "\u70ed": "熱", "\u98ce": "風", "\u51ac": "冬", "\u6c14": "氣", "\u8bf4": "說",
    "\u8bdd": "話", "\u6c49": "漢", "\u8bed": "語", "\u53f7": "號", "\u7801": "碼", "\u94b1": "錢",
    "\u5988": "媽", "\u59d0": "姐", "\u7238": "爸", "\u7bee": "籃", "\u4e4c": "烏", "\u9f99": "龍"
  };

  function toTraditional(str) {
    if (!str) return "";
    let out = "";
    for (const ch of str) {
      out += SC_TO_TC_MAP[ch] || ch;
    }
    return out;
  }

  const CHAR_PINYIN_MAP = {
    "你": "nǐ", "好": "hǎo", "請": "qǐng", "問": "wèn", "貴": "guì", "姓": "xìng", "叫": "jiào",
    "什": "shén", "麼": "me", "名": "míng", "字": "zì", "我": "wǒ", "是": "shì", "越": "Yuè",
    "南": "nán", "人": "rén", "臺": "Tái", "灣": "wān", "中": "Zhōng", "文": "wén", "華": "Huá",
    "李": "Lǐ", "陳": "Chén", "月": "Yuè", "美": "měi", "王": "Wáng", "開": "Kāi", "東": "Dōng",
    "健": "Jiàn", "馬": "Mǎ", "安": "Ān", "同": "Tóng", "明": "Míng", "很": "hěn", "喜": "xǐ",
    "歡": "huān", "喝": "hē", "茶": "chá", "咖": "kā", "啡": "fēi", "烏": "wū", "龍": "lóng",
    "珍": "zhēn", "珠": "zhū", "奶": "nǎi", "嗎": "ma", "呢": "ne", "不": "bù", "也": "yě",
    "都": "dōu", "這": "zhè", "那": "nà", "張": "zhāng", "照": "zhào", "片": "piàn", "有": "yǒu",
    "沒": "méi", "兩": "liǎng", "個": "ge", "五": "wǔ", "家": "jiā", "爸": "bà", "媽": "mā",
    "哥": "gē", "姐": "jiě", "妹": "mèi", "弟": "dì", "老": "lǎo", "師": "shī", "醫": "yī",
    "生": "shēng", "大": "dà", "學": "xué", "漂": "piào", "亮": "liàng", "謝": "xiè", "和": "hé",
    "週": "zhōu", "末": "mò", "常": "cháng", "跟": "gēn", "朋": "péng", "友": "you", "去": "qù",
    "打": "dǎ", "網": "wǎng", "球": "qiú", "籃": "lán", "看": "kàn", "電": "diàn", "影": "yǐng",
    "視": "shì", "聽": "tīng", "音": "yīn", "樂": "yuè", "書": "shū", "運": "yùn", "動": "dòng",
    "時": "shí", "候": "hou", "吃": "chī", "菜": "cài", "飯": "fàn", "今": "jīn", "天": "tiān",
    "晚": "wǎn", "上": "shàng", "客": "kè", "一": "yī", "起": "qǐ", "吧": "ba", "太": "tài",
    "了": "le", "裡": "lǐ", "的": "de", "夏": "xià", "春": "chūn", "秋": "qiū", "冬": "dōng",
    "非": "fēi", "熱": "rè", "冷": "lěng", "覺": "jué", "得": "de", "舒": "shū", "服": "fu",
    "氣": "qì", "杯": "bēi", "共": "gòng", "多": "duō", "少": "shǎo", "錢": "qián", "您": "nín",
    "日": "Rì", "本": "běn", "哪": "nǎ", "國": "guó", "迎": "yíng", "來": "lái", "便": "pián", "宜": "yi"
  };

  function detectToneNumber(py) {
    if (!py) return 0;
    if (/[āēīōūǖ]/.test(py)) return 1;
    if (/[áéíóúǘ]/.test(py)) return 2;
    if (/[ǎěǐǒǔǚ]/.test(py)) return 3;
    if (/[àèìòùǜ]/.test(py)) return 4;
    return 0; // Neutral tone
  }

  // Analyzes each character's tone + automatic Tone Sandhi (Biến điệu) rules for Step 3 Speaking
  function analyzeSentenceTones(zhText) {
    const cleanChars = Array.from(toTraditional(zhText || "")).filter(
      (c) => !/[，。？！、\s,.?!]/.test(c)
    );
    const items = cleanChars.map((ch) => {
      const py = CHAR_PINYIN_MAP[ch] || "";
      const baseTone = detectToneNumber(py);
      return { ch, py, baseTone, spokenTone: baseTone, sandhiRule: "" };
    });

    const sandhiAlerts = [];
    for (let i = 0; i < items.length - 1; i++) {
      const cur = items[i];
      const nxt = items[i + 1];
      // Rule 1: 3rd tone + 3rd tone -> 2nd tone + 3rd tone
      if (cur.baseTone === 3 && nxt.baseTone === 3) {
        cur.spokenTone = 2;
        cur.sandhiRule = "Biến điệu 3+3 ➔ Thanh 2";
        sandhiAlerts.push(
          `🔄 Biến điệu hai thanh 3: 『${cur.ch}${nxt.ch}』 (${cur.py} ${nxt.py}) ➔ chữ 『${cur.ch}』 đọc nâng lên thành Thanh 2 (ˊ)!`
        );
      }
      // Rule 2: 不 (bù) + 4th tone -> bú
      if (cur.ch === "不" && nxt.baseTone === 4) {
        cur.spokenTone = 2;
        cur.py = "bú";
        cur.sandhiRule = "不 + Thanh 4 ➔ bú";
        sandhiAlerts.push(
          `🔄 Biến điệu của 不: Đứng trước thanh 4『${nxt.ch}』(${nxt.py}), chữ 『不』 đọc thành Thanh 2 (bú ${nxt.py})!`
        );
      }
      // Rule 3: 一 (yī) + 4th tone -> yí; 一 + 1/2/3 tone -> yì
      if (cur.ch === "一") {
        if (nxt.baseTone === 4 || nxt.ch === "個") {
          cur.spokenTone = 2;
          cur.py = "yí";
          cur.sandhiRule = "一 + Thanh 4 ➔ yí";
          sandhiAlerts.push(
            `🔄 Biến điệu của 一: Trong 『${cur.ch}${nxt.ch}』, chữ 『一』 đọc thành Thanh 2 (yí ${nxt.py})!`
          );
        } else if (nxt.baseTone >= 1 && nxt.baseTone <= 3) {
          cur.spokenTone = 4;
          cur.py = "yì";
          cur.sandhiRule = "一 + Thanh 1/2/3 ➔ yì";
          sandhiAlerts.push(
            `🔄 Biến điệu của 一: Trước thanh ${nxt.baseTone}『${nxt.ch}』, chữ 『一』 đọc thành Thanh 4 (yì ${nxt.py})!`
          );
        }
      }
    }
    return { items, sandhiAlerts };
  }

  const HOMOPHONE_GROUPS = [
    ["姓", "性", "興", "信", "星", "心"],
    ["陳", "成", "程", "城", "乘"],
    ["張", "章", "長", "常"],
    ["兩", "想", "講"],
    ["照", "叫", "教", "覺"],
    ["片", "騙", "遍", "便"],
    ["網", "往", "忘", "望", "王"],
    ["球", "求", "秋"],
    ["週", "州", "洲", "粥"],
    ["末", "莫", "墨", "默"],
    ["常", "長", "場", "嚐"],
    ["請", "情", "晴", "親", "清"],
    ["客", "課", "刻", "克"],
    ["越", "月", "樂", "悅"],
    ["熱", "樂", "了", "惹"],
    ["是", "事", "市", "試", "視", "室", "師", "十", "四"],
    ["和", "合", "河", "何", "喝"],
    ["在", "再", "載"],
    ["她", "他", "它"],
    ["你", "妳", "里", "理", "李"],
    ["嗎", "媽", "馬", "罵"],
    ["呢", "泥", "你"],
    ["喜", "洗", "起"],
    ["歡", "換", "還", "環"]
  ];


  // Curated 3 Usage Examples per Vocabulary Word (Basic -> Conversational -> Taiwan Daily Life)
  const WORD_EXAMPLES_DB = {
    "請問": [
      { level: "1. Giao tiếp cơ bản", zh: "請問您貴姓？", py: "Qǐngwèn nín guìxìng?", vi: "Xin hỏi quý danh của ngài là gì?" },
      { level: "2. Hỏi thông tin", zh: "請問你是哪國人？", py: "Qǐngwèn nǐ shì nǎ guó rén?", vi: "Xin hỏi bạn là người nước nào?" },
      { level: "3. Hỏi mua hàng", zh: "請問這杯珍珠奶茶多少錢？", py: "Qǐngwèn zhè bēi zhēnzhū nǎichá duōshǎo qián?", vi: "Xin hỏi ly trà sữa trân châu này bao nhiêu tiền?" }
    ],
    "貴姓": [
      { level: "1. Lịch sự với người lớn", zh: "請問您貴姓？", py: "Qǐngwèn nín guìxìng?", vi: "Xin hỏi quý danh của ngài là gì?" },
      { level: "2. Hỏi họ bạn mới gặp", zh: "王先生，請問你朋友貴姓？", py: "Wáng xiānsheng, qǐngwèn nǐ péngyou guìxìng?", vi: "Anh Vương ơi, xin hỏi bạn của anh họ gì?" },
      { level: "3. Hỏi và trả lời chuẩn", zh: "請問你貴姓？我姓陳。", py: "Qǐngwèn nǐ guìxìng? Wǒ xìng Chén.", vi: "Xin hỏi bạn họ gì? Tôi họ Trần." }
    ],
    "名字": [
      { level: "1. Câu hỏi tên phổ biến", zh: "請問你叫什麼名字？", py: "Qǐngwèn nǐ jiào shénme míngzi?", vi: "Xin hỏi bạn tên là gì?" },
      { level: "2. Giới thiệu tên", zh: "我的名字叫王明華。", py: "Wǒ de míngzi jiào Wáng Mínghuá.", vi: "Tên của tôi là Vương Minh Hoa." },
      { level: "3. Nhận xét về tên", zh: "你的中文名字很好聽！", py: "Nǐ de Zhōngwén míngzi hěn hǎotīng!", vi: "Tên tiếng Trung của bạn nghe rất hay!" }
    ],
    "小姐": [
      { level: "1. Giới thiệu quốc tịch", zh: "陳小姐是臺灣人。", py: "Chén xiǎojiě shì Táiwānrén.", vi: "Cô Trần là người Đài Loan." },
      { level: "2. Chào hỏi lịch sự", zh: "李小姐，你好！歡迎你來臺灣。", py: "Lǐ xiǎojiě, nǐ hǎo! Huānyíng nǐ lái Táiwān.", vi: "Chào cô Lý! Chào mừng cô đến Đài Loan." },
      { level: "3. Hỏi đồ uống", zh: "請問那位小姐喜歡喝咖啡嗎？", py: "Qǐngwèn nà wèi xiǎojiě xǐhuān hē kāfēi ma?", vi: "Xin hỏi cô ấy có thích uống cà phê không?" }
    ],
    "先生": [
      { level: "1. Chào hỏi xã giao", zh: "王先生你好！請問你喝茶嗎？", py: "Wáng xiānsheng nǐ hǎo! Qǐngwèn nǐ hē chá ma?", vi: "Chào ông Vương! Xin hỏi ông có uống trà không?" },
      { level: "2. Giới thiệu nghề nghiệp", zh: "張先生是醫生，他太太是老師。", py: "Zhāng xiānsheng shì yīshēng, tā tàitai shì lǎoshī.", vi: "Ông Trương là bác sĩ, vợ ông ấy là giáo viên." },
      { level: "3. Hỏi quốc tịch", zh: "請問那位先生也是越南人嗎？", py: "Qǐngwèn nà wèi xiānsheng yě shì Yuènánrén ma?", vi: "Xin hỏi quý ông kia cũng là người Việt Nam phải không?" }
    ],
    "臺灣": [
      { level: "1. Chào mừng đến Đài Loan", zh: "歡迎你來臺灣學中文！", py: "Huānyíng nǐ lái Táiwān xué Zhōngwén!", vi: "Chào mừng bạn đến Đài Loan học tiếng Trung!" },
      { level: "2. Nói về đặc sản", zh: "我很喜歡喝臺灣烏龍茶。", py: "Wǒ hěn xǐhuān hē Táiwān wūlóngchá.", vi: "Tôi rất thích uống trà Ô Long Đài Loan." },
      { level: "3. Nói về thời tiết", zh: "臺灣的春天很舒服，夏天非常熱。", py: "Táiwān de chūntiān hěn shūfu, xiàtiān fēicháng rè.", vi: "Mùa xuân ở Đài Loan rất dễ chịu, mùa hè vô cùng nóng." }
    ],
    "越南": [
      { level: "1. Giới thiệu quê hương", zh: "我是越南人，我姓阮。", py: "Wǒ shì Yuènánrén, wǒ xìng Ruǎn.", vi: "Tôi là người Việt Nam, tôi họ Nguyễn." },
      { level: "2. Ẩm thực Việt Nam", zh: "我朋友都很喜歡吃越南菜。", py: "Wǒ péngyou dōu hěn xǐhuān chī Yuènáncài.", vi: "Bạn bè tôi đều rất thích ăn món Việt Nam." },
      { level: "3. Đồ uống đặc trưng", zh: "越南的咖啡非常好喝！", py: "Yuènán de kāfēi fēicháng hǎohē!", vi: "Cà phê của Việt Nam ngon tuyệt vời!" }
    ],
    "哪國人": [
      { level: "1. Hỏi trực tiếp", zh: "請問你是哪國人？", py: "Qǐngwèn nǐ shì nǎ guó rén?", vi: "Xin hỏi bạn là người nước nào?" },
      { level: "2. Hỏi về thầy cô", zh: "你們的中文老師是哪國人？", py: "Nǐmen de Zhōngwén lǎoshī shì nǎ guó rén?", vi: "Giáo viên tiếng Trung của các bạn là người nước nào?" },
      { level: "3. Hỏi về bạn bè", zh: "照片裡的那個人是哪國人？", py: "Zhàopiàn lǐ de nà ge rén shì nǎ guó rén?", vi: "Người trong bức ảnh kia là người nước nào?" }
    ],
    "喜歡": [
      { level: "1. Sở thích đồ uống", zh: "我很喜歡喝臺灣茶。", py: "Wǒ hěn xǐhuān hē Táiwān chá.", vi: "Tôi rất thích uống trà Đài Loan." },
      { level: "2. Sở thích thể thao", zh: "你週末喜歡做什麼運動？", py: "Nǐ zhōumò xǐhuān zuò shénme yùndòng?", vi: "Cuối tuần bạn thích chơi môn thể thao gì?" },
      { level: "3. Kết hợp phó từ 都", zh: "我們都喜歡看臺灣電影。", py: "Wǒmen dōu xǐhuān kàn Táiwān diànyǐng.", vi: "Chúng tôi đều thích xem phim Đài Loan." }
    ],
    "喝茶": [
      { level: "1. Câu hỏi mời trà", zh: "請問你喜歡喝茶嗎？", py: "Qǐngwèn nǐ xǐhuān hē chá ma?", vi: "Xin hỏi bạn có thích uống trà không?" },
      { level: "2. So sánh thói quen", zh: "我不喝咖啡，我常喝茶。", py: "Wǒ bù hē kāfēi, wǒ cháng hē chá.", vi: "Tôi không uống cà phê, tôi thường uống trà." },
      { level: "3. Rủ bạn bè", zh: "週末我們一起去喝茶、聊天吧！", py: "Zhōumò wǒmen yìqǐ qù hē chá, liáotiān ba!", vi: "Cuối tuần chúng mình cùng đi uống trà, trò chuyện nhé!" }
    ],
    "咖啡": [
      { level: "1. Phủ định thói quen", zh: "我不喝咖啡，我喝烏龍茶。", py: "Wǒ bù hē kāfēi, wǒ hē wūlóngchá.", vi: "Tôi không uống cà phê, tôi uống trà Ô Long." },
      { level: "2. Hỏi sở thích", zh: "你早上常喝咖啡嗎？", py: "Nǐ zǎoshàng cháng hē kāfēi ma?", vi: "Buổi sáng bạn có thường uống cà phê không?" },
      { level: "3. Mua đồ uống", zh: "這兩杯咖啡一共多少錢？", py: "Zhè liǎng bēi kāfēi yígòng duōshǎo qián?", vi: "Hai ly cà phê này tổng cộng bao nhiêu tiền?" }
    ],
    "烏龍茶": [
      { level: "1. Khen trà ngon", zh: "臺灣的烏龍茶非常好喝。", py: "Táiwān de wūlóngchá fēicháng hǎohē.", vi: "Trà Ô Long của Đài Loan vô cùng ngon." },
      { level: "2. Sở thích gia đình", zh: "我爸爸很喜歡喝烏龍茶。", py: "Wǒ bàba hěn xǐhuān hē wūlóngchá.", vi: "Bố tôi rất thích uống trà Ô Long." },
      { level: "3. Gọi đồ uống", zh: "請問你要喝烏龍茶還是珍珠奶茶？", py: "Qǐngwèn nǐ yào hē wūlóngchá háishì zhēnzhū nǎichá?", vi: "Xin hỏi bạn muốn uống trà Ô Long hay trà sữa trân châu?" }
    ],
    "珍珠奶茶": [
      { level: "1. Món uống nổi tiếng", zh: "我也很喜歡喝珍珠奶茶。", py: "Wǒ yě hěn xǐhuān hē zhēnzhū nǎichá.", vi: "Tôi cũng rất thích uống trà sữa trân châu." },
      { level: "2. Hỏi giá tiền", zh: "請問這兩杯珍珠奶茶多少錢？", py: "Qǐngwèn zhè liǎng bēi zhēnzhū nǎichá duōshǎo qián?", vi: "Xin hỏi hai ly trà sữa trân châu này bao nhiêu tiền?" },
      { level: "3. Đãi bạn bè", zh: "今天我請客，我們去喝珍珠奶茶吧！", py: "Jīntiān wǒ qǐngkè, wǒmen qù hē zhēnzhū nǎichá ba!", vi: "Hôm nay tôi khao, chúng mình đi uống trà sữa trân châu nhé!" }
    ],
    "歡迎": [
      { level: "1. Chào đón đến Đài Loan", zh: "歡迎你來臺灣！", py: "Huānyíng nǐ lái Táiwān!", vi: "Chào mừng bạn đến Đài Loan!" },
      { level: "2. Mời đến nhà chơi", zh: "週末歡迎你們來我家喝茶！", py: "Zhōumò huānyíng nǐmen lái wǒ jiā hē chá!", vi: "Cuối tuần chào mừng các bạn đến nhà tôi uống trà!" },
      { level: "3. Tại cửa hàng", zh: "歡迎光臨！請問要買什麼？", py: "Huānyíng guānglín! Qǐngwèn yào mǎi shénme?", vi: "Hoan nghênh quý khách! Xin hỏi quý khách muốn mua gì?" }
    ],
    "照片": [
      { level: "1. Khen ảnh đẹp", zh: "這張照片很漂亮！", py: "Zhè zhāng zhàopiàn hěn piàoliang!", vi: "Bức ảnh này rất đẹp!" },
      { level: "2. Sở hữu với lượng từ 張", zh: "我有兩張家人的照片。", py: "Wǒ yǒu liǎng zhāng jiārén de zhàopiàn.", vi: "Tôi có hai bức ảnh gia đình." },
      { level: "3. Hỏi người trong ảnh", zh: "請問這張照片裡的人是誰？", py: "Qǐngwèn zhè zhāng zhàopiàn lǐ de rén shì shéi?", vi: "Xin hỏi người trong bức ảnh này là ai?" }
    ],
    "張": [
      { level: "1. Đi với 這 / 那", zh: "這張照片很好看。", py: "Zhè zhāng zhàopiàn hěn hǎokàn.", vi: "Bức ảnh này rất ưa nhìn." },
      { level: "2. Đi với số từ 兩", zh: "我有兩張臺灣的照片。", py: "Wǒ yǒu liǎng zhāng Táiwān de zhàopiàn.", vi: "Tôi có hai bức ảnh về Đài Loan." },
      { level: "3. Dùng làm họ Trương", zh: "張先生是我們的中文老師。", py: "Zhāng xiānsheng shì wǒmen de Zhōngwén lǎoshī.", vi: "Thầy Trương là giáo viên tiếng Trung của chúng tôi." }
    ],
    "家人": [
      { level: "1. Giới thiệu người nhà", zh: "他們都是我的家人。", py: "Tāmen dōu shì wǒ de jiārén.", vi: "Họ đều là người nhà của tôi." },
      { level: "2. Hoạt động cùng gia đình", zh: "我週末常跟家人去吃飯。", py: "Wǒ zhōumò cháng gēn jiārén qù chīfàn.", vi: "Cuối tuần tôi thường đi ăn cơm với gia đình." },
      { level: "3. Hỏi thăm gia đình", zh: "你的家人都好嗎？", py: "Nǐ de jiārén dōu hǎo ma?", vi: "Gia đình của bạn đều khỏe chứ?" }
    ],
    "爸爸": [
      { level: "1. Nghề nghiệp của bố", zh: "我爸爸是醫生。", py: "Wǒ bàba shì yīshēng.", vi: "Bố tôi là bác sĩ." },
      { level: "2. Sở thích của bố", zh: "我爸爸每天都喝烏龍茶。", py: "Wǒ bàba měitiān dōu hē wūlóngchá.", vi: "Bố tôi ngày nào cũng uống trà Ô Long." },
      { level: "3. Hoạt động cuối tuần", zh: "週末我常跟爸爸去打網球。", py: "Zhōumò wǒ cháng gēn bàba qù dǎ wǎngqiú.", vi: "Cuối tuần tôi thường đi đánh quần vợt với bố." }
    ],
    "媽媽": [
      { level: "1. Nghề nghiệp của mẹ", zh: "我媽媽是大學老師。", py: "Wǒ māma shì dàxué lǎoshī.", vi: "Mẹ tôi là giảng viên đại học." },
      { level: "2. Khen món mẹ nấu", zh: "我媽媽做的越南菜非常好吃！", py: "Wǒ māma zuò de Yuènáncài fēicháng hǎochī!", vi: "Món Việt Nam mẹ tôi nấu ngon tuyệt vời!" },
      { level: "3. Đi xem phim cùng mẹ", zh: "今天晚上我跟媽媽去看電影。", py: "Jīntiān wǎnshàng wǒ gēn māma qù kàn diànyǐng.", vi: "Tối nay tôi đi xem phim với mẹ." }
    ],
    "哥哥": [
      { level: "1. Giới thiệu anh trai", zh: "我有一個哥哥，他也是大學生。", py: "Wǒ yǒu yí ge gēge, tā yě shì dàxuéshēng.", vi: "Tôi có một anh trai, anh ấy cũng là sinh viên đại học." },
      { level: "2. Chơi thể thao cùng anh", zh: "我哥哥很喜歡打籃球。", py: "Wǒ gēge hěn xǐhuān dǎ lánqiú.", vi: "Anh trai tôi rất thích chơi bóng rổ." },
      { level: "3. Phủ định sở hữu", zh: "我沒有哥哥，我有一個姐姐。", py: "Wǒ méiyǒu gēge, wǒ yǒu yí ge jiějie.", vi: "Tôi không có anh trai, tôi có một chị gái." }
    ],
    "姐姐": [
      { level: "1. Khen chị gái", zh: "我姐姐很漂亮，也很喜歡聽音樂。", py: "Wǒ jiějie hěn piàoliang, yě hěn xǐhuān tīng yīnyuè.", vi: "Chị gái tôi rất xinh đẹp, cũng rất thích nghe nhạc." },
      { level: "2. Nghề nghiệp của chị", zh: "他姐姐在臺灣當老師。", py: "Tā jiějie zài Táiwān dāng lǎoshī.", vi: "Chị gái anh ấy làm giáo viên ở Đài Loan." },
      { level: "3. Đi uống trà sữa", zh: "週末我常跟姐姐去喝珍珠奶茶。", py: "Zhōumò wǒ cháng gēn jiějie qù hē zhēnzhū nǎichá.", vi: "Cuối tuần tôi thường đi uống trà sữa trân châu với chị gái." }
    ],
    "兩": [
      { level: "1. Đi với lượng từ 個", zh: "我家有兩個人。", py: "Wǒ jiā yǒu liǎng ge rén.", vi: "Nhà tôi có hai người." },
      { level: "2. Đi với lượng từ 張", zh: "我有兩張家人的照片。", py: "Wǒ yǒu liǎng zhāng jiārén de zhàopiàn.", vi: "Tôi có hai bức ảnh gia đình." },
      { level: "3. Đi với lượng từ 杯", zh: "請問這兩杯烏龍茶多少錢？", py: "Qǐngwèn zhè liǎng bēi wūlóngchá duōshǎo qián?", vi: "Xin hỏi hai ly trà Ô Long này bao nhiêu tiền?" }
    ],
    "老師": [
      { level: "1. Giới thiệu nghề nghiệp", zh: "我媽媽是老師。", py: "Wǒ māma shì lǎoshī.", vi: "Mẹ tôi là giáo viên." },
      { level: "2. Chào thầy cô", zh: "王老師好！請問您今天喝茶嗎？", py: "Wáng lǎoshī hǎo! Qǐngwèn nín jīntiān hē chá ma?", vi: "Chào thầy Vương! Xin hỏi hôm nay thầy có uống trà không ạ?" },
      { level: "3. Học tiếng Trung", zh: "我們的中文老師是臺灣人。", py: "Wǒmen de Zhōngwén lǎoshī shì Táiwānrén.", vi: "Giáo viên tiếng Trung của chúng tôi là người Đài Loan." }
    ],
    "醫生": [
      { level: "1. Giới thiệu bố", zh: "我爸爸是醫生。", py: "Wǒ bàba shì yīshēng.", vi: "Bố tôi là bác sĩ." },
      { level: "2. Câu hỏi với 也", zh: "他哥哥也是醫生嗎？", py: "Tā gēge yě shì yīshēng ma?", vi: "Anh trai anh ấy cũng là bác sĩ phải không?" },
      { level: "3. Kết hợp phó từ 都", zh: "陳先生和陳太太都是醫生。", py: "Chén xiānsheng hé Chén tàitai dōu shì yīshēng.", vi: "Ông Trần và bà Trần đều là bác sĩ." }
    ],
    "大學生": [
      { level: "1. Giới thiệu bản thân", zh: "我是越南的大學生。", py: "Wǒ shì Yuènán de dàxuéshēng.", vi: "Tôi là sinh viên đại học người Việt Nam." },
      { level: "2. Dùng với phó từ 都", zh: "我和妹妹都是大學生。", py: "Wǒ hé mèimei dōu shì dàxuéshēng.", vi: "Tôi và em gái đều là sinh viên đại học." },
      { level: "3. Hỏi đối phương", zh: "請問你們也是臺灣的大學生嗎？", py: "Qǐngwèn nǐmen yě shì Táiwān de dàxuéshēng ma?", vi: "Xin hỏi các bạn cũng là sinh viên đại học ở Đài Loan phải không?" }
    ],
    "漂亮": [
      { level: "1. Khen bức ảnh", zh: "這張照片很漂亮！", py: "Zhè zhāng zhàopiàn hěn piàoliang!", vi: "Bức ảnh này rất đẹp!" },
      { level: "2. Khen người", zh: "你姐姐非常漂亮。", py: "Nǐ jiějie fēicháng piàoliang.", vi: "Chị gái của bạn vô cùng xinh đẹp." },
      { level: "3. Khen phong cảnh", zh: "我覺得臺灣的春天太漂亮了！", py: "Wǒ juéde Táiwān de chūntiān tài piàoliang le!", vi: "Tôi thấy mùa xuân ở Đài Loan đẹp quá đi!" }
    ],
    "都": [
      { level: "1. Tất cả đều là...", zh: "我們都是大學生。", py: "Wǒmen dōu shì dàxuéshēng.", vi: "Chúng tôi đều là sinh viên đại học." },
      { level: "2. Cùng chung sở thích", zh: "我和朋友都很喜歡喝珍珠奶茶。", py: "Wǒ hé péngyou dōu hěn xǐhuān hē zhēnzhū nǎichá.", vi: "Tôi và bạn đều rất thích uống trà sữa trân châu." },
      { level: "3. Giới thiệu gia đình", zh: "他們都是我的家人。", py: "Tāmen dōu shì wǒ de jiārén.", vi: "Họ đều là người nhà của tôi." }
    ],
    "沒有": [
      { level: "1. Phủ định sở hữu", zh: "我沒有哥哥，我有一個妹妹。", py: "Wǒ méiyǒu gēge, wǒ yǒu yí ge mèimei.", vi: "Tôi không có anh trai, tôi có một em gái." },
      { level: "2. So sánh kém hơn", zh: "夏天沒有春天那麼舒服。", py: "Xiàtiān méiyǒu chūntiān nàme shūfu.", vi: "Mùa hè không dễ chịu như mùa xuân." },
      { level: "3. Hỏi có hay không", zh: "請問你有沒有家人的照片？", py: "Qǐngwèn nǐ yǒu méiyǒu jiārén de zhàopiàn?", vi: "Xin hỏi bạn có ảnh gia đình không?" }
    ],
    "週末": [
      { level: "1. Hỏi kế hoạch", zh: "這個週末你做什麼？", py: "Zhège zhōumò nǐ zuò shénme?", vi: "Cuối tuần này bạn làm gì?" },
      { level: "2. Thói quen cuối tuần", zh: "我週末常跟朋友去打網球。", py: "Wǒ zhōumò cháng gēn péngyou qù dǎ wǎngqiú.", vi: "Cuối tuần tôi thường đi đánh quần vợt với bạn." },
      { level: "3. Kết hợp 的時候", zh: "週末的時候，我喜歡在家聽音樂。", py: "Zhōumò de shíhou, wǒ xǐhuān zài jiā tīng yīnyuè.", vi: "Vào lúc cuối tuần, tôi thích ở nhà nghe nhạc." }
    ],
    "常": [
      { level: "1. Đi với hoạt động thể thao", zh: "我週末常去運動。", py: "Wǒ zhōumò cháng qù yùndòng.", vi: "Cuối tuần tôi thường đi tập thể thao." },
      { level: "2. Đi cùng bạn bè", zh: "他常跟朋友去看電影。", py: "Tā cháng gēn péngyou qù kàn diànyǐng.", vi: "Anh ấy thường đi xem phim với bạn." },
      { level: "3. Thói quen ăn uống", zh: "你們常吃臺灣菜還是越南菜？", py: "Nǐmen cháng chī Táiwāncài háishì Yuènáncài?", vi: "Các bạn thường ăn món Đài Loan hay món Việt Nam?" }
    ],
    "打網球": [
      { level: "1. Sở thích thể thao", zh: "我很喜歡打網球。", py: "Wǒ hěn xǐhuān dǎ wǎngqiú.", vi: "Tôi rất thích đánh quần vợt." },
      { level: "2. Đi đánh cùng bạn", zh: "我週末常跟朋友去打網球。", py: "Wǒ zhōumò cháng gēn péngyou qù dǎ wǎngqiú.", vi: "Cuối tuần tôi thường đi đánh quần vợt với bạn." },
      { level: "3. Rủ rê bằng 吧", zh: "今天天氣很好，我們一起去打網球吧！", py: "Jīntiān tiānqì hěn hǎo, wǒmen yìqǐ qù dǎ wǎngqiú ba!", vi: "Hôm nay thời tiết rất đẹp, chúng mình cùng đi đánh quần vợt nhé!" }
    ],
    "打籃球": [
      { level: "1. Hỏi sở thích", zh: "你喜歡打籃球嗎？", py: "Nǐ xǐhuān dǎ lánqiú ma?", vi: "Bạn có thích chơi bóng rổ không?" },
      { level: "2. Rủ đi chơi bóng", zh: "我們下午一起去打籃球吧！", py: "Wǒmen xiàwǔ yìqǐ qù dǎ lánqiú ba!", vi: "Chiều nay chúng mình cùng đi chơi bóng rổ nhé!" },
      { level: "3. Thói quen của anh trai", zh: "我哥哥週末常跟朋友去打籃球。", py: "Wǒ gēge zhōumò cháng gēn péngyou qù dǎ lánqiú.", vi: "Cuối tuần anh trai tôi thường đi chơi bóng rổ với bạn." }
    ],
    "看電影": [
      { level: "1. Xem phim cuối tuần", zh: "週末的時候，我常去看電影。", py: "Zhōumò de shíhou, wǒ cháng qù kàn diànyǐng.", vi: "Vào dịp cuối tuần, tôi thường đi xem phim." },
      { level: "2. Xem phim Đài Loan", zh: "我很喜歡跟家人去看臺灣電影。", py: "Wǒ hěn xǐhuān gēn jiārén qù kàn Táiwān diànyǐng.", vi: "Tôi rất thích đi xem phim Đài Loan cùng gia đình." },
      { level: "3. Rủ đi xem phim tối nay", zh: "今天晚上我們一起去看電影吧！", py: "Jīntiān wǎnshàng wǒmen yìqǐ qù kàn diànyǐng ba!", vi: "Tối nay chúng mình cùng đi xem phim nhé!" }
    ],
    "聽音樂": [
      { level: "1. Thư giãn ở nhà", zh: "我在家看書、聽音樂。", py: "Wǒ zài jiā kànshū, tīng yīnyuè.", vi: "Tôi ở nhà đọc sách, nghe nhạc." },
      { level: "2. Hỏi sở thích âm nhạc", zh: "你喜歡聽什麼音樂？", py: "Nǐ xǐhuān tīng shénme yīnyuè?", vi: "Bạn thích nghe nhạc gì?" },
      { level: "3. Khi rảnh rỗi", zh: "週末的時候，我常在家聽臺灣音樂。", py: "Zhōumò de shíhou, wǒ cháng zài jiā tīng Táiwān yīnyuè.", vi: "Lúc cuối tuần, tôi thường ở nhà nghe nhạc Đài Loan." }
    ],
    "運動": [
      { level: "1. Hỏi môn thể thao", zh: "請問你常做什麼運動？", py: "Qǐngwèn nǐ cháng zuò shénme yùndòng?", vi: "Xin hỏi bạn thường tập môn thể thao gì?" },
      { level: "2. Thói quen cuối tuần", zh: "我週末常跟朋友去運動。", py: "Wǒ zhōumò cháng gēn péngyou qù yùndòng.", vi: "Cuối tuần tôi thường đi tập thể thao với bạn." },
      { level: "3. Gia đình yêu thể thao", zh: "我們全家都很喜歡運動。", py: "Wǒmen quánjiā dōu hěn xǐhuān yùndòng.", vi: "Cả nhà chúng tôi đều rất thích tập thể thao." }
    ],
    "請客": [
      { level: "1. Đãi bữa tối", zh: "今天晚上我請客！", py: "Jīntiān wǎnshàng wǒ qǐngkè!", vi: "Tối hôm nay tôi mời khách (tôi khao)!" },
      { level: "2. Mời ăn món Đài Loan", zh: "今天我請客，我們去吃臺灣菜吧！", py: "Jīntiān wǒ qǐngkè, wǒmen qù chī Táiwāncài ba!", vi: "Hôm nay tôi đãi, chúng mình đi ăn món Đài Loan nhé!" },
      { level: "3. Mời uống trà sữa", zh: "王先生請客，我們都喝珍珠奶茶。", py: "Wáng xiānsheng qǐngkè, wǒmen dōu hē zhēnzhū nǎichá.", vi: "Anh Vương khao, chúng tôi đều uống trà sữa trân châu." }
    ],
    "臺灣菜": [
      { level: "1. Rủ đi ăn", zh: "我們一起去吃臺灣菜吧！", py: "Wǒmen yìqǐ qù chī Táiwāncài ba!", vi: "Chúng ta cùng đi ăn món Đài Loan nhé!" },
      { level: "2. Khen món ăn", zh: "我覺得臺灣菜很好吃。", py: "Wǒ juéde Táiwāncài hěn hǎochī.", vi: "Tôi cảm thấy món ăn Đài Loan rất ngon." },
      { level: "3. Hỏi sở thích", zh: "請問你喜歡吃臺灣菜嗎？", py: "Qǐngwèn nǐ xǐhuān chī Táiwāncài ma?", vi: "Xin hỏi bạn có thích ăn món Đài Loan không?" }
    ],
    "越南菜": [
      { level: "1. Sở thích ẩm thực", zh: "我也很喜歡吃越南菜。", py: "Wǒ yě hěn xǐhuān chī Yuènáncài.", vi: "Tôi cũng rất thích ăn món Việt Nam." },
      { level: "2. Rủ bạn Đài Loan đi ăn", zh: "週末我們一起去吃越南菜吧！", py: "Zhōumò wǒmen yìqǐ qù chī Yuènáncài ba!", vi: "Cuối tuần chúng mình cùng đi ăn món Việt Nam nhé!" },
      { level: "3. Nhận xét hương vị", zh: "那家店的越南菜非常好吃，也不貴。", py: "Nà jiā diàn de Yuènáncài fēicháng hǎochī, yě bú guì.", vi: "Món Việt Nam của quán đó cực kỳ ngon mà cũng không đắt." }
    ],
    "時候": [
      { level: "1. Dịp cuối tuần", zh: "週末的時候，我常去看電影。", py: "Zhōumò de shíhou, wǒ cháng qù kàn diànyǐng.", vi: "Vào dịp cuối tuần, tôi thường đi xem phim." },
      { level: "2. Khi trời nóng", zh: "夏天的時候，我很喜歡喝冰茶。", py: "Xiàtiān de shíhou, wǒ hěn xǐhuān hē bīngchá.", vi: "Vào mùa hè, tôi rất thích uống trà đá." },
      { level: "3. Hỏi thời điểm", zh: "請問你什麼時候來臺灣？", py: "Qǐngwèn nǐ shénme shíhou lái Táiwān?", vi: "Xin hỏi khi nào bạn đến Đài Loan?" }
    ],
    "一起": [
      { level: "1. Rủ đi ăn tối", zh: "我們晚上一起去吃晚飯吧！", py: "Wǒmen wǎnshàng yìqǐ qù chī wǎnfàn ba!", vi: "Tối nay chúng mình cùng đi ăn tối nhé!" },
      { level: "2. Cùng chơi thể thao", zh: "週末我常跟朋友一起去打網球。", py: "Zhōumò wǒ cháng gēn péngyou yìqǐ qù dǎ wǎngqiú.", vi: "Cuối tuần tôi thường cùng bạn đi đánh quần vợt." },
      { level: "3. Cùng học tiếng Trung", zh: "我們一起學繁體中文吧！", py: "Wǒmen yìqǐ xué fántǐ Zhōngwén ba!", vi: "Chúng ta cùng nhau học tiếng Trung Phồn thể nhé!" }
    ],
    "天氣": [
      { level: "1. Khen thời tiết đẹp", zh: "今天的天氣很好！", py: "Jīntiān de tiānqì hěn hǎo!", vi: "Thời tiết hôm nay rất đẹp!" },
      { level: "2. Hỏi cảm nhận thời tiết", zh: "你覺得臺灣的天氣怎麼樣？", py: "Nǐ juéde Táiwān de tiānqì zěnmeyàng?", vi: "Bạn cảm thấy thời tiết ở Đài Loan thế nào?" },
      { level: "3. Thời tiết mùa xuân", zh: "春天的天氣非常舒服。", py: "Chūntiān de tiānqì fēicháng shūfu.", vi: "Thời tiết mùa xuân vô cùng dễ chịu." }
    ],
    "春天": [
      { level: "1. Cảm nhận mùa xuân", zh: "我覺得春天很舒服。", py: "Wǒ juéde chūntiān hěn shūfu.", vi: "Tôi cảm thấy mùa xuân rất dễ chịu." },
      { level: "2. So sánh các mùa", zh: "夏天沒有春天那麼舒服。", py: "Xiàtiān méiyǒu chūntiān nàme shūfu.", vi: "Mùa hè không dễ chịu như mùa xuân." },
      { level: "3. Du lịch mùa xuân", zh: "春天的時候，我很喜歡去臺灣旅行。", py: "Chūntiān de shíhou, wǒ hěn xǐhuān qù Táiwān lǚxíng.", vi: "Vào mùa xuân, tôi rất thích đi du lịch Đài Loan." }
    ],
    "夏天": [
      { level: "1. Miêu tả nắng nóng", zh: "臺灣的夏天非常熱。", py: "Táiwān de xiàtiān fēicháng rè.", vi: "Mùa hè ở Đài Loan vô cùng nóng." },
      { level: "2. Cấu trúc so sánh", zh: "那裡的夏天沒有春天那麼舒服。", py: "Nàlǐ de xiàtiān méiyǒu chūntiān nàme shūfu.", vi: "Mùa hè ở đó không dễ chịu như mùa xuân." },
      { level: "3. Sở thích mùa hè", zh: "你喜歡夏天還是冬天？", py: "Nǐ xǐhuān xiàtiān háishì dōngtiān?", vi: "Bạn thích mùa hè hay mùa đông?" }
    ],
    "覺得": [
      { level: "1. Nêu cảm nhận", zh: "我覺得春天很舒服。", py: "Wǒ juéde chūntiān hěn shūfu.", vi: "Tôi cảm thấy mùa xuân rất dễ chịu." },
      { level: "2. Hỏi ý kiến đối phương", zh: "你覺得這杯烏龍茶怎麼樣？", py: "Nǐ juéde zhè bēi wūlóngchá zěnmeyàng?", vi: "Bạn thấy ly trà Ô Long này thế nào?" },
      { level: "3. Nhận xét giá cả", zh: "我覺得這家店的東西很便宜。", py: "Wǒ juéde zhè jiā diàn de dōngxi hěn piányi.", vi: "Tôi thấy đồ của cửa hàng này rất rẻ." }
    ],
    "舒服": [
      { level: "1. Thời tiết dễ chịu", zh: "秋天的天氣非常舒服。", py: "Qiūtiān de tiānqì fēicháng shūfu.", vi: "Thời tiết mùa thu vô cùng dễ chịu." },
      { level: "2. So sánh 沒有...那麼", zh: "夏天非常熱，沒有春天那麼舒服。", py: "Xiàtiān fēicháng rè, méiyǒu chūntiān nàme shūfu.", vi: "Mùa hè rất nóng, không dễ chịu như mùa xuân." },
      { level: "3. Không gian quán trà", zh: "這家茶館很漂亮，也很舒服。", py: "Zhè jiā cháguǎn hěn piàoliang, yě hěn shūfu.", vi: "Quán trà này rất đẹp và cũng rất thoải mái." }
    ],
    "非常": [
      { level: "1. Nhấn mạnh thời tiết", zh: "那裡的夏天非常熱。", py: "Nàlǐ de xiàtiān fēicháng rè.", vi: "Mùa hè ở đó vô cùng nóng." },
      { level: "2. Khen đồ uống", zh: "臺灣的珍珠奶茶非常好喝！", py: "Táiwān de zhēnzhū nǎichá fēicháng hǎohē!", vi: "Trà sữa trân châu của Đài Loan cực kỳ ngon!" },
      { level: "3. Khen con người", zh: "我們的中文老師非常親切。", py: "Wǒmen de Zhōngwén lǎoshī fēicháng qīnqiè.", vi: "Giáo viên tiếng Trung của chúng tôi vô cùng thân thiện." }
    ],
    "多少錢": [
      { level: "1. Hỏi giá một món", zh: "請問這支手機多少錢？", py: "Qǐngwèn zhè zhī shǒujī duōshǎo qián?", vi: "Xin hỏi chiếc điện thoại này bao nhiêu tiền?" },
      { level: "2. Hỏi tổng tiền", zh: "請問這兩杯茶一共多少錢？", py: "Qǐngwèn zhè liǎng bēi chá yígòng duōshǎo qián?", vi: "Xin hỏi hai ly trà này tổng cộng bao nhiêu tiền?" },
      { level: "3. Mua đồ ăn", zh: "請問這個臺灣菜多少錢？", py: "Qǐngwèn zhège Táiwāncài duōshǎo qián?", vi: "Xin hỏi món ăn Đài Loan này bao nhiêu tiền?" }
    ],
    "一共": [
      { level: "1. Tính tiền tại quầy", zh: "請問一共多少錢？", py: "Qǐngwèn yígòng duōshǎo qián?", vi: "Xin hỏi tổng cộng bao nhiêu tiền?" },
      { level: "2. Mua nhiều món", zh: "兩杯咖啡和一杯茶，一共多少錢？", py: "Liǎng bēi kāfēi hé yì bēi chá, yígòng duōshǎo qián?", vi: "Hai ly cà phê và một ly trà, tổng cộng bao nhiêu tiền?" },
      { level: "3. Đếm số người", zh: "我們家一共有五個人。", py: "Wǒmen jiā yígòng yǒu wǔ ge rén.", vi: "Gia đình chúng tôi tổng cộng có 5 người." }
    ],
    "太貴了": [
      { level: "1. Nhận xét giá đắt", zh: "那支手機太貴了！", py: "Nà zhī shǒujī tài guì le!", vi: "Chiếc điện thoại đó đắt quá rồi!" },
      { level: "2. Phủ định 不太貴", zh: "這家店的臺灣菜不太貴。", py: "Zhè jiā diàn de Táiwāncài bú tài guì.", vi: "Món Đài Loan ở quán này không đắt lắm." },
      { level: "3. So sánh khi mua sắm", zh: "這個太貴了，那個很便宜。", py: "Zhège tài guì le, nàge hěn piányi.", vi: "Cái này đắt quá, cái kia rất rẻ." }
    ],
    "便宜": [
      { level: "1. Khen giá rẻ", zh: "這家店的東西很便宜。", py: "Zhè jiā diàn de dōngxi hěn piányi.", vi: "Đồ của cửa hàng này rất rẻ." },
      { level: "2. Vừa ngon vừa rẻ", zh: "越南咖啡很好喝，也很便宜！", py: "Yuènán kāfēi hěn hǎohē, yě hěn piányi!", vi: "Cà phê Việt Nam rất ngon mà cũng rất rẻ!" },
      { level: "3. Cảm thán 太...了", zh: "這杯珍珠奶茶太便宜了！", py: "Zhè bēi zhēnzhū nǎichá tài piányi le!", vi: "Ly trà sữa trân châu này rẻ quá đi!" }
    ]
  };

  // Returns 3 rich Traditional Chinese usage examples + related compound words for ANY word or single character
  function getThreeExamplesFor(queryStr) {
    const q = toTraditional((queryStr || "").trim());
    if (!q) return { query: "", compounds: [], examples: [] };

    // Related compound words from VOCAB_DB containing the query
    const compounds = VOCAB_DB.filter((v) => v.hz.includes(q)).map((v) => ({
      hz: v.hz,
      py: v.py,
      hv: v.hv || "",
      vi: v.vi,
      lesson: v.lesson
    }));

    // 1. Direct match in WORD_EXAMPLES_DB
    if (WORD_EXAMPLES_DB[q] && WORD_EXAMPLES_DB[q].length >= 3) {
      return {
        query: q,
        compounds,
        examples: WORD_EXAMPLES_DB[q].slice(0, 3)
      };
    }

    // 2. Collect distinct sentences containing q across WORD_EXAMPLES_DB, SENTENCES_DB, VOCAB_DB, ROLEPLAY_DB
    const collected = [];
    const seenZh = new Set();

    function addCandidate(level, zh, py, vi) {
      if (!zh || seenZh.has(zh) || !zh.includes(q)) return;
      seenZh.add(zh);
      collected.push({ level, zh, py, vi });
    }

    Object.keys(WORD_EXAMPLES_DB).forEach((k) => {
      WORD_EXAMPLES_DB[k].forEach((ex) => {
        if (ex.zh.includes(q)) {
          addCandidate(`Ví dụ với 『${k}』`, ex.zh, ex.py, ex.vi);
        }
      });
    });

    SENTENCES_DB.forEach((s) => {
      if (s.zh.includes(q)) {
        addCandidate(s.tag, s.zh, s.py, s.vi);
      }
    });

    VOCAB_DB.forEach((v) => {
      if (v.exZh && v.exZh.includes(q)) {
        addCandidate(`Bài ${v.lesson} • ${v.hz}`, v.exZh, v.exPy, v.exVi);
      }
    });

    ROLEPLAY_DB.forEach((r) => {
      if (r.zh.includes(q)) addCandidate(`Hội thoại Bài ${r.lesson}`, r.zh, r.py, r.vi);
      if (r.questionZh.includes(q)) addCandidate(`Câu hỏi Bài ${r.lesson}`, r.questionZh, r.questionPy, r.questionVi);
    });

    // Fallback synthesized examples if a character has fewer than 3 matches
    const fallbacks = [
      {
        level: "Ví dụ giao tiếp 1",
        zh: `我很喜歡「${q}」這個字。`,
        py: `Wǒ hěn xǐhuān "${CHAR_PINYIN_MAP[q] || q}" zhège zì.`,
        vi: `Tôi rất thích chữ "${q}" này.`
      },
      {
        level: "Ví dụ giao tiếp 2",
        zh: `請問「${q}」怎麼說？`,
        py: `Qǐngwèn "${CHAR_PINYIN_MAP[q] || q}" zěnme shuō?`,
        vi: `Xin hỏi chữ "${q}" nói như thế nào?`
      },
      {
        level: "Ví dụ giao tiếp 3",
        zh: `我們今天一起學「${q}」吧！`,
        py: `Wǒmen jīntiān yìqǐ xué "${CHAR_PINYIN_MAP[q] || q}" ba!`,
        vi: `Hôm nay chúng ta cùng học chữ "${q}" nhé!`
      }
    ];
    for (const fb of fallbacks) {
      if (collected.length >= 3) break;
      addCandidate(fb.level, fb.zh, fb.py, fb.vi);
    }

    return {
      query: q,
      compounds,
      examples: collected.slice(0, 3).map((ex, idx) => ({
        level: `${idx + 1}. ${ex.level.replace(/^[123]\.\s*/, "")}`,
        zh: ex.zh,
        py: ex.py,
        vi: ex.vi
      }))
    };
  }

  return {
    LESSONS_META,
    WORD_EXAMPLES_DB,
    getThreeExamplesFor,
    SCENE_SVGS,
    CHAR_RADICAL_NOTES,
    VOCAB_DB,
    GRAMMAR_DB,
    SENTENCES_DB,
    ROLEPLAY_DB,
    DETECTIVE_DB,
    CHAR_PINYIN_MAP,
    HOMOPHONE_GROUPS,
    toTraditional,
    getWordEtymology,
    analyzeSentenceTones
  };
})();
