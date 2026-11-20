/**
 * ============================================================================
 * MODULE 1: CURRICULUM DATA (當代中文課程 1 — 100% 繁體中文)
 * Structured scientifically by Lesson (1..4) and Half-Lesson (Part 1 & Part 2)
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

  // Clean, cohesive SVG scene illustrations for flashcards & sentences
  const SCENE_SVGS = {
    greeting: `<svg viewBox="0 0 240 110" width="220" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="110" rx="14" fill="hsl(36,35%,94%)"/>
      <circle cx="195" cy="28" r="14" fill="hsl(12,78%,62%)" opacity="0.25"/>
      <path d="M115 22L122 38H108L115 22Z" fill="hsl(8,72%,48%)"/>
      <rect x="109" y="38" width="12" height="48" rx="2" fill="hsl(200,32%,36%)"/>
      <circle cx="72" cy="48" r="14" fill="hsl(24,55%,45%)"/>
      <rect x="56" y="65" width="32" height="28" rx="8" fill="hsl(8,72%,50%)"/>
      <circle cx="164" cy="48" r="14" fill="hsl(220,30%,32%)"/>
      <rect x="148" y="65" width="32" height="28" rx="8" fill="hsl(160,55%,36%)"/>
      <rect x="86" y="18" width="68" height="22" rx="6" fill="#fff" stroke="hsl(34,20%,82%)"/>
      <text x="120" y="33" text-anchor="middle" font-size="11" font-weight="700" fill="hsl(8,72%,42%)">你好！請問貴姓？</text>
    </svg>`,
    tea: `<svg viewBox="0 0 240 110" width="220" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="110" rx="14" fill="hsl(36,35%,94%)"/>
      <rect x="64" y="42" width="44" height="46" rx="10" fill="hsl(158,48%,38%)"/>
      <path d="M108 52H118C122 52 122 72 118 72H108" stroke="hsl(158,48%,38%)" stroke-width="5"/>
      <path d="M78 32C78 24 84 24 84 18M92 32C92 24 98 24 98 18" stroke="hsl(34,60%,55%)" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="138" y="34" width="38" height="54" rx="8" fill="hsl(32,72%,72%)" stroke="hsl(28,45%,42%)" stroke-width="2"/>
      <line x1="157" y1="16" x2="157" y2="42" stroke="hsl(8,72%,48%)" stroke-width="5" stroke-linecap="round"/>
      <circle cx="148" cy="78" r="3.5" fill="hsl(24,45%,22%)"/><circle cx="158" cy="80" r="3.5" fill="hsl(24,45%,22%)"/><circle cx="166" cy="77" r="3.5" fill="hsl(24,45%,22%)"/>
    </svg>`,
    family: `<svg viewBox="0 0 240 110" width="220" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="110" rx="14" fill="hsl(36,35%,94%)"/>
      <rect x="42" y="16" width="156" height="78" rx="10" fill="#fff" stroke="hsl(32,35%,70%)" stroke-width="3"/>
      <circle cx="80" cy="48" r="11" fill="hsl(212,45%,42%)"/><rect x="67" y="62" width="26" height="22" rx="6" fill="hsl(212,45%,42%)"/>
      <circle cx="120" cy="48" r="11" fill="hsl(8,68%,52%)"/><rect x="107" y="62" width="26" height="22" rx="6" fill="hsl(8,68%,52%)"/>
      <circle cx="160" cy="52" r="9" fill="hsl(158,52%,38%)"/><rect x="149" y="64" width="22" height="20" rx="6" fill="hsl(158,52%,38%)"/>
    </svg>`,
    weekend: `<svg viewBox="0 0 240 110" width="220" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="110" rx="14" fill="hsl(36,35%,94%)"/>
      <circle cx="85" cy="54" r="24" stroke="hsl(8,72%,48%)" stroke-width="3.5" fill="hsl(38,40%,98%)"/>
      <line x1="68" y1="38" x2="102" y2="70" stroke="hsl(34,20%,75%)" stroke-width="1.5"/>
      <line x1="102" y1="38" x2="68" y2="70" stroke="hsl(34,20%,75%)" stroke-width="1.5"/>
      <circle cx="145" cy="60" r="13" fill="hsl(158,62%,42%)"/>
      <path d="M136 53C142 58 142 62 136 67M154 53C148 58 148 62 154 67" stroke="#fff" stroke-width="2"/>
    </svg>`,
    seasons: `<svg viewBox="0 0 240 110" width="220" height="100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="240" height="110" rx="14" fill="hsl(36,35%,94%)"/>
      <circle cx="76" cy="46" r="18" fill="hsl(34,90%,54%)"/>
      <path d="M135 66C135 55 144 48 154 48C163 48 171 54 172 63C178 63 182 67 182 73C182 79 177 82 171 82H138C131 82 127 77 127 71C127 66 131 64 135 66Z" fill="hsl(210,55%,62%)"/>
      <path d="M55 86Q95 72 135 86T205 84" stroke="hsl(158,52%,38%)" stroke-width="4" stroke-linecap="round"/>
    </svg>`
  };

  // Core Vocabulary Database (Lessons 1–4, Part 1 & Part 2 — 100% Traditional Chinese)
  const VOCAB_DB = [
    // LESSON 1 - PART 1
    { id: "v1_1", lesson: 1, part: 1, hz: "請問", py: "qǐngwèn", vi: "Xin hỏi", pos: "Động từ", scene: "greeting", exZh: "請問您貴姓？", exPy: "Qǐngwèn nín guìxìng?", exVi: "Xin hỏi quý danh của ngài là gì?" },
    { id: "v1_2", lesson: 1, part: 1, hz: "貴姓", py: "guìxìng", vi: "Quý danh (hỏi họ lịch sự)", pos: "Danh/Động", scene: "greeting", exZh: "請問你貴姓？", exPy: "Qǐngwèn nǐ guìxìng?", exVi: "Xin hỏi bạn họ gì?" },
    { id: "v1_3", lesson: 1, part: 1, hz: "名字", py: "míngzi", vi: "Tên", pos: "Danh từ", scene: "greeting", exZh: "你叫什麼名字？", exPy: "Nǐ jiào shénme míngzi?", exVi: "Bạn tên là gì?" },
    { id: "v1_4", lesson: 1, part: 1, hz: "小姐", py: "xiǎojiě", vi: "Cô, tiểu thư", pos: "Danh từ", scene: "greeting", exZh: "陳小姐是臺灣人。", exPy: "Chén xiǎojiě shì Táiwānrén.", exVi: "Cô Trần là người Đài Loan." },
    { id: "v1_5", lesson: 1, part: 1, hz: "先生", py: "xiānsheng", vi: "Ông, ngài, tiên sinh", pos: "Danh từ", scene: "greeting", exZh: "王先生你好！", exPy: "Wáng xiānsheng nǐ hǎo!", exVi: "Xin chào ông Vương!" },
    { id: "v1_6", lesson: 1, part: 1, hz: "臺灣", py: "Táiwān", vi: "Đài Loan", pos: "Danh từ riêng", scene: "greeting", exZh: "歡迎你來臺灣！", exPy: "Huānyíng nǐ lái Táiwān!", exVi: "Chào mừng bạn đến Đài Loan!" },
    { id: "v1_7", lesson: 1, part: 1, hz: "越南", py: "Yuènán", vi: "Việt Nam", pos: "Danh từ riêng", scene: "greeting", exZh: "我是越南人。", exPy: "Wǒ shì Yuènánrén.", exVi: "Tôi là người Việt Nam." },
    { id: "v1_8", lesson: 1, part: 1, hz: "哪國人", py: "nǎ guó rén", vi: "Người nước nào", pos: "Cụm danh từ", scene: "greeting", exZh: "請問你是哪國人？", exPy: "Qǐngwèn nǐ shì nǎ guó rén?", exVi: "Xin hỏi bạn là người nước nào?" },

    // LESSON 1 - PART 2
    { id: "v1_9", lesson: 1, part: 2, hz: "喜歡", py: "xǐhuān", vi: "Thích", pos: "Động từ", scene: "tea", exZh: "我很喜歡喝臺灣茶。", exPy: "Wǒ hěn xǐhuān hē Táiwān chá.", exVi: "Tôi rất thích uống trà Đài Loan." },
    { id: "v1_10", lesson: 1, part: 2, hz: "喝茶", py: "hē chá", vi: "Uống trà", pos: "Động-Tân", scene: "tea", exZh: "你喜歡喝茶嗎？", exPy: "Nǐ xǐhuān hē chá ma?", exVi: "Bạn có thích uống trà không?" },
    { id: "v1_11", lesson: 1, part: 2, hz: "咖啡", py: "kāfēi", vi: "Cà phê", pos: "Danh từ", scene: "tea", exZh: "我不喝咖啡，我喝茶。", exPy: "Wǒ bù hē kāfēi, wǒ hē chá.", exVi: "Tôi không uống cà phê, tôi uống trà." },
    { id: "v1_12", lesson: 1, part: 2, hz: "烏龍茶", py: "wūlóngchá", vi: "Trà Ô Long", pos: "Danh từ", scene: "tea", exZh: "臺灣的烏龍茶很好喝。", exPy: "Táiwān de wūlóngchá hěn hǎohē.", exVi: "Trà Ô Long của Đài Loan rất ngon." },
    { id: "v1_13", lesson: 1, part: 2, hz: "珍珠奶茶", py: "zhēnzhū nǎichá", vi: "Trà sữa trân châu", pos: "Danh từ", scene: "tea", exZh: "我也很喜歡喝珍珠奶茶。", exPy: "Wǒ yě hěn xǐhuān hē zhēnzhū nǎichá.", exVi: "Tôi cũng rất thích uống trà sữa trân châu." },
    { id: "v1_14", lesson: 1, part: 2, hz: "歡迎", py: "huānyíng", vi: "Hoan nghênh, chào mừng", pos: "Động từ", scene: "greeting", exZh: "歡迎你們來我家！", exPy: "Huānyíng nǐmen lái wǒ jiā!", exVi: "Chào mừng các bạn đến nhà tôi!" },

    // LESSON 2 - PART 1
    { id: "v2_1", lesson: 2, part: 1, hz: "照片", py: "zhàopiàn", vi: "Bức ảnh", pos: "Danh từ", scene: "family", exZh: "這張照片很好看。", exPy: "Zhè zhāng zhàopiàn hěn hǎokàn.", exVi: "Bức ảnh này rất đẹp." },
    { id: "v2_2", lesson: 2, part: 1, hz: "張", py: "zhāng", vi: "Tấm, bức (lượng từ vật phẳng)", pos: "Lượng từ", scene: "family", exZh: "我有兩張家人的照片。", exPy: "Wǒ yǒu liǎng zhāng jiārén de zhàopiàn.", exVi: "Tôi có hai bức ảnh gia đình." },
    { id: "v2_3", lesson: 2, part: 1, hz: "家人", py: "jiārén", vi: "Người nhà, gia đình", pos: "Danh từ", scene: "family", exZh: "他們都是我的家人。", exPy: "Tāmen dōu shì wǒ de jiārén.", exVi: "Họ đều là người nhà của tôi." },
    { id: "v2_4", lesson: 2, part: 1, hz: "爸爸", py: "bàba", vi: "Bố, ba", pos: "Danh từ", scene: "family", exZh: "我爸爸是醫生。", exPy: "Wǒ bàba shì yīshēng.", exVi: "Bố tôi là bác sĩ." },
    { id: "v2_5", lesson: 2, part: 1, hz: "媽媽", py: "māma", vi: "Mẹ, má", pos: "Danh từ", scene: "family", exZh: "我媽媽是老師。", exPy: "Wǒ māma shì lǎoshī.", exVi: "Mẹ tôi là giáo viên." },
    { id: "v2_6", lesson: 2, part: 1, hz: "哥哥", py: "gēge", vi: "Anh trai", pos: "Danh từ", scene: "family", exZh: "我有一個哥哥。", exPy: "Wǒ yǒu yí ge gēge.", exVi: "Tôi có một người anh trai." },
    { id: "v2_7", lesson: 2, part: 1, hz: "姐姐", py: "jiějie", vi: "Chị gái", pos: "Danh từ", scene: "family", exZh: "我姐姐很漂亮。", exPy: "Wǒ jiějie hěn piàoliang.", exVi: "Chị gái tôi rất xinh đẹp." },
    { id: "v2_8", lesson: 2, part: 1, hz: "兩", py: "liǎng", vi: "Hai (đi trước lượng từ)", pos: "Số từ", scene: "family", exZh: "我家有兩個人。", exPy: "Wǒ jiā yǒu liǎng ge rén.", exVi: "Nhà tôi có hai người." },

    // LESSON 2 - PART 2
    { id: "v2_9", lesson: 2, part: 2, hz: "老師", py: "lǎoshī", vi: "Giáo viên, thầy/cô giáo", pos: "Danh từ", scene: "family", exZh: "王老師教我們中文。", exPy: "Wáng lǎoshī jiāo wǒmen Zhōngwén.", exVi: "Thầy Vương dạy chúng tôi tiếng Trung." },
    { id: "v2_10", lesson: 2, part: 2, hz: "醫生", py: "yīshēng", vi: "Bác sĩ", pos: "Danh từ", scene: "family", exZh: "他爸爸也是醫生嗎？", exPy: "Tā bàba yě shì yīshēng ma?", exVi: "Bố anh ấy cũng là bác sĩ phải không?" },
    { id: "v2_11", lesson: 2, part: 2, hz: "大學生", py: "dàxuéshēng", vi: "Sinh viên đại học", pos: "Danh từ", scene: "family", exZh: "我和妹妹都是大學生。", exPy: "Wǒ hé mèimei dōu shì dàxuéshēng.", exVi: "Tôi và em gái đều là sinh viên đại học." },
    { id: "v2_12", lesson: 2, part: 2, hz: "漂亮", py: "piàoliang", vi: "Xinh đẹp", pos: "Tính từ", scene: "family", exZh: "這張照片很漂亮！", exPy: "Zhè zhāng zhàopiàn hěn piàoliang!", exVi: "Bức ảnh này đẹp quá!" },
    { id: "v2_13", lesson: 2, part: 2, hz: "都", py: "dōu", vi: "Đều", pos: "Phó từ", scene: "family", exZh: "我們都喜歡學中文。", exPy: "Wǒmen dōu xǐhuān xué Zhōngwén.", exVi: "Chúng tôi đều thích học tiếng Trung." },
    { id: "v2_14", lesson: 2, part: 2, hz: "沒有", py: "méiyǒu", vi: "Không có", pos: "Động từ", scene: "family", exZh: "我沒有弟弟，我有妹妹。", exPy: "Wǒ méiyǒu dìdi, wǒ yǒu mèimei.", exVi: "Tôi không có em trai, tôi có em gái." },

    // LESSON 3 - PART 1
    { id: "v3_1", lesson: 3, part: 1, hz: "週末", py: "zhōumò", vi: "Cuối tuần", pos: "Danh từ", scene: "weekend", exZh: "這個週末你做什麼？", exPy: "Zhège zhōumò nǐ zuò shénme?", exVi: "Cuối tuần này bạn làm gì?" },
    { id: "v3_2", lesson: 3, part: 1, hz: "常", py: "cháng", vi: "Thường, hay", pos: "Phó từ", scene: "weekend", exZh: "我週末常跟朋友去運動。", exPy: "Wǒ zhōumò cháng gēn péngyou qù yùndòng.", exVi: "Cuối tuần tôi thường đi tập thể thao với bạn." },
    { id: "v3_3", lesson: 3, part: 1, hz: "打網球", py: "dǎ wǎngqiú", vi: "Đánh quần vợt (tennis)", pos: "Động-Tân", scene: "weekend", exZh: "他喜歡跟朋友去打網球。", exPy: "Tā xǐhuān gēn péngyou qù dǎ wǎngqiú.", exVi: "Anh ấy thích đi đánh quần vợt với bạn." },
    { id: "v3_4", lesson: 3, part: 1, hz: "打籃球", py: "dǎ lánqiú", vi: "Chơi bóng rổ", pos: "Động-Tân", scene: "weekend", exZh: "我們下午一起去打籃球吧！", exPy: "Wǒmen xiàwǔ yìqǐ qù dǎ lánqiú ba!", exVi: "Chiều nay chúng mình cùng đi chơi bóng rổ nhé!" },
    { id: "v3_5", lesson: 3, part: 1, hz: "看電影", py: "kàn diànyǐng", vi: "Xem phim điện ảnh", pos: "Động-Tân", scene: "weekend", exZh: "我常跟家人去看臺灣電影。", exPy: "Wǒ cháng gēn jiārén qù kàn Táiwān diànyǐng.", exVi: "Tôi thường đi xem phim Đài Loan với gia đình." },
    { id: "v3_6", lesson: 3, part: 1, hz: "聽音樂", py: "tīng yīnyuè", vi: "Nghe nhạc", pos: "Động-Tân", scene: "weekend", exZh: "我在家看書、聽音樂。", exPy: "Wǒ zài jiā kànshū, tīng yīnyuè.", exVi: "Tôi ở nhà đọc sách, nghe nhạc." },
    { id: "v3_7", lesson: 3, part: 1, hz: "運動", py: "yùndòng", vi: "Tập thể thao, vận động", pos: "Động/Danh", scene: "weekend", exZh: "你常做什麼運動？", exPy: "Nǐ cháng zuò shénme yùndòng?", exVi: "Bạn thường chơi môn thể thao gì?" },

    // LESSON 3 - PART 2
    { id: "v3_8", lesson: 3, part: 2, hz: "請客", py: "qǐngkè", vi: "Mời khách, đãi tiệc", pos: "Động-Tân", scene: "weekend", exZh: "今天晚上我請客！", exPy: "Jīntiān wǎnshàng wǒ qǐngkè!", exVi: "Tối nay tôi khao nhé!" },
    { id: "v3_9", lesson: 3, part: 2, hz: "臺灣菜", py: "Táiwāncài", vi: "Món ăn Đài Loan", pos: "Danh từ", scene: "weekend", exZh: "我們一起去吃臺灣菜吧！", exPy: "Wǒmen yìqǐ qù chī Táiwāncài ba!", exVi: "Chúng ta cùng đi ăn món Đài Loan nhé!" },
    { id: "v3_10", lesson: 3, part: 2, hz: "越南菜", py: "Yuènáncài", vi: "Món ăn Việt Nam", pos: "Danh từ", scene: "weekend", exZh: "我也喜歡吃越南菜。", exPy: "Wǒ yě xǐhuān chī Yuènáncài.", exVi: "Tôi cũng thích ăn món Việt Nam." },
    { id: "v3_11", lesson: 3, part: 2, hz: "時候", py: "shíhou", vi: "Khi, lúc (...的時候)", pos: "Danh từ", scene: "weekend", exZh: "週末的時候，我常去看電影。", exPy: "Zhōumò de shíhou, wǒ cháng qù kàn diànyǐng.", exVi: "Vào dịp cuối tuần, tôi thường đi xem phim." },
    { id: "v3_12", lesson: 3, part: 2, hz: "一起", py: "yìqǐ", vi: "Cùng nhau", pos: "Phó từ", scene: "weekend", exZh: "我們晚上一起去吃晚飯吧。", exPy: "Wǒmen wǎnshàng yìqǐ qù chī wǎnfàn ba.", exVi: "Tối nay chúng mình cùng đi ăn tối nhé." },

    // LESSON 4 - PART 1
    { id: "v4_1", lesson: 4, part: 1, hz: "天氣", py: "tiānqì", vi: "Thời tiết", pos: "Danh từ", scene: "seasons", exZh: "今天的天氣很好。", exPy: "Jīntiān de tiānqì hěn hǎo.", exVi: "Thời tiết hôm nay rất đẹp." },
    { id: "v4_2", lesson: 4, part: 1, hz: "春天", py: "chūntiān", vi: "Mùa xuân", pos: "Danh từ", scene: "seasons", exZh: "我覺得春天很舒服。", exPy: "Wǒ juéde chūntiān hěn shūfu.", exVi: "Tôi cảm thấy mùa xuân rất dễ chịu." },
    { id: "v4_3", lesson: 4, part: 1, hz: "夏天", py: "xiàtiān", vi: "Mùa hè", pos: "Danh từ", scene: "seasons", exZh: "臺灣的夏天非常熱。", exPy: "Táiwān de xiàtiān fēicháng rè.", exVi: "Mùa hè ở Đài Loan vô cùng nóng." },
    { id: "v4_4", lesson: 4, part: 1, hz: "覺得", py: "juéde", vi: "Cảm thấy, cho rằng", pos: "Động từ", scene: "seasons", exZh: "你覺得這杯茶怎麼樣？", exPy: "Nǐ juéde zhè bēi chá zěnmeyàng?", exVi: "Bạn thấy ly trà này thế nào?" },
    { id: "v4_5", lesson: 4, part: 1, hz: "舒服", py: "shūfu", vi: "Thoải mái, dễ chịu", pos: "Tính từ", scene: "seasons", exZh: "秋天的天氣非常舒服。", exPy: "Qiūtiān de tiānqì fēicháng shūfu.", exVi: "Thời tiết mùa thu vô cùng dễ chịu." },
    { id: "v4_6", lesson: 4, part: 1, hz: "非常", py: "fēicháng", vi: "Vô cùng, cực kỳ", pos: "Phó từ", scene: "seasons", exZh: "那裡的冬天非常冷。", exPy: "Nàlǐ de dōngtiān fēicháng lěng.", exVi: "Mùa đông ở đó cực kỳ lạnh." },

    // LESSON 4 - PART 2
    { id: "v4_7", lesson: 4, part: 2, hz: "多少錢", py: "duōshǎo qián", vi: "Bao nhiêu tiền", pos: "Cụm nghi vấn", scene: "seasons", exZh: "請問這支手機多少錢？", exPy: "Qǐngwèn zhè zhī shǒujī duōshǎo qián?", exVi: "Xin hỏi chiếc điện thoại này bao nhiêu tiền?" },
    { id: "v4_8", lesson: 4, part: 2, hz: "一共", py: "yígòng", vi: "Tổng cộng", pos: "Phó từ", scene: "seasons", exZh: "請問一共多少錢？", exPy: "Qǐngwèn yígòng duōshǎo qián?", exVi: "Xin hỏi tổng cộng bao nhiêu tiền?" },
    { id: "v4_9", lesson: 4, part: 2, hz: "太貴了", py: "tài guì le", vi: "Đắt quá rồi", pos: "Cấu trúc 太...了", scene: "seasons", exZh: "那支手機太貴了！", exPy: "Nà zhī shǒujī tài guì le!", exVi: "Chiếc điện thoại đó đắt quá!" },
    { id: "v4_10", lesson: 4, part: 2, hz: "便宜", py: "piányi", vi: "Rẻ", pos: "Tính từ", scene: "seasons", exZh: "這家店的東西很便宜。", exPy: "Zhè jiā diàn de dōngxi hěn piányi.", exVi: "Đồ của cửa hàng này rất rẻ." }
  ];

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
      title: "Phủ định sở hữu 沒有 & Phó từ tổng괄 都",
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

  // Unified Sentence Database (Used for Step 2 V2Z, Z2V and Step 3 Speaking)
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

  // Roleplay Dialogues for Speaking Studio
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

  // Grammar Error-Correction Exercises (Step 4 Test)
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

  // Simplified -> Traditional codepoint map (using Unicode escapes so source stays 100% Traditional)
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

  // Character-level Pinyin dictionary for pronunciation coaching
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
    "晚": "wǎn", "上": "shàng", "客": "kè", "一": "yì", "起": "qǐ", "吧": "ba", "太": "tài",
    "了": "le", "裡": "lǐ", "的": "de", "夏": "xià", "春": "chūn", "秋": "qiū", "冬": "dōng",
    "非": "fēi", "熱": "rè", "冷": "lěng", "覺": "jué", "得": "de", "舒": "shū", "服": "fu",
    "氣": "qì", "杯": "bēi", "共": "gòng", "多": "duō", "少": "shǎo", "錢": "qián", "您": "nín",
    "日": "Rì", "本": "běn", "哪": "nǎ", "國": "guó", "迎": "yíng", "來": "lái"
  };

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

  return {
    LESSONS_META,
    SCENE_SVGS,
    VOCAB_DB,
    GRAMMAR_DB,
    SENTENCES_DB,
    ROLEPLAY_DB,
    DETECTIVE_DB,
    CHAR_PINYIN_MAP,
    HOMOPHONE_GROUPS,
    toTraditional
  };
})();
