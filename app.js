const STORAGE_KEY = 'pocket-finance-state-v2';
const PIN_HASH_KEY = 'mepocket-pin-hash-v1';
const BIOMETRIC_CREDENTIAL_KEY = 'mepocket-biometric-credential-v1';
const RATES_TO_THB = { THB: 1, USD: 35.2 };
const BANK_CATALOG = {
  scb:{code:'SCB',name:'ธนาคารไทยพาณิชย์',color:'#e3d7ff',ink:'#4b2387'},
  kbank:{code:'KBANK',name:'ธนาคารกสิกรไทย',color:'#d8f5df',ink:'#167440'},
  ktb:{code:'KTB',name:'ธนาคารกรุงไทย',color:'#d7ecff',ink:'#1670af'},
  bbl:{code:'BBL',name:'ธนาคารกรุงเทพ',color:'#dce4ff',ink:'#234c9a'},
  bay:{code:'BAY',name:'ธนาคารกรุงศรีอยุธยา',color:'#fff1bf',ink:'#775d00'}
};

const PLAN_CATALOG = [
  {
    id:'starter', group:'individual', name:'STARTER', badges:[], tagline:'สำหรับผู้เริ่มต้นที่ต้องการสร้างวินัยทางการเงินขั้นพื้นฐาน (ด้วยงบ 0 บาท)',
    hero:['1 กระเป๋าหลัก / 5 กระเป๋าเป้าหมาย',['=','จำกัดวงเงินเป้าหมายสูงสุด ฿5,000 / กระเป๋า (เพื่อฝึกออมทีละก้าวอย่างยั่งยืน)'],['~','ไม่มีระบบค้นหาประวัติ (เพื่อฝึกความจำและการทบทวนรายจ่ายด้วยตนเอง)']],
    oldPrice:'', price:'฿0', priceNote:'จ่ายครั้งเดียว (ใช้งานฟรีตลอดชีพ)', cta:'Get Starter', saveNote:'ประหยัดเงิน แต่อาจต้องใช้เวลาและความอดทนสูง',
    limitsIcon:'lock', limitsTitle:'ข้อจำกัดระบบ (System Limits):',
    limits:[
      [false,'ธีมแอปพลิเคชัน','ล็อกการแสดงผลโหมดสว่าง (Light Mode) ตลอด 24 ชั่วโมง','เพื่อกระตุ้นความตื่นตัวขณะทำธุรกรรม และป้องกันอาการง่วงซึมซึ่งอาจนำไปสู่การกดตัวเลขผิดพลาด'],
      [false,'ระบบความปลอดภัย','ไม่มีระบบตั้งรหัสผ่าน PIN, สแกนใบหน้า หรือสแกนลายนิ้วมือ','เพื่อการเข้าถึงแอปพลิเคชันที่รวดเร็ว ไร้รอยต่อ'],
      [false,'สกุลเงิน','รองรับเฉพาะ THB','ยังไม่อนุญาตให้ใช้ USD ในแพ็กเกจเริ่มต้น'],
      [false,'ฟอนต์แอปพลิเคชัน','รูปแบบพื้นฐาน Comic Sans ขนาด 8px','เพื่อความกะทัดรัดและประหยัดพื้นที่หน้าจอ'],
      [false,'ความเร็วการประมวลผล','โหมดประหยัดพลังงานเซิร์ฟเวอร์','ล็อกความเร็วสูงสุดไว้ที่ 4G (ไม่รองรับ 5G/6G) เพื่อร่วมลดภาวะโลกร้อน'],
      [false,'การแจ้งเตือน (Notifications)','ปิดการแจ้งเตือนทุกประเภท','เข้าสู่โหมด Digital Detox เพื่อลดความรบกวนให้คุณมีสมาธิกับชีวิตขั้นสุด'],
      [false,'โควต้าปุ่มย้อนกลับ (Back)','5 ครั้ง/วัน','เพื่อฝึกความรอบคอบก่อนเปลี่ยนหน้าจอ หากเกินโควต้ากรุณารีสตาร์ทแอป']
    ],
    featuresTitle:'รายการฟีเจอร์ที่คุณจะ (ต้อง) ได้รับ:',
    features:[
      [true,'Phone Number Login: เข้าระบบด้วยเบอร์โทรศัพท์เท่านั้น (ลดภาระการจดจำรหัสผ่าน)'],
      [true,'Daily Financial Lesson: บังคับรับชมวิดีโอความรู้ทางการเงินจนจบ ก่อนเปิดใช้งานแอปครั้งแรกของวัน'],
      [true,'Human Verification: ระบบ CAPTCHA "กรุณาเลือกรูปเหรียญบาท" ทุกครั้งที่เพิ่มเงิน (เพื่อป้องกันบอทและดึงสติ)'],
      [true,'24-Hour Cooling Period: โอนเงินต้องรออนุมัติ 24 ชม. (เพื่อลดพฤติกรรมการใช้อารมณ์ตัดสินใจ)'],
      [true,'Double-Check System: ป็อปอัป "แน่ใจหรือไม่?" 3 รอบก่อนกดยืนยัน (เพื่อความปลอดภัยสูงสุดของเงินคุณ)'],
      [true,'Zero Decimal Policy: ปัดเศษสตางค์ทิ้งอัตโนมัติ (เพื่อความสะอาดตาของบัญชี)'],
      [true,'Cultural Preservation Mode: แสดงยอดเงินและประวัติการทำรายการทั้งหมดเป็น "ตัวเลขไทย" เท่านั้น เช่น ฿๔,๙๙๙','เพื่อร่วมสืบสานและอนุรักษ์เอกลักษณ์ความเป็นชาติในโลกดิจิทัล']
    ],
    restrictionsTitle:'สิ่งที่ไม่ได้รวมอยู่ในแพ็กเกจนี้:',
    restrictions:[
      'ไม่อนุญาตให้เปลี่ยนเป็น Dark Mode (สงวนสิทธิ์การถนอมสายตาสำหรับแพ็กเกจพรีเมียม)',
      'จำกัดชื่อเป้าหมายสูงสุด 3 ตัวอักษร',
      'ล็อกยอดเป้าหมายสูงสุด ฿5,000',
      'ไม่มีช่องค้นหาประวัติ ต้องเลื่อนไถด้วยตัวเอง'
    ]
  },
  {
    id:'plus', group:'individual', name:'PLUS', badges:[{text:'20% OFF'}], tagline:'สำหรับผู้ที่ต้องการอิสรภาพและยกระดับสุขภาวะทางการเงิน',
    hero:['+3 กระเป๋าเป้าหมาย (ตั้งชื่ออิสระ)',['=','โอนเงินข้ามกระเป๋าได้ไม่จำกัด (อิสรภาพในการบริหารจัดการ)'],['~','เปลี่ยนระบบแสดงผลเป็นตัวเลขอารบิกสากล (เพื่อการคำนวณที่แม่นยำ)']],
    oldPrice:'฿999', price:'฿799', priceNote:'ต่อเดือน (จ่ายรายเดือน)', cta:'Get Plus', saveNote:'ยกระดับคุณภาพชีวิตและสุขภาพจิตของคุณ',
    limitsIcon:'unlock', limitsTitle:'ปลดล็อกข้อจำกัดระบบ (System Upgrades):',
    limits:[
      [true,'Visual Wellness (ระบบถนอมสายตา)','ปลดล็อกฟีเจอร์สลับโหมด Light / Dark Mode ได้อย่างอิสระ','เพื่อสุขภาวะทางสายตาที่ดีของคุณในทุกช่วงเวลา'],
      [true,'Standard Security (ระบบความปลอดภัยมาตรฐาน)','เข้าสู่ระบบด้วย Email และตั้งรหัสผ่าน PIN 6 หลักได้','เพื่อปกป้องข้อมูลทางการเงินของคุณให้เป็นส่วนตัวมากยิ่งขึ้น และไม่ต้องพึ่งพาแค่เบอร์โทรศัพท์อีกต่อไป'],
      [true,'Typography Upgrade (ยกระดับการอ่าน)','เปลี่ยนฟอนต์จาก Comic Sans 8px เป็นฟอนต์มาตรฐานสากล (San Francisco / Roboto)','เพื่อลดความเหนื่อยล้าของกล้ามเนื้อตาจากการเพ่งมองหน้าจอ'],
      [true,'Network Optimization (ประมวลผลความเร็วสูง)','ย้ายสู่เซิร์ฟเวอร์ Priority รองรับความเร็วระดับ 5G','เพื่อการทำธุรกรรมที่ลื่นไหล สลิปเด้งทันที ไม่ต้องรอโหลด 15 วินาทีอีกต่อไป'],
      [true,'Navigation Freedom (อิสระในการนำทาง)','ปลดล็อกโควต้าปุ่มย้อนกลับ (Back) สามารถกดได้ไม่จำกัดครั้ง','มอบอิสระในการท่องแอปพลิเคชันตามใจคุณ โดยไม่ต้องปิดแอปเปิดใหม่'],
      [true,'Notification Control (ควบคุมการแจ้งเตือน)','ปลดล็อกการแจ้งเตือนแบบเรียลไทม์ (ไม่ต้องรอรับตอนตี 3)','เพื่อให้คุณเชื่อมต่อกับทุกความเคลื่อนไหวทางการเงินอย่างทันท่วงทีในเวลาทำการ'],
      [true,'ขีดจำกัดเพิ่มเงินและเป้าหมาย (Wealth Cap)','ขยายเพดานสูงสุด ฿1,000,000 ต่อบัญชี','ระบบขยายเพดานรองรับความมั่งคั่งของคุณ แต่จำกัดไว้ที่ 1 ล้านบาท เพื่อรักษาสมดุลทางจิตใจ ป้องกันความเครียดจากการหมกมุ่นกับตัวเลข และลดความเสี่ยงกรณีสมาร์ทโฟนสูญหาย']
    ],
    featuresTitle:'รายการฟีเจอร์ที่คุณจะได้รับ:',
    features:[
      [true,'Universal Display: ยกเลิกโหมดอนุรักษ์ความเป็นไทย เปลี่ยนมาแสดงผลด้วย "ตัวเลขอารบิก" สากล พร้อมคีย์บอร์ดพิมพ์ตัวเลขปกติ (บอกลาแถบสไลเดอร์)'],
      [true,'Ad-Free & Instant Action: ยกเลิกโฆษณาเต็มจอ 30 วินาที, งดบังคับดูคลิปสอนออมเงินตอนเช้า และถอดระบบ CAPTCHA รูปเหรียญบาทออกทั้งหมด'],
      [true,'Zero-Cooldown Transfer: ยกเลิกระยะเวลารอคอย 24 ชั่วโมง โอนเงินและเพิ่มเงินได้ทันทีแบบ Real-time (ไม่ต้องถามย้ำ 3 รอบอีกต่อไป)'],
      [true,'Infinite Memory: ดูประวัติรายการย้อนหลังได้ตลอดกาล พร้อมเพิ่ม "ช่องค้นหา (Search)" พื้นฐาน'],
      [true,'Profile Customization: มีหน้าแดชบอร์ดโปรไฟล์ส่วนตัว สามารถตั้งชื่อผู้ใช้งานและชื่อกระเป๋าได้ยาวกว่า 3 ตัวอักษร'],
      [true,'Shareable Slips: ปลดล็อกระบบแคปหน้าจอตามปกติ เพื่อการแชร์สลิปที่สะดวกสบาย'],
      [true,'Account Management: สามารถกดยื่นลบข้อมูลบัญชีได้ (เงื่อนไข: ศึกษาและยอมรับข้อตกลง 100 หน้า เพื่อให้แน่ใจว่าคุณเข้าใจผลกระทบอย่างถ่องแท้ หากเลื่อนอ่านเร็วเกินไป ระบบจะบังคับให้ทบทวนใหม่ตั้งแต่หน้า 1)']
    ]
  },
  {
    id:'ultra', group:'individual', name:'ULTRA SMOOTH', badges:[{text:'27% OFF'},{text:'✦ BEST VALUE',best:true}], tagline:'สำหรับผู้ใช้งานระดับโปรที่ต้องการประสบการณ์ทางการเงินไร้รอยต่อ',
    hero:['Ultimate Freedom & Customization',['=','ไม่จำกัดกระเป๋าและรองรับทุกสกุลเงินทั่วโลก'],['~','ปรับแต่ง UI สลิป และเอฟเฟกต์ได้ทุกอณู']],
    oldPrice:'฿10,990', price:'฿7,990', priceNote:'จ่ายครั้งเดียวจบ (Lifetime License)', cta:'Get Ultra Smooth', saveNote:'เอกสิทธิ์สูงสุด ซื้อครั้งเดียวครอบคลุมทุกการอัปเดตตลอดชีพ',
    limitsIcon:'infinity', limitsTitle:'ปลดล็อกระบบขั้นสูงสุด (Premium Access):',
    limits:[
      [true,'Absolute Wealth Capacity (ขีดจำกัดความมั่งคั่งสูงสุด)','ปลดล็อกเพดานเงินฝากแบบไร้ขีดจำกัด (สูงสุด ฿9,999,999,999)','เพื่อรองรับอิสรภาพทางการเงินระดับ Ultra-High-Net-Worth Individual (UHNWI) ของคุณโดยไร้ข้อกังขา'],
      [true,'Institutional-Grade Security (ความปลอดภัยระดับสถาบัน)','ปลดล็อกระบบยืนยันตัวตนเต็มรูปแบบด้วย บัตรประชาชน (e-KYC), อีเมล, และ Biometrics','เพื่อยกระดับการปกป้องสินทรัพย์ของคุณให้เทียบเท่ามาตรฐานระบบรักษาความปลอดภัยระดับธนาคารกลาง'],
      [true,'True Black Experience (ประสบการณ์ทรูแบล็ค)','ปลดล็อกโหมด Dark Mode แบบ True Black ขจัดแสงสะท้อน','เพื่อความหรูหราเหนือระดับ ประหยัดพลังงานแบตเตอรี่สูงสุด และสะท้อนภาพลักษณ์ที่สุขุมลุ่มลึก'],
      [true,'Limitless Architecture (สถาปัตยกรรมไร้ขอบเขต)','ไม่จำกัดจำนวนกระเป๋าเงิน (Unlimited Pockets)','ทลายทุกข้อจำกัดเดิม เพื่อการบริหารพอร์ตโฟลิโอทางการเงินที่ไร้พรมแดน'],
      [true,'Smart Automation (ระบบฝากอัตโนมัติอัจฉริยะ)','ใช้งานระบบฝากและโอนเงินอัตโนมัติได้ไม่จำกัดจำนวนครั้ง','ให้เงินทำงานตามระบบที่คุณวางไว้ ในขณะที่คุณเอาเวลาไปโฟกัสกับการใช้ชีวิต'],
      [true,'Absolute Customization (การปรับแต่งอิสระทุกอณู)','ไร้ข้อจำกัดในการดีไซน์','ปลดปล่อยจินตนาการของคุณลงบนหน้าจอ UI ได้อย่างสมบูรณ์แบบ']
    ],
    featuresTitle:'เอกสิทธิ์เฉพาะแพ็กเกจระดับ Ultra:',
    features:[
      [true,'Full Biometric & Identity Login: ปลดล็อกการเข้าสู่ระบบแบบไร้รอยต่อด้วย Face ID / สแกนลายนิ้วมือ พร้อมผูกบัญชีด้วยบัตรประจำตัวประชาชนและอีเมล (หมดกังวลเรื่องการเปลี่ยนเบอร์โทรศัพท์หรือลืมรหัสผ่าน)'],
      [true,'Theme & Slip Builder: เครื่องมือออกแบบธีมแอปและหน้าตาสลิปเงินโอนของคุณเองแบบ Custom 100% พร้อมใส่แอนิเมชันและเอฟเฟกต์เสียง (บ่งบอกสเตตัสความพรีเมียมในทุกครั้งที่แชร์สลิป)'],
      [true,'Infinite History & Search: เก็บประวัติการทำธุรกรรมแบบถาวรตลอดชีพ พร้อมระบบค้นหา (Search) และตัวกรองข้อมูลขั้นสูง'],
      [true,'Professional Data Export: ส่งออกข้อมูลรายงานทางการเงินรูปแบบ CSV, PDF และ JSON แบบมืออาชีพ (พร้อมส่งตรงให้ผู้ตรวจสอบบัญชีส่วนตัวของคุณ)'],
      [true,'Zero Distractions: ประสบการณ์สมูทที่สุด ไร้โฆษณา ไร้ลายน้ำ ไร้ระยะเวลารอคอย (Cooldown) ทุกปุ่มกดลื่นไหล ตอบสนองไวในระดับเสี้ยววินาที'],
      [true,'Fast-Track Deletion: สิทธิ์ VIP ในการลบบัญชี 1 คลิก ไม่ต้องรอคิว ไม่ต้องทนไถอ่านข้อตกลง 100 หน้าอีกต่อไป (หมายเหตุ: มีค่าธรรมเนียมดำเนินการฉีกสัญญาก่อนกำหนด ฿199)'],
      [true,'Lifetime Updates: รับฟีเจอร์และนวัตกรรมใหม่ของแอปพลิเคชันฟรีตลอดชีพ ซื้อครั้งเดียวจบ ไม่มีค่าใช้จ่ายรายเดือนแอบแฝง']
    ]
  },
  {
    id:'team', group:'business', minSeats:2, name:'TEAM', badges:[{text:'18% OFF'}], tagline:'สำหรับคู่รัก หุ้นส่วน หรือทีมขนาดเล็ก ที่ต้องการยกระดับความโปร่งใสแบบไร้รอยต่อ',
    hero:['Shared Workspace & Credit Pool',['=','การอนุมัติธุรกรรมแบบกลุ่ม (ส่งเสริมการทำงานร่วมกัน)'],['~','แจ้งเตือนความเคลื่อนไหวทุกรายการ (ไร้ความคลุมเครือ)']],
    oldPrice:'', price:'฿199', priceNote:'/ seat / month (บังคับซื้อขั้นต่ำ 2 ที่นั่ง)', priceSub:'ต่อเดือน (ชำระรายปี)', cta:'Get Team', saveNote:'สร้างวัฒนธรรมความเชื่อใจ ผ่านการตรวจสอบที่เข้มงวด',
    limitsIcon:'lock', limitsTitle:'มาตรการควบคุมระบบ (System Governance):',
    limits:[
      [false,'ระดับความเป็นส่วนตัว (Privacy Level)','0% (แชร์ข้อมูลพฤติกรรมการใช้จ่ายทั้งหมดสู่ส่วนกลาง)','เพื่อสร้างบรรทัดฐานความโปร่งใส และลดความคลุมเครือภายในทีมของคุณให้เหลือศูนย์'],
      [false,'ระยะเวลาดำเนินการ (SLA for Approvals)','กรอบเวลา 5 นาที สำหรับการยืนยันธุรกรรมร่วมกัน','เพื่อความรัดกุม หากไม่ได้รับการอนุมัติจากทุกคนในเวลาที่กำหนด ระบบจะยกเลิกรายการทันทีเพื่อปกป้องสินทรัพย์'],
      [false,'สิทธิ์การดูแลระบบ (Admin Rights)','กระจายสิทธิ์เท่าเทียมกันทุกที่นั่ง','เพื่อความยุติธรรมสูงสุด ไม่มีสมาชิกท่านใดสามารถลบประวัติหรือซ่อนข้อมูลจากสมาชิกท่านอื่นได้'],
      [false,'การติดตามตำแหน่ง (Location Tracking)','บังคับเปิด GPS ขณะทำธุรกรรมเสมอ','เพื่อเป็นหลักฐานอ้างอิงที่โปร่งใส และตรวจสอบแหล่งที่มาของการใช้จ่ายได้อย่างแม่นยำ']
    ],
    featuresTitle:'รายการฟีเจอร์ที่คุณจะ (ต้อง) ได้รับ:',
    features:[
      [true,'Multi-Signature Consensus: ทุกการโอนเงินออกจากกระเป๋ากองกลาง สมาชิกทุกคนในทีมต้อง "สแกนใบหน้าพร้อมกัน" เพื่ออนุมัติรายการ (ส่งเสริมการมีส่วนร่วมและป้องกันการตัดสินใจพลการ)'],
      [true,'Radical Transparency Alerts: ระบบจะบรอดแคสต์ทุกความเคลื่อนไหว แม้กระทั่งกระเป๋าส่วนตัว (เช่น การซื้อของออนไลน์ หรือเติมเกม) ลงศูนย์กลางแชทกลุ่มทันทีแบบ Real-time'],
      [true,'Auto-Snitch Report: สรุปรายงานพฤติกรรมการใช้เงินรายสัปดาห์ ส่งตรงถึงสมาชิกทุกคน เพื่อใช้ในการทบทวนแผนการเงินร่วมกัน']
    ]
  },
  {
    id:'scale', group:'business', minSeats:5, name:'SCALE', badges:[{text:'30% OFF'},{text:'✦ BEST VALUE',best:true}], tagline:'สำหรับธุรกิจครอบครัวและ SME ที่ต้องการสิทธิขาดในการควบคุมสินทรัพย์อย่างเบ็ดเสร็จ',
    hero:['Centralized Administration',['=','อำนาจบริหารจัดการแบบเบ็ดเสร็จ (เพื่อปกป้ององค์กร)'],['~','ระบบเบิกจ่ายอิงเอกสาร (ตามหลักมาตรฐานการบัญชี)']],
    oldPrice:'฿499', price:'฿349', priceNote:'/ seat / month (บังคับซื้อขั้นต่ำ 5 ที่นั่ง)', priceSub:'ต่อเดือน (ชำระรายปี)', cta:'Get Scale', saveNote:'ปกป้องสภาพคล่องขององค์กร ด้วยอำนาจการบริหารส่วนกลาง',
    limitsIcon:'lock', limitsTitle:'มาตรการควบคุมระบบ (System Governance):',
    limits:[
      [false,'สิทธิ์การเข้าถึงสินทรัพย์ (Asset Accessibility)','ขึ้นอยู่กับดุลยพินิจของ Admin แต่เพียงผู้เดียว','สมาชิกจะไม่สามารถทำธุรกรรมใดๆ ได้ หากบัญชีถูกตั้งค่าให้อยู่ในสถานะเฝ้าระวังความเสี่ยง'],
      [false,'เกณฑ์การพิจารณาเบิกจ่าย (Disbursement Criteria)','บังคับพิมพ์เหตุผลขั้นต่ำ 200 ตัวอักษร พร้อมแนบรูปถ่ายสถานที่จริง','เพื่อให้ทุกการลงทุนขององค์กรมีเอกสารประกอบที่ครบถ้วนและรัดกุม ตามหลักเกณฑ์การตรวจสอบบัญชี'],
      [false,'กระบวนการอุทธรณ์ (Appeal Process)','ใช้เวลาพิจารณา 3-5 วันทำการ','สำหรับกรณีที่สมาชิกต้องการร้องขอให้ Admin พิจารณาปลดล็อกกระเป๋าเงิน']
    ],
    featuresTitle:'รายการฟีเจอร์ที่คุณจะ (ต้อง) ได้รับ:',
    features:[
      [true,'Emergency Asset Protection: Admin มีเอกสิทธิ์ในการกดปุ่ม "ระงับการเข้าถึง (Freeze)" กระเป๋าเงินส่วนตัวของสมาชิกคนใดก็ได้ทันทีเพียงปลายนิ้ว (เพื่อป้องกันความเสี่ยงด้านสภาพคล่องขององค์กรในภาวะวิกฤต)'],
      [true,'Priority Queue for Firing: Admin สามารถเตะสมาชิกออกจากระบบได้ทันที โดยยอดเงินคงเหลือในกระเป๋าส่วนตัวของสมาชิกท่านนั้น จะถูก "โอนเข้ากระเป๋ากองกลางอัตโนมัติ" (เพื่อชดเชยความเสียหายให้แก่องค์กร)'],
      [true,'Anonymous Integrity Reporting (SSO): ปุ่มลับสำหรับส่งรายงานพฤติกรรมการใช้เงินที่น่าสงสัยของเพื่อนร่วมงานถึง Admin โดยตรงแบบไม่ระบุตัวตน (เพื่อส่งเสริมธรรมาภิบาล และการตรวจสอบภายในที่มีประสิทธิภาพ)']
    ]
  },
  {
    id:'enterprise', group:'business', contactOnly:true, learnMore:true, name:'ENTERPRISE', badges:[{text:'✦ EXPERTS\' CHOICE',ribbon:true}], tagline:'โซลูชันระดับสถาบัน เพื่อการจัดลำดับชั้นข้อมูลและเพิ่มประสิทธิภาพบุคลากรขั้นสุดยอด',
    hero:['Absolute Corporate Hierarchy',['=','ข้อมูลระดับโครงสร้าง (เพื่อการวิเคราะห์ศักยภาพ)'],['~','เชื่อมต่อบัญชีเงินเดือนอัตโนมัติ (เพิ่มประสิทธิภาพ HR)']],
    oldPrice:'', price:'Let\'s talk', priceNote:'(ปรับราคาตามขนาดและโครงสร้างองค์กรของคุณ)', cta:'Contact Sales', saveNote:'ยกระดับอำนาจการบริหาร ด้วยเทคโนโลยีที่ไร้ข้อกังขา',
    limitsIcon:'lock', limitsTitle:'มาตรการควบคุมระบบ (System Governance):',
    limits:[
      [false,'การมองเห็นข้อมูล (Hierarchical Data Visibility)','ผู้บริหารเห็นข้อมูล 100% / พนักงานทั่วไปเห็นยอดกองกลางเป็น 0% เสมอ','เพื่อลดความกดดันด้านผลประกอบการให้แก่บุคลากร และปกป้องความลับทางกลยุทธ์สูงสุด'],
      [false,'ข้อตกลงการใช้งาน (Payroll Integration SLA)','บุคลากรต้องยินยอมให้ระบบเข้าถึงบัญชีเงินเดือนโดยอัตโนมัติ','เพื่อความคล่องตัวในการประมวลผลและการบริหารจัดการสวัสดิการแบบเบ็ดเสร็จ'],
      [false,'สิทธิ์การโต้แย้ง (Dispute Rights)','ระดับ 0 (Zero Tolerance)','ไม่อนุญาตให้อุทธรณ์คำตัดสินทางการเงินที่ประมวลผลและวิเคราะห์โดยระบบ AI ขององค์กร']
    ],
    featuresTitle:'รายการฟีเจอร์ที่คุณจะ (ต้อง) ได้รับ:',
    features:[
      [true,'Deep Data Analytics: ผู้บริหารระดับสูงสามารถเข้าถึงข้อมูลธุรกรรมเชิงลึกของบุคลากรได้ทุกคนแบบ Real-time (เพื่อการประเมินศักยภาพและบริหารทรัพยากรบุคคลอย่างแม่นยำ)'],
      [true,'Automated Liability Reconciliation: ระบบเชื่อมต่อ API เพื่อ "หักเงินออกจากกระเป๋าพนักงานเข้าสู่บัญชีบริษัทอัตโนมัติ" ทันทีที่ระบบตรวจพบการละเมิดเงื่อนไของค์กร (เพื่อลดภาระงานของฝ่าย HR และรักษาผลประโยชน์สูงสุด)'],
      [true,'Delegated Top-up Tax: ระบบหักค่าธรรมเนียมส่วนต่าง (Tax) เมื่อพนักงานเติมเงินเข้าบัญชีส่วนตัว ยอดส่วนหนึ่งจะถูกโอนเข้าบัญชีผู้บริหารแบบเนียนๆ (เพื่อเป็นค่าบริหารจัดการโครงสร้างพื้นฐาน)'],
      [true,'Executive AI Mentor: บอท AI ที่ถูกฝึกฝนด้วยภาษาเชิงกลยุทธ์ระดับผู้บริหาร คอยวิพากษ์วิจารณ์และตั้งคำถามอย่างกดดันต่อทุกคำขอเบิกงบหรือโอทีของบุคลากร (เพื่อกระตุ้นให้เกิดการพัฒนาศักยภาพ และสร้างวิสัยทัศน์ที่เฉียบคมแบบผู้นำ)']
    ]
  }
];

const seedState = {
  profileName: 'คุณานนต์',
  plan: 'starter',
  settings: { hideBalances: false, compactNumbers: false, notifications: true, systemNotifications: false },
  debitCard: { title:'Pocket Debit', holder:'KUNANON C.', number:'5201884273190426', color:'#18251f' },
  accounts: [
    { id:'thb', currency:'THB', flag:'🇹🇭', badge:'฿', badgeColor:'#52e884', name:'Pocket Save', accountNo:'206-974523-6', balance:26450, gradient:'linear-gradient(135deg,#caffdf 0%,#70f6a3 52%,#14bf8a 100%)', tag:'#eef1ef', country:'ประเทศไทย', rateText:'ดอกเบี้ยสูงสุด 3% ต่อปี' },
    { id:'usd', currency:'USD', flag:'🇺🇸', badge:'$', badgeColor:'#9c62ff', name:'Pocket USD', accountNo:'957906585', balance:95.75, gradient:'linear-gradient(135deg,#f4eaff 0%,#d6b8ff 50%,#8e47f7 100%)', tag:'#eee6ff', country:'สหรัฐอเมริกา', rateText:'บัญชีสกุลเงินดอลลาร์สหรัฐ' },
    { id:'fcd', currency:'USD', flag:'🇺🇸', badge:'◎', badgeColor:'#9cdb29', name:'Pocket FCD - USD', accountNo:'206-974567-4', balance:520.30, gradient:'linear-gradient(135deg,#f2ffd8 0%,#c8ff5b 53%,#8ed817 100%)', tag:'#dff9e6', country:'ประเทศไทย', rateText:'ดอกเบี้ยสูงสุด 4.50% ต่อปี' }
  ],
  goals: [
    { id:'trip', name:'เที่ยวญี่ปุ่น', balance:7800, target:20000, color:'#a987ff', icon:'✈' },
    { id:'emergency', name:'เงินฉุกเฉิน', balance:12000, target:50000, color:'#b7f542', icon:'✚' },
    { id:'equipment', name:'อุปกรณ์ทำงาน', balance:4500, target:30000, color:'#ffb65c', icon:'◉' }
  ],
  externalBanks: [],
  favorites: [],
  scheduledDeposits: [],
  transactions: [
    { id:'t1', type:'income', account:'thb', amount:35000, currency:'THB', note:'รายได้จากงานออกแบบ', date:'2026-09-18T09:40:00.000Z' },
    { id:'t2', type:'transfer', from:'thb', toType:'goal', to:'trip', amount:3000, currency:'THB', received:3000, receivedCurrency:'THB', note:'เก็บเพิ่มสำหรับทริป', date:'2026-09-18T08:18:00.000Z' },
    { id:'t3', type:'expense', account:'thb', amount:680, currency:'THB', note:'ค่าอาหารและเดินทาง', date:'2026-09-17T12:20:00.000Z' },
    { id:'t4', type:'transfer', from:'thb', toType:'account', to:'usd', amount:3520, currency:'THB', received:100, receivedCurrency:'USD', note:'แลกเก็บเป็น USD', date:'2026-09-16T04:49:03.000Z' },
    { id:'t5', type:'expense', account:'fcd', amount:2.26, currency:'USD', note:'ค่าธรรมเนียมต่างประเทศ', date:'2026-09-15T17:30:00.000Z' }
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = value => JSON.parse(JSON.stringify(value));
const esc = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

let state = loadState();
let selectedAccountId = 'thb';
let activeView = 'home';
let entryType = 'income';
let transactionFilter = 'all';
let reorderMode = false;
let toastTimer;
let depositPopupTimer;
let depositPopupActive = false;
const depositPopupQueue = [];
let homeDeckIndex = 0;
let homeDeckAnimating = false;
let homeDeckAnimationTimer;
let homeDeckPointerId = null;
let homeDeckStartY = 0;
let homeDeckCurrentY = 0;
let homeDeckWasDragged = false;
let homeDeckSuppressClick = false;
let homeDeckWheelLocked = false;
let transferPickerType = '';
let detailReturnView = 'home';
let pinDigits = '';
let pinSetupFirst = '';
let pinMode = 'unlock';
let biometricPromptStarted = false;
let pendingTransfer = null;
let completedTransfer = null;
let transferPinDigits = '';
let transferPinVerifying = false;
let transferPinVerificationToken = 0;
let protectedPinAction = 'transfer';
let editingAccountColorId = null;

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.accounts?.length ? { ...clone(seedState), ...saved, settings:{...seedState.settings,...saved.settings}, debitCard:{...seedState.debitCard,...saved.debitCard}, externalBanks:Array.isArray(saved.externalBanks)?saved.externalBanks:[], favorites:Array.isArray(saved.favorites)?saved.favorites:[], scheduledDeposits:Array.isArray(saved.scheduledDeposits)?saved.scheduledDeposits.filter(item=>item.status!=='done'):[] } : clone(seedState);
  } catch { return clone(seedState); }
}

function saveState(message) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  renderAll();
  if (message && state.settings.notifications) notify(message);
}

const accountById = id => state.accounts.find(account => account.id === id);
const goalById = id => state.goals.find(goal => goal.id === id);
const externalBankById = id => state.externalBanks.find(bank => bank.id === id);
const rateOf = currency => RATES_TO_THB[currency] || 1;
const totalTHB = () => state.accounts.reduce((sum, account) => sum + account.balance * rateOf(account.currency), 0) + state.goals.reduce((sum, goal) => sum + goal.balance, 0);

function formatAmount(value, currency = 'THB', forceFull = false) {
  const options = state.settings.compactNumbers && !forceFull && Math.abs(value) >= 100000
    ? { notation:'compact', maximumFractionDigits:1 }
    : { minimumFractionDigits:2, maximumFractionDigits:2 };
  return `${new Intl.NumberFormat('th-TH', options).format(Number(value) || 0)} ${currency}`;
}

function formatTime(value = new Date()) {
  return new Intl.DateTimeFormat('th-TH', { day:'numeric', month:'short', year:'2-digit', hour:'2-digit', minute:'2-digit' }).format(new Date(value));
}

function bytesToBase64Url(bytes) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function base64UrlToBytes(value) {
  const base64=String(value||'').replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(String(value||'').length/4)*4,'=');
  return Uint8Array.from(atob(base64),character=>character.charCodeAt(0));
}

async function hashPin(value) {
  const data=new TextEncoder().encode(`MePocket:${value}:device`);
  const digest=await crypto.subtle.digest('SHA-256',data);
  return bytesToBase64Url(new Uint8Array(digest));
}

function updatePinDots() {
  $$('#pinDots i').forEach((dot,index)=>dot.classList.toggle('filled',index<pinDigits.length));
}

function resetPinInput(message='') {
  pinDigits=''; updatePinDots(); $('#pinError').textContent=message;
  if(message){const dots=$('#pinDots');dots.classList.remove('shake');void dots.offsetWidth;dots.classList.add('shake');}
}

function showPinScreen(mode='unlock') {
  pinMode=mode; pinSetupFirst=''; resetPinInput();
  $('#pinTitle').textContent=mode==='setup'?'ตั้งรหัส PIN':mode==='change-verify'?'ยืนยันรหัสเดิม':'ใส่รหัส PIN';
  $('#pinSubtitle').textContent=mode==='setup'?'ตั้งตัวเลข 6 หลักสำหรับเข้าใช้งานครั้งถัดไป':mode==='change-verify'?'กรอกรหัส PIN ปัจจุบันก่อนตั้งรหัสใหม่':'กรอกรหัส PIN 6 หลักเพื่อเข้าใช้งาน';
  const hasBiometric=Boolean(localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY));
  $('#pinBiometric').hidden=mode!=='unlock'||!hasBiometric;
  $('#pinScreen').hidden=false;
  if(mode==='unlock'&&hasBiometric&&!biometricPromptStarted){biometricPromptStarted=true;startFaceIdAnimation();setTimeout(authenticateBiometric,260);}
}

function unlockApp() {
  stopFaceIdAnimation();
  $('#splashScreen').hidden=true; $('#pinScreen').hidden=true; document.body.classList.remove('auth-locked'); $('#app').setAttribute('aria-hidden','false');
}

async function submitPin() {
  if(pinDigits.length!==6) return;
  const entered=pinDigits; resetPinInput();
  if(pinMode==='setup'){
    if(!pinSetupFirst){pinSetupFirst=entered;$('#pinTitle').textContent='ยืนยันรหัส PIN';$('#pinSubtitle').textContent='กรอกรหัสเดิมอีกครั้ง';return;}
    if(entered!==pinSetupFirst){pinSetupFirst='';$('#pinTitle').textContent='ตั้งรหัส PIN';$('#pinSubtitle').textContent='รหัสไม่ตรงกัน กรุณาตั้งใหม่';resetPinInput('รหัส PIN ไม่ตรงกัน');return;}
    localStorage.setItem(PIN_HASH_KEY,await hashPin(entered)); unlockApp(); notify('ตั้งรหัส PIN แล้ว'); updateBiometricStatus(); return;
  }
  const correct=(await hashPin(entered))===localStorage.getItem(PIN_HASH_KEY);
  if(correct){if(pinMode==='change-verify'){showPinScreen('setup');return;}unlockApp();return;}
  resetPinInput('รหัส PIN ไม่ถูกต้อง');
}

function startPinChange() {
  document.body.classList.add('auth-locked'); $('#app').setAttribute('aria-hidden','true'); showPinScreen('change-verify');
}

async function supportsBiometric() {
  try { return Boolean(window.PublicKeyCredential&&navigator.credentials&&await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()); }
  catch { return false; }
}

async function enableBiometric() {
  if(!(await supportsBiometric())){notify('อุปกรณ์หรือเบราว์เซอร์นี้ยังไม่รองรับ Face ID / ลายนิ้วมือ');updateBiometricStatus();return;}
  try {
    const userId=crypto.getRandomValues(new Uint8Array(16));
    const credential=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'MePocket'},user:{id:userId,name:'mepocket-device',displayName:'MePocket บนอุปกรณ์นี้'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',residentKey:'preferred',userVerification:'required'},timeout:60000,attestation:'none'}});
    if(!credential) throw new Error('credential');
    localStorage.setItem(BIOMETRIC_CREDENTIAL_KEY,bytesToBase64Url(new Uint8Array(credential.rawId)));
    updateBiometricStatus(); notify('เปิดใช้ Face ID / ลายนิ้วมือแล้ว');
  } catch(error) { if(error?.name!=='NotAllowedError') notify('ยังเปิดใช้การยืนยันด้วยอุปกรณ์ไม่ได้'); }
}

function startFaceIdAnimation() {
  const animation=$('#pinFaceAnimation'); const icon=$('.pin-lock-icon');
  if(animation) animation.hidden=false; if(icon) icon.hidden=true;
  $('#pinStatusIcon')?.classList.add('scanning');
  if(pinMode==='unlock') $('#pinSubtitle').textContent='กำลังตรวจสอบ Face ID…';
}

function stopFaceIdAnimation() {
  const animation=$('#pinFaceAnimation'); const icon=$('.pin-lock-icon');
  if(animation) animation.hidden=true; if(icon) icon.hidden=false;
  $('#pinStatusIcon')?.classList.remove('scanning');
  if(pinMode==='unlock'&&$('#pinSubtitle')) $('#pinSubtitle').textContent='กรอกรหัส PIN 6 หลักเพื่อเข้าใช้งาน';
}

async function authenticateBiometric() {
  const stored=localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY); if(!stored) return;
  startFaceIdAnimation();
  try {
    const credential=await navigator.credentials.get({mediation:'optional',publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:base64UrlToBytes(stored),transports:['internal']}],userVerification:'required',timeout:60000}});
    if(credential) unlockApp();
  } catch(error) { if(error?.name!=='NotAllowedError') $('#pinError').textContent='ไม่สามารถยืนยันตัวตนด้วยอุปกรณ์ได้'; }
  finally { if(document.body.classList.contains('auth-locked')) stopFaceIdAnimation(); }
}

async function updateBiometricStatus() {
  const label=$('#biometricStatus'); if(!label) return;
  if(localStorage.getItem(BIOMETRIC_CREDENTIAL_KEY)){label.textContent='เปิดใช้งานบนอุปกรณ์นี้แล้ว';return;}
  label.textContent=(await supportsBiometric())?'แตะเพื่อตั้งค่าบนอุปกรณ์นี้':'อุปกรณ์นี้ยังไม่รองรับ';
}

function initializeAppLock() {
  $('#app').setAttribute('aria-hidden','true');
  setTimeout(()=>{ $('#splashScreen').hidden=true; showPinScreen(localStorage.getItem(PIN_HASH_KEY)?'unlock':'setup'); },1150);
  updateBiometricStatus();
}

function icon(name, className = 'icon') { return `<svg class="${className}" aria-hidden="true"><use href="#i-${name}"/></svg>`; }
function flagClass(account) { return account.currency === 'THB' ? 'flag-th' : 'flag-us'; }
function flagHTML(account, mini = false) {
  const countryClass = flagClass(account);
  return mini
    ? `<span class="flag-mini ${countryClass}" aria-hidden="true"></span>`
    : `<span class="flag-badge" style="--badge:${account.badgeColor}"><span class="flag-face ${countryClass}" aria-hidden="true"></span><i>${esc(account.badge)}</i></span>`;
}

function bankProfile(code) { return BANK_CATALOG[code] || BANK_CATALOG.scb; }
function bankBadgeHTML(bank, className='bank-logo') {
  const profile=bankProfile(bank?.bankCode||bank?.code);
  return `<span class="${className}" style="--bank-color:${profile.color};--bank-ink:${profile.ink}" aria-hidden="true">${esc(profile.code)}</span>`;
}

function favoriteById(id) { return (state.favorites||[]).find(item=>item.id===id); }

function favoriteDestinationInfo(id) {
  const favorite=favoriteById(id); if(!favorite) return {type:'bank',id,entity:null,currency:'THB',favorite:null};
  if(favorite.destinationType==='account'){const entity=accountById(favorite.targetId);return {type:'account',id:favorite.targetId,entity,currency:entity?.currency||favorite.currency||'THB',favorite};}
  if(favorite.destinationType==='goal'){const entity=goalById(favorite.targetId);return {type:'goal',id:favorite.targetId,entity,currency:'THB',favorite};}
  const profile=bankProfile(favorite.bankCode||'scb');
  return {type:'bank',id:`favorite:${favorite.id}`,entity:{name:favorite.name,bankName:profile.name,code:profile.code,color:profile.color,accountNo:favorite.accountNo,bankCode:favorite.bankCode},currency:'THB',favorite};
}

function favoriteIdentity(transfer) {
  if(!transfer) return '';
  if(transfer.destinationType==='bank') return `bank:${transfer.bankCode||'scb'}:${transfer.accountNo||transfer.destinationId}`;
  return `${transfer.destinationType}:${transfer.destinationId}`;
}

function matchingFavorite(transfer) { const identity=favoriteIdentity(transfer); return (state.favorites||[]).find(item=>item.identity===identity); }

function renderFavoriteTransfers() {
  const container=$('#favoriteTransfers'); if(!container) return;
  const favorites=(state.favorites||[]).filter(item=>item.destinationType==='bank'||(item.destinationType==='account'&&accountById(item.targetId))||(item.destinationType==='goal'&&goalById(item.targetId)));
  container.innerHTML=favorites.length?`<p class="favorite-list-head">รายการโปรด</p><div class="favorite-list">${favorites.map(item=>`<button type="button" class="favorite-transfer" data-favorite-transfer="${esc(item.id)}"><span>${icon('star')}</span><span><b>${esc(item.name)}</b><small>${esc(item.meta||'ปลายทางที่บันทึกไว้')}</small></span>${icon('chevron-right')}</button>`).join('')}</div>`:`<div class="favorite-empty">${icon('star')}<b>ยังไม่มีรายการโปรด</b><small>เพิ่มได้จากหน้าสลิปหลังโอนเงินสำเร็จ</small></div>`;
}

function mixHex(hex, target, weight) {
  const source = /^#[0-9a-f]{6}$/i.test(hex) ? hex : '#58f38e';
  const end = /^#[0-9a-f]{6}$/i.test(target) ? target : '#ffffff';
  const channels = [1,3,5].map(index => Math.round(parseInt(source.slice(index,index+2),16) * (1-weight) + parseInt(end.slice(index,index+2),16) * weight));
  return `#${channels.map(value => value.toString(16).padStart(2,'0')).join('')}`;
}

function accountGradient(color) {
  return `linear-gradient(135deg,${mixHex(color,'#ffffff',.68)} 0%,${mixHex(color,'#ffffff',.18)} 54%,${mixHex(color,'#111111',.12)} 100%)`;
}

function accountTagClass(account) { return account.id === 'usd' ? 'purple-tag' : account.id === 'fcd' ? 'green-tag' : ''; }

function accountRowHTML(account) {
  const equivalent = account.currency === 'THB' ? '' : `≈ ${formatAmount(account.balance * rateOf(account.currency), 'THB')}`;
  const separatedTHB = state.goals.reduce((sum, goal) => sum + Number(goal.balance || 0), 0);
  const separatedAmount = separatedTHB / rateOf(account.currency);
  const description = account.currency === 'THB'
    ? 'บัญชีออมทรัพย์ประเทศไทย'
    : account.id === 'fcd' ? 'บัญชีเงินฝากเงินตราต่างประเทศ' : 'บัญชีเงินฝากสกุลดอลลาร์สหรัฐ';
  return `<button class="account-row" data-account="${esc(account.id)}" style="--account-gradient:${account.gradient}" aria-label="เปิดบัญชี ${esc(account.name)}">
    ${flagHTML(account)}
    <span class="account-name"><b>${esc(account.name)}</b><small>${esc(description)}</small></span>
    <span class="account-id"><b>${esc(account.accountNo || account.id)} ${icon('copy','icon icon-inline')}</b></span>
    <span class="account-available">
      <small>ยอดเงินที่ใช้ได้ ${icon('info','icon icon-inline')}</small>
      <strong class="balance-value">${formatAmount(account.balance, account.currency)}</strong>
      ${equivalent ? `<em class="balance-value">${equivalent}</em>` : ''}
    </span>
    <span class="account-footer">
      <span class="account-separated"><small>ยอดเงินที่แยกเก็บได้ ${icon('info','icon icon-inline')}</small><strong class="balance-value">${formatAmount(separatedAmount, account.currency)}</strong></span>
      <span class="account-book">${icon('book','icon icon-inline')}<b>สมุดบัญชี</b>${icon('chevron-right','icon icon-inline')}</span>
    </span>
  </button>`;
}

function updateHomeAccountDeck() {
  const deck = $('#accountList');
  const cards = $$('.account-row', deck);
  if (!cards.length) return;
  homeDeckIndex = (homeDeckIndex + cards.length) % cards.length;
  deck.setAttribute('aria-label', 'ปัดขึ้นหรือลงเพื่อสลับบัญชี');
  cards.forEach((card, index) => {
    const depth = (index - homeDeckIndex + cards.length) % cards.length;
    card.classList.remove('deck-active', 'deck-next', 'deck-last', 'deck-hidden', 'leaving-up', 'leaving-down');
    card.style.removeProperty('--drag-y');
    card.style.removeProperty('--drag-rotate');
    if (depth === 0) card.classList.add('deck-active');
    else if (depth === 1) card.classList.add('deck-next');
    else if (depth === 2) card.classList.add('deck-last');
    else card.classList.add('deck-hidden');
    card.tabIndex = depth === 0 ? 0 : -1;
    card.setAttribute('aria-hidden', depth === 0 ? 'false' : 'true');
  });
}

function switchHomeAccount(direction) {
  if (homeDeckAnimating) return;
  const cards = $$('#accountList .account-row');
  if (cards.length < 2) return;
  const activeCard = cards[homeDeckIndex];
  homeDeckAnimating = true;
  activeCard?.classList.add(direction > 0 ? 'leaving-up' : 'leaving-down');
  clearTimeout(homeDeckAnimationTimer);
  homeDeckAnimationTimer = setTimeout(() => {
    homeDeckIndex = (homeDeckIndex + direction + cards.length) % cards.length;
    homeDeckAnimating = false;
    updateHomeAccountDeck();
  }, 240);
}

function bindHomeAccountDeck() {
  const deck = $('#accountList');
  if (!deck || deck.dataset.deckBound === 'true') return;
  deck.dataset.deckBound = 'true';

  deck.addEventListener('pointerdown', event => {
    if (homeDeckAnimating || (event.pointerType === 'mouse' && event.button !== 0) || !event.target.closest('.deck-active')) return;
    homeDeckPointerId = event.pointerId;
    homeDeckStartY = event.clientY;
    homeDeckCurrentY = event.clientY;
    homeDeckWasDragged = false;
    deck.classList.add('deck-dragging');
    deck.setPointerCapture?.(event.pointerId);
  });

  deck.addEventListener('pointermove', event => {
    if (event.pointerId !== homeDeckPointerId) return;
    homeDeckCurrentY = event.clientY;
    const distance = Math.max(-52, Math.min(52, homeDeckCurrentY - homeDeckStartY));
    if (Math.abs(distance) > 6) {
      homeDeckWasDragged = true;
      event.preventDefault();
    }
    const activeCard = $('.account-row.deck-active', deck);
    activeCard?.style.setProperty('--drag-y', `${distance}px`);
    activeCard?.style.setProperty('--drag-rotate', `${distance / 38}deg`);
  });

  const finishDrag = event => {
    if (event.pointerId !== homeDeckPointerId) return;
    const distance = homeDeckCurrentY - homeDeckStartY;
    homeDeckSuppressClick = homeDeckWasDragged;
    homeDeckPointerId = null;
    deck.classList.remove('deck-dragging');
    deck.releasePointerCapture?.(event.pointerId);
    const activeCard = $('.account-row.deck-active', deck);
    activeCard?.style.removeProperty('--drag-y');
    activeCard?.style.removeProperty('--drag-rotate');
    if (homeDeckWasDragged && Math.abs(distance) >= 28) switchHomeAccount(distance < 0 ? 1 : -1);
  };

  deck.addEventListener('pointerup', finishDrag);
  deck.addEventListener('pointercancel', finishDrag);
  deck.addEventListener('click', event => {
    if (!homeDeckSuppressClick) return;
    event.preventDefault();
    event.stopPropagation();
    homeDeckSuppressClick = false;
  }, true);
  deck.addEventListener('wheel', event => {
    if (homeDeckWheelLocked || Math.abs(event.deltaY) < 12) return;
    event.preventDefault();
    homeDeckWheelLocked = true;
    switchHomeAccount(event.deltaY > 0 ? 1 : -1);
    setTimeout(() => { homeDeckWheelLocked = false; }, 430);
  }, { passive:false });
  deck.addEventListener('keydown', event => {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    switchHomeAccount(event.key === 'ArrowDown' ? 1 : -1);
  });
}

function renderAccounts() {
  $('#accountList').innerHTML = state.accounts.map(accountRowHTML).join('');
  updateHomeAccountDeck();
  const cards = state.accounts.map((account,index) => `<article class="account-card-shell ${reorderMode?'sorting':''}"><button class="all-account-card" data-account="${esc(account.id)}" style="background:${account.gradient}"><div class="card-top"><b>${flagHTML(account,true)} ${esc(account.name)}</b><span>${icon('chevron-right')}</span></div><strong class="balance-value">${formatAmount(account.balance,account.currency)}</strong>${account.currency === 'USD' ? `<small class="balance-value">≈ ${formatAmount(account.balance*rateOf(account.currency),'THB')}</small>` : '<small>พร้อมใช้และโอนไปยังกล่องเป้าหมาย</small>'}</button><div class="account-order-controls"><span>${icon('sort')}<b>ลำดับ ${index+1}</b></span><button data-edit-account-color="${esc(account.id)}" aria-label="แก้ไขสี ${esc(account.name)}">${icon('settings')}</button><button data-move-account="${esc(account.id)}" data-direction="-1" ${index===0?'disabled':''} aria-label="เลื่อน ${esc(account.name)} ขึ้น">${icon('up')}</button><button data-move-account="${esc(account.id)}" data-direction="1" ${index===state.accounts.length-1?'disabled':''} aria-label="เลื่อน ${esc(account.name)} ลง">${icon('down')}</button></div></article>`).join('');
  $('#allAccountCards').innerHTML = `${cards}<button class="add-account-card" data-action="add-account"><span>${icon('plus')}</span><b>เพิ่ม Pocket ใหม่</b><small>สร้างบัญชี THB หรือ USD เพิ่มได้</small></button>`;
  $('#allAccountCards').classList.toggle('reorder-active',reorderMode); $('#reorderAccounts').classList.toggle('active',reorderMode); $('#reorderHint').hidden=!reorderMode;
}

function maskedCardNumber(number) {
  const digits=String(number||'').replace(/\D/g,'').padEnd(16,'0').slice(0,16); return `•••• •••• •••• ${digits.slice(-4)}`;
}

function cardVisualHTML(compact=false) {
  const card=state.debitCard;
  if(compact) return `<div class="debit-card-art compact" style="--card-color:${esc(card.color)}"><span class="card-glow"></span><span class="card-brand"><b>${esc(card.title)}</b><small>บัตรเดบิต Pocket Mastercard</small></span><strong>•••• ${String(card.number||'').replace(/\D/g,'').slice(-4)}</strong><span class="card-network"><i></i><i></i></span><button class="compact-card-open" data-action="open-card" aria-label="เปิดข้อมูลบัตรเดบิต">ดูข้อมูลบัตร</button></div>`;
  return `<div class="debit-card-art" style="--card-color:${esc(card.color)}"><span class="card-glow"></span><span class="card-brand"><b>${esc(card.title)}</b><small>DEBIT</small></span><span class="card-chip"></span><strong>${maskedCardNumber(card.number)}</strong><span class="card-holder">${esc(card.holder)}</span><span class="card-network"><i></i><i></i></span></div>`;
}

function renderDebitCard() {
  $('#debitMiniCard').innerHTML=cardVisualHTML(true);
  $('#debitCardLarge').innerHTML=cardVisualHTML(false);
  $('#cardSubtitle').textContent=`${state.debitCard.title} Mastercard`;
  $('#cardUpdated').textContent=formatTime();
  $('#cardAccountStrip').innerHTML=state.accounts.slice(0,3).map(account=>`<article class="card-account-mini"><div>${flagHTML(account,true)}<b>${esc(account.name)}</b></div><strong class="balance-value">${formatAmount(account.balance,account.currency)}</strong>${account.currency==='USD'?`<small class="balance-value">≈ ${formatAmount(account.balance*rateOf(account.currency),'THB')}</small>`:''}</article>`).join('');
  const expenses=[...state.transactions].filter(tx=>tx.type==='expense').sort((a,b)=>new Date(b.date)-new Date(a.date));
  $('#cardTransactions').innerHTML=expenses.length?expenses.map(tx=>transactionHTML(tx)).join(''):'<p class="empty">ยังไม่มีรายการใช้งานบัตร</p>';
}

function renderGoals() {
  const cards = state.goals.map(goal => {
    const percent = Math.min(100, Math.round(goal.balance / goal.target * 100));
    return `<article class="goal-card" style="--goal:${goal.color}"><button class="goal-open" data-goal-open="${esc(goal.id)}"><small>${icon('target','icon icon-inline')} เป้าหมาย</small><strong>${esc(goal.name)}</strong><div class="progress"><i style="width:${percent}%"></i></div><div class="goal-meta"><span class="balance-value">${formatAmount(goal.balance,'THB')}</span><span>${percent}%</span></div></button><button class="goal-delete" data-delete-goal="${esc(goal.id)}" aria-label="ลบกล่อง ${esc(goal.name)}">${icon('trash')}</button></article>`;
  }).join('');
  $('#goalCarousel').innerHTML = cards || '<p class="empty">ยังไม่มีกล่องเป้าหมาย</p>';
  $('#goalList').innerHTML = state.goals.map(goal => { const percent=Math.min(100,Math.round(goal.balance/goal.target*100)); return `<article class="goal-row"><button class="goal-row-open" data-goal-open="${esc(goal.id)}"><span class="goal-dot" style="--goal:${goal.color}"></span><span><b>${esc(goal.name)}</b><small class="balance-value">${formatAmount(goal.balance,'THB')} จาก ${formatAmount(goal.target,'THB')}</small></span><strong>${percent}%</strong></button><button class="goal-delete row-delete" data-delete-goal="${esc(goal.id)}" aria-label="ลบกล่อง ${esc(goal.name)}">${icon('trash')}</button></article>`; }).join('') || '<p class="empty">ยังไม่มีกล่องเป้าหมาย</p>';
}

function renderExternalBanks() {
  const list=$('#externalBankList'); if(!list) return;
  list.innerHTML=state.externalBanks.length?state.externalBanks.map(bank=>{
    const profile=bankProfile(bank.bankCode);
    return `<article class="external-bank-row">${bankBadgeHTML(bank)}<span><b>${esc(bank.nickname||profile.name)}</b><small>${esc(profile.name)} · •••• ${esc(String(bank.accountNo||'').slice(-4))}</small></span><button data-delete-external-bank="${esc(bank.id)}" aria-label="ลบ ${esc(bank.nickname||profile.name)}">${icon('trash')}</button></article>`;
  }).join(''):`<button class="external-bank-empty" data-action="add-external-bank"><span>${icon('plus')}</span><b>เพิ่มบัญชีธนาคาร</b><small>บันทึกปลายทางที่โอนเป็นประจำ</small></button>`;
}

function entityName(type, id) {
  return type === 'goal' ? goalById(id)?.name || 'กล่องเป้าหมาย' : accountById(id)?.name || 'บัญชี';
}

function transactionHTML(tx, scopeAccountId = null) {
  let iconName = 'transfer', title = '', subtitle = tx.note || '', amount = '', className = '';
  if (tx.type === 'transfer') {
    const from = accountById(tx.from);
    title = `${from?.name || 'บัญชี'} → ${entityName(tx.toType, tx.to)}`;
    subtitle ||= 'โอนเงิน';
    if (scopeAccountId && tx.toType === 'account' && tx.to === scopeAccountId) { amount = `+${formatAmount(tx.received,tx.receivedCurrency)}`; className='positive'; }
    else { amount = `−${formatAmount(tx.amount,tx.currency)}`; className='negative'; }
  } else {
    iconName = tx.type === 'income' ? 'deposit' : 'withdraw';
    title = tx.note || (tx.type === 'income' ? 'เงินเข้า' : 'รายจ่าย');
    const goalId=String(tx.account||'').startsWith('goal:')?String(tx.account).slice(5):'';
    subtitle = accountById(tx.account)?.name || goalById(goalId)?.name || 'บัญชี';
    amount = `${tx.type === 'income' ? '+' : '−'}${formatAmount(tx.amount,tx.currency)}`;
    className = tx.type === 'income' ? 'positive' : 'negative';
  }
  return `<article class="transaction"><span class="tx-icon">${icon(iconName)}</span><span class="tx-copy"><b>${esc(title)}</b><small>${esc(subtitle)} · ${formatTime(tx.date)}</small></span><span class="tx-money"><b class="${className} balance-value">${amount}</b><small>${tx.type === 'transfer' && tx.receivedCurrency !== tx.currency ? `ได้ ${formatAmount(tx.received,tx.receivedCurrency)}` : ''}</small></span></article>`;
}

function relatedToAccount(tx, id) { return tx.account === id || tx.from === id || (tx.toType === 'account' && tx.to === id); }

function renderTransactions() {
  const sorted = [...state.transactions].sort((a,b) => new Date(b.date) - new Date(a.date));
  $('#recentList').innerHTML = sorted.length ? sorted.slice(0,3).map(tx => transactionHTML(tx)).join('') : '<p class="empty">ยังไม่มีรายการ</p>';
  const filtered = transactionFilter === 'all' ? sorted : sorted.filter(tx => tx.type === transactionFilter);
  $('#allTransactions').innerHTML = filtered.length ? filtered.map(tx => transactionHTML(tx)).join('') : '<p class="empty">ไม่พบรายการประเภทนี้</p>';
  const accountItems = sorted.filter(tx => relatedToAccount(tx, selectedAccountId));
  $('#accountTransactions').innerHTML = accountItems.length ? accountItems.map(tx => transactionHTML(tx,selectedAccountId)).join('') : '<p class="empty">ยังไม่มีรายการในบัญชีนี้</p>';
}

function accountCardHTML(account) {
  const equivalent = account.currency === 'USD' ? `<small class="balance-value">≈ ${formatAmount(account.balance*rateOf(account.currency),'THB')}</small>` : '';
  return `<section class="account-hero" style="background:${account.gradient}" aria-label="บัญชี ${esc(account.name)}"><div class="hero-head"><div class="hero-brand">${flagHTML(account)}<div><h2>${esc(account.name)}</h2><p>บัญชีดำเนินการในประเทศ${esc(account.country)}</p></div></div><span class="account-number">${esc(account.accountNo)} ${icon('copy','icon icon-inline')}</span></div><div class="hero-balance"><span>ยอดเงินที่ใช้ได้ ${icon('info','icon icon-inline')}</span><strong class="balance-value">${formatAmount(account.balance,account.currency)}</strong>${equivalent}</div><div class="hero-split"><div><span>${account.id==='fcd'?'บัญชีเงินฝากเงินตราต่างประเทศ':'ยอดเงินที่แยกเก็บได้'} ${icon('info','icon icon-inline')}</span><b class="balance-value">${account.id==='thb'?formatAmount(state.goals.reduce((sum,goal)=>sum+goal.balance,0),'THB'):formatAmount(account.balance*.15,account.currency)}</b></div><button class="book-button">${icon('book','icon icon-inline')} สมุดบัญชี ${icon('chevron-right','icon icon-inline')}</button></div></section>`;
}

function renderDetail() {
  const account = accountById(selectedAccountId) || state.accounts[0];
  if (!account) return;
  $('#accountDetailCard').innerHTML = accountCardHTML(account);
  updateDetailMeta();
}

function updateDetailMeta() {
  const account = accountById(selectedAccountId) || state.accounts[0];
  if (!account) return;
  $('#detailUpdated').textContent = formatTime();
  $('#detailInterest').textContent = formatAmount(account.balance * .00008,account.currency);
  $('#accountTransactionTitle').textContent = `รายการเดินบัญชี ${account.name}`;
  const actions = account.currency === 'THB'
    ? [['transfer','transfer','โอนเงิน'],['income','deposit','ฝากเงิน'],['expense','withdraw','รายจ่าย'],['scan','scan','สแกน']]
    : [['exchange-in','deposit','แลกเงินเข้า'],['exchange-out','withdraw','แลกเงินออก'],['income','plus','เพิ่มเงิน'],['scan','scan','สแกน']];
  $('#accountActions').innerHTML = actions.map(([action,iconName,label]) => `<button data-action="${action}" data-account-source="${account.id}"><span>${icon(iconName)}</span><b>${label}</b></button>`).join('');
  renderTransactions();
  updateBalanceVisibility();
}

function renderProfileAndSettings() {
  $('#profileName').textContent = state.profileName;
  $('#profileStats').innerHTML = `<div class="profile-stat"><span>มูลค่ารวมโดยประมาณ</span><strong class="balance-value">${formatAmount(totalTHB(),'THB')}</strong></div><div class="profile-stat"><span>กล่องเป้าหมาย</span><strong>${state.goals.length} กล่อง</strong></div>`;
  Object.entries(state.settings).forEach(([key,value]) => $(`#${key}Switch`)?.classList.toggle('on',Boolean(value)));
  const permission = 'Notification' in window ? Notification.permission : 'unsupported';
  const status = $('#systemNotificationStatus');
  if(status) status.textContent = permission === 'granted' ? 'เปิดแล้ว — แจ้งเตือนเมื่อฝากอัตโนมัติสำเร็จ' : permission === 'denied' ? 'ถูกปิดในเบราว์เซอร์ กรุณาเปิดจากการตั้งค่าเครื่อง' : permission === 'unsupported' ? 'เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน' : 'แตะเพื่ออนุญาตการแจ้งเตือน';
}

const planText = text => { const cut = text.indexOf(': '); return cut > 0 && cut < 40 ? `<b>${esc(text.slice(0, cut))}:</b> ${esc(text.slice(cut + 2))}` : esc(text); };
const planById = id => PLAN_CATALOG.find(plan => plan.id === id) || PLAN_CATALOG[0];
const PLAN_GROUP_NOTES = {
  business:'หมายเหตุจากฝ่ายบริหาร: เพื่อเสถียรภาพของระบบโครงสร้างพื้นฐานและการรักษาความปลอดภัยระดับองค์กร (SLA) แผนธุรกิจจึงสงวนสิทธิ์การให้บริการในรูปแบบสมัครสมาชิก (Subscription) เท่านั้น'
};
let planGroup = 'individual';
const planSeats = {};
const expandedPlans = new Set();
const plansInGroup = () => PLAN_CATALOG.filter(plan => (plan.group || 'individual') === planGroup);

function renderPlans() {
  const current = planById(state.plan);
  const label = $('#currentPlanLabel');
  if (label) label.textContent = `${current.name} · ${current.price} ${current.priceNote}`;
  const plans = plansInGroup();
  $$('#planGroupToggle [data-plan-group]').forEach(button => { const active = button.dataset.planGroup === planGroup; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  const note = $('#planGroupNote');
  if (note) { note.hidden = !PLAN_GROUP_NOTES[planGroup]; note.textContent = PLAN_GROUP_NOTES[planGroup] || ''; }
  const tabs = $('#planTabs');
  if (tabs) tabs.innerHTML = plans.map(plan => `<button type="button" role="tab" data-plan-jump="${plan.id}">${esc(plan.name)}</button>`).join('');
  const grid = $('#planGrid');
  if (!grid) return;
  const scrollLeft = grid.scrollLeft;
  grid.innerHTML = plans.map(plan => {
    const isCurrent = plan.id === current.id;
    const [heroTitle, ...heroLines] = plan.hero || [];
    const ctaLabel = isCurrent ? 'Current Plan' : esc(plan.cta);
    const ribbon = plan.badges.find(badge => badge.ribbon);
    const seats = planSeats[plan.id] ?? plan.minSeats;
    return `<article class="plan-card ${plan.id} ${plan.group === 'business' ? 'biz' : 'solo'}${ribbon ? ' has-ribbon' : ''}${isCurrent ? ' current' : ''}" data-plan-card="${plan.id}">
      ${ribbon ? `<div class="plan-ribbon">${esc(ribbon.text)}</div>` : ''}
      <header class="plan-head"><h2>${esc(plan.name)}${plan.badges.filter(badge => !badge.ribbon).map(badge => `<span class="plan-badge${badge.best ? ' best' : ''}${badge.dark ? ' dark' : ''}">${esc(badge.text)}</span>`).join('')}${isCurrent ? '<span class="plan-current-chip">ใช้อยู่</span>' : ''}</h2><p>${esc(plan.tagline)}</p></header>
      ${heroTitle ? `<div class="plan-hero"><b>${icon('sparkle')}<span>${esc(heroTitle)}</span></b>${heroLines.map(([mark, text]) => `<p><span>${esc(mark)}</span>${esc(text)}</p>`).join('')}</div>` : ''}
      <div class="plan-price">${plan.oldPrice ? `<s>${esc(plan.oldPrice)}</s>` : ''}<strong>${esc(plan.price)}</strong><small>${esc(plan.priceNote)}</small>${plan.priceSub ? `<small class="plan-price-sub">${esc(plan.priceSub)}</small>` : ''}</div>
      <div class="plan-action"><button type="button" class="plan-cta" ${plan.contactOnly ? `data-contact-plan="${plan.id}"` : `data-select-plan="${plan.id}"`} ${isCurrent ? 'disabled' : ''}>${ctaLabel}</button>${plan.saveNote ? `<p>${esc(plan.saveNote)}</p>` : ''}</div>
      ${plan.minSeats ? `<div class="plan-seats"><button type="button" data-seat-plan="${plan.id}" data-seat-step="-1" aria-label="ลดจำนวนที่นั่ง" ${seats <= plan.minSeats ? 'disabled' : ''}>−</button><b>${seats} seats</b><button type="button" data-seat-plan="${plan.id}" data-seat-step="1" aria-label="เพิ่มจำนวนที่นั่ง" ${seats >= 99 ? 'disabled' : ''}>+</button></div>` : ''}
      ${plan.learnMore ? `<button type="button" class="plan-secondary" data-plan-learn="${plan.id}">Learn more</button>` : ''}
      <div class="plan-details${expandedPlans.has(plan.id) ? ' open' : ''}"><div class="plan-details-body">
      <section class="plan-limits"><h3>${icon(plan.limitsIcon || 'lock')}<span>${esc(plan.limitsTitle || 'ข้อจำกัดระบบและฟีเจอร์')}</span>${icon('info')}</h3>${plan.limits.map(([ok, name, value, note]) => `<div class="plan-limit ${ok ? 'yes' : 'no'}">${icon(ok ? 'check' : 'x')}<span><b>${esc(name)}</b><em>${esc(value)}</em>${note ? `<small>${esc(note)}</small>` : ''}</span></div>`).join('')}</section>
      ${plan.features ? `<section class="plan-features"><h3>${icon('sparkle')}<span>${esc(plan.featuresTitle)}</span></h3><ul>${plan.features.map(([ok, text, note]) => `<li class="${ok ? 'yes' : 'no'}">${icon(ok ? 'check' : 'x')}<span>${planText(text)}${note ? `<small>${esc(note)}</small>` : ''}</span></li>`).join('')}</ul></section>` : ''}
      ${plan.restrictions ? `<section class="plan-features plan-restrictions"><h3>${icon('x-circle')}<span>${esc(plan.restrictionsTitle)}</span></h3><ul>${plan.restrictions.map(text => `<li class="no">${icon('x')}<span>${planText(text)}</span></li>`).join('')}</ul></section>` : ''}
      </div><button type="button" class="plan-more" data-plan-more="${plan.id}" aria-expanded="${expandedPlans.has(plan.id)}"><span>${expandedPlans.has(plan.id) ? 'แสดงน้อยลง' : 'แสดงเพิ่มเติม'}</span>${icon('down')}</button></div>
    </article>`;
  }).join('');
  grid.scrollLeft = scrollLeft;
  syncPlanTabs();
}

function togglePlanDetails(id, forceOpen = false) {
  const open = forceOpen || !expandedPlans.has(id);
  if (open) expandedPlans.add(id); else expandedPlans.delete(id);
  const details = $(`[data-plan-card="${id}"] .plan-details`);
  if (!details) return;
  details.classList.toggle('open', open);
  const button = details.querySelector('.plan-more');
  button.setAttribute('aria-expanded', String(open));
  button.querySelector('span').textContent = open ? 'แสดงน้อยลง' : 'แสดงเพิ่มเติม';
  if (!open) details.closest('.plan-card').scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
}

function setPlanGroup(group) {
  if (group === planGroup) return;
  planGroup = group;
  renderPlans();
  const target = plansInGroup().some(plan => plan.id === state.plan) ? state.plan : plansInGroup()[0]?.id;
  requestAnimationFrame(() => jumpToPlan(target, false));
}

function openPlans() {
  planGroup = planById(state.plan).group || 'individual';
  renderPlans();
  requestAnimationFrame(() => jumpToPlan(state.plan, false));
}

function planCardOffset(card) {
  const first = $('#planGrid')?.firstElementChild;
  return first ? card.offsetLeft - first.offsetLeft : 0;
}

function jumpToPlan(id, smooth = true) {
  const grid = $('#planGrid');
  const card = grid?.querySelector(`[data-plan-card="${id}"]`);
  if (!card) return;
  grid.scrollTo({ left: planCardOffset(card), behavior: smooth ? 'smooth' : 'auto' });
  syncPlanTabs(id);
}

function syncPlanTabs(forceId) {
  const grid = $('#planGrid');
  if (!grid) return;
  let activeId = forceId;
  if (!activeId) {
    let best = Infinity;
    [...grid.children].forEach(card => { const distance = Math.abs(planCardOffset(card) - grid.scrollLeft); if (distance < best) { best = distance; activeId = card.dataset.planCard; } });
  }
  $$('#planTabs [data-plan-jump]').forEach(button => { const active = button.dataset.planJump === activeId; button.classList.toggle('active', active); button.setAttribute('aria-selected', String(active)); });
  [...grid.children].forEach(card => card.classList.toggle('in-view', card.dataset.planCard === activeId));
}

function stepPlan(direction) {
  const ids = plansInGroup().map(plan => plan.id);
  const activeId = $('#planTabs .active')?.dataset.planJump || ids[0];
  const next = ids[Math.min(ids.length - 1, Math.max(0, ids.indexOf(activeId) + direction))];
  if (next) jumpToPlan(next);
}

function selectPlan(id) {
  if (!PLAN_CATALOG.some(plan => plan.id === id) || state.plan === id) return;
  state.plan = id;
  saveState(`เปลี่ยนเป็นแพลน ${planById(id).name} แล้ว`);
}

function renderSchedules() {
  const list=$('#scheduleList'); if(!list) return;
  const schedules=[...(state.scheduledDeposits||[])].filter(item=>item.status!=='done').sort((a,b)=>new Date(a.runAt)-new Date(b.runAt));
  list.innerHTML=schedules.length?schedules.map(item=>{const destination=getScheduleDestination(item);const label=item.status==='done'?'ดำเนินการแล้ว':item.status==='failed'?'ไม่สำเร็จ':'รอดำเนินการ';return `<article class="schedule-item ${esc(item.status)}"><span class="schedule-icon">${icon('calendar')}</span><span><b>${esc(destination.entity?.name||'กล่องที่ถูกลบ')}</b><small>${formatTime(item.runAt)} · ${formatAmount(item.amount,item.currency||destination.currency,true)}</small><em>${label}</em></span><button data-delete-schedule="${esc(item.id)}" aria-label="ลบรายการตั้งเวลา">${icon('trash')}</button></article>`;}).join(''):'<p class="schedule-empty">ยังไม่มีรายการฝากอัตโนมัติ</p>';
  const select=$('#scheduleDestination');
  if(select){const previous=select.value;select.innerHTML=`<optgroup label="เงินของฉัน">${state.accounts.map(account=>`<option value="account:${esc(account.id)}">${account.flag} ${esc(account.name)} · ${esc(account.currency)}</option>`).join('')}</optgroup>${state.goals.length?`<optgroup label="กล่องเป้าหมาย">${state.goals.map(goal=>`<option value="goal:${esc(goal.id)}">◎ ${esc(goal.name)} · THB</option>`).join('')}</optgroup>`:''}`;if([...select.options].some(option=>option.value===previous))select.value=previous;updateScheduleDestination();}
}

function getScheduleDestination(value) {
  let type,id;
  if(typeof value==='string') [type,id]=value.split(':');
  else {type=value.destinationType||(value.goalId?'goal':'account');id=value.destinationId||value.goalId;}
  const entity=type==='goal'?goalById(id):accountById(id);
  return {type,id,entity,currency:type==='goal'?'THB':entity?.currency||'THB'};
}

function updateScheduleDestination() {
  const destination=getScheduleDestination($('#scheduleDestination')?.value||'');
  $('#scheduleCurrency').textContent=destination.currency;
  $('#scheduleDestinationNote').textContent=destination.type==='goal'?`บันทึกเงินเข้า “${destination.entity?.name||'กล่องเป้าหมาย'}” โดยตรง`:`บันทึกเป็นเงินเข้าใน “${destination.entity?.name||'Pocket'}”`;
}

function renderAll() {
  renderAccounts(); renderGoals(); renderExternalBanks(); renderFavoriteTransfers(); renderTransactions(); renderDetail(); renderDebitCard(); renderProfileAndSettings(); renderPlans(); renderSchedules(); fillSelects();
  $('#updatedAt').textContent = formatTime();
  $('#interestTotal').textContent = `฿${new Intl.NumberFormat('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}).format(totalTHB()*.00008)}`;
  updateBalanceVisibility();
}

function updateBalanceVisibility() { $$('.balance-value').forEach(element => element.classList.toggle('balance-hidden',state.settings.hideBalances)); }

function syncViewChrome(view) {
  const dark=['home','accountDetail','cardDetail','plans'].includes(view);
  const color=dark?'#17181b':'#f5f6f3';
  document.body.dataset.activeView=view;
  document.documentElement.style.backgroundColor=color;
  document.body.style.backgroundColor=color;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',color);
}

/* ---------- checkout: PromptPay QR with the plan's amount ---------- */
const PROMPTPAY_ID = '0066807237949';            // from the owner's PromptPay QR
const tlv = (id, v) => id + String(v.length).padStart(2, '0') + v;
function crc16(s){ let c = 0xFFFF; for (let i = 0; i < s.length; i++){ c ^= s.charCodeAt(i) << 8; for (let k = 0; k < 8; k++) c = (c & 0x8000) ? ((c << 1) ^ 0x1021) & 0xFFFF : (c << 1) & 0xFFFF; } return c.toString(16).toUpperCase().padStart(4, '0'); }
function promptPayPayload(amount){
  const body = tlv('00','01') + tlv('01','12') + tlv('29', tlv('00','A000000677010111') + tlv('01', PROMPTPAY_ID)) + tlv('53','764') + tlv('54', amount.toFixed(2)) + tlv('58','TH') + '6304';
  return body + crc16(body);
}
const baht = n => '฿' + n.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2});
const priceNum = p => Number(String(p.price).replace(/[^\d.]/g, '')) || 0;
let payOrder = null;
function openPay(id){
  const plan = planById(id);
  const seats = plan.minSeats ? (planSeats[plan.id] ?? plan.minSeats) : 1;
  const unit = priceNum(plan);
  payOrder = {plan, seats, unit, total: unit * seats};
  $('#payAmount').textContent = baht(payOrder.total);
  $('#payGo').textContent = 'ชำระเงิน ' + baht(payOrder.total);
  $('#payLines').innerHTML = `<p><span>แพลน</span><b>${esc(plan.name)}</b></p>` +
    (plan.minSeats ? `<p><span>ราคาต่อที่นั่ง</span><b>${baht(unit)}</b></p><p><span>จำนวนที่นั่ง</span><b>${seats} ที่นั่ง</b></p>` : '') +
    `<p><span>รอบการชำระ</span><b>${esc(plan.priceNote.replace(/^\/\s*/, ''))}</b></p><p><span>ยอดรวม</span><b>${baht(payOrder.total)}</b></p>`;
  $('#paySum').classList.remove('open');
  navigate('pay');
}

/* 30-minute payment window: when it runs out the QR is hidden and can be made again */
let qrTimer = 0, qrEnd = 0;
const pad2 = n => String(n).padStart(2, '0');
function tickQR(){
  const left = Math.max(0, qrEnd - Date.now()), sec = Math.ceil(left / 1000);
  $('#qrLeft').textContent = pad2(Math.floor(sec / 60)) + ':' + pad2(sec % 60);
  if (!left){ clearInterval(qrTimer); $('#qrExp').hidden = false; $('.qr-box').classList.add('expired'); }
}
function startQRTimer(){
  clearInterval(qrTimer);
  qrEnd = Date.now() + 30 * 60 * 1000;
  const d = new Date(qrEnd);
  $('#qrDeadline').textContent = `${pad2(d.getHours())}:${pad2(d.getMinutes())}, ${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear() + 543}`;
  $('#qrExp').hidden = true; $('.qr-box').classList.remove('expired');
  tickQR(); qrTimer = setInterval(tickQR, 1000);
}
function openQR(){
  if (!payOrder) return;
  const qr = qrcode(0, 'M'); qr.addData(promptPayPayload(payOrder.total)); qr.make();
  $('#qrSvg').innerHTML = qr.createSvgTag({cellSize:4, margin:0, scalable:true});
  $('#qrAmt').textContent = baht(payOrder.total);
  $('#qrPlan').textContent = payOrder.plan.name + (payOrder.plan.minSeats ? ` · ${payOrder.seats} SEATS` : '');
  startQRTimer();
  $('#qrSheet').classList.add('open'); $('#qrSheet').setAttribute('aria-hidden', 'false');
}
function closeQR(){ clearInterval(qrTimer); $('#qrSheet').classList.remove('open'); $('#qrSheet').setAttribute('aria-hidden', 'true'); }

function navigate(view) {
  activeView = view;
  syncViewChrome(view);
  $$('.view').forEach(element => element.classList.toggle('active',element.id === `${view}View`));
  $('#bottomNav').classList.toggle('hidden', view === 'plans' || view === 'pay');
  const navKey = view === 'plans' ? 'settings' : view;
  $$('#bottomNav [data-nav]').forEach(button => button.classList.toggle('active',button.dataset.nav === navKey));
  if (view === 'plans') openPlans();
  window.scrollTo({top:0,behavior:'smooth'});
}

function openDetail(id) {
  if (!accountById(id)) return;
  detailReturnView = activeView==='accounts'?'accounts':'home';
  selectedAccountId = id; activeView = 'accountDetail';
  syncViewChrome(activeView);
  $$('.view').forEach(element => element.classList.toggle('active',element.id === 'accountDetailView'));
  $('#bottomNav').classList.remove('hidden');
  $$('#bottomNav [data-nav]').forEach(button => button.classList.toggle('active',button.dataset.nav === 'accounts'));
  renderDetail(); window.scrollTo({top:0,behavior:'smooth'});
}

function openDebitCard() {
  activeView='cardDetail'; syncViewChrome(activeView); $$('.view').forEach(element=>element.classList.toggle('active',element.id==='cardDetailView')); $('#bottomNav').classList.remove('hidden'); $$('#bottomNav [data-nav]').forEach(button=>button.classList.toggle('active',button.dataset.nav==='accounts')); renderDebitCard(); window.scrollTo({top:0,behavior:'smooth'});
}

function showSheet(id) { const sheet=$(id); sheet.classList.add('open'); sheet.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; }
function closeSheets() { $$('.sheet.open').forEach(sheet => {sheet.classList.remove('open');sheet.setAttribute('aria-hidden','true');}); document.body.style.overflow=''; $$('.form-error').forEach(error=>error.textContent=''); resetTransferPin(); }

function fillSelects() {
  const accountOptions = state.accounts.map(account => `<option value="${esc(account.id)}">${account.flag} ${esc(account.name)} · ${formatAmount(account.balance,account.currency,true)}</option>`).join('');
  const destinations = state.accounts.map(account => `<option value="account:${esc(account.id)}">${account.flag} ${esc(account.name)}</option>`).join('') + state.goals.map(goal => `<option value="goal:${esc(goal.id)}">◎ กล่อง: ${esc(goal.name)}</option>`).join('');
  const from=$('#transferFrom'), to=$('#transferTo'), entry=$('#entryAccount');
  const fromValue=from.value, toValue=to.value, entryValue=entry.value;
  from.innerHTML=accountOptions; to.innerHTML=destinations; entry.innerHTML=accountOptions;
  if(accountById(fromValue)) from.value=fromValue;
  if([...to.options].some(option=>option.value===toValue)) to.value=toValue;
  if(accountById(entryValue)) entry.value=entryValue;
  const bankFrom=$('#bankTransferFrom');
  if(bankFrom){const bankValue=bankFrom.value;bankFrom.innerHTML=state.accounts.map(account=>`<option value="${esc(account.id)}">${account.flag} ${esc(account.name)} · ${esc(account.currency)}</option>`).join('');if(accountById(bankValue))bankFrom.value=bankValue;updateBankTransferSource();}
  ensureDifferentDestination(); updateTransferPreview(); updateEntryCurrency();
}

function ensureDifferentDestination() {
  const from=$('#transferFrom').value;
  if($('#transferTo').value === `account:${from}`) { const next=state.accounts.find(account=>account.id!==from); if(next) $('#transferTo').value=`account:${next.id}`; else if(state.goals[0]) $('#transferTo').value=`goal:${state.goals[0].id}`; }
}

function openInternalTransfer(fromId='thb', destination='') {
  fillSelects();
  if(accountById(fromId)) $('#transferFrom').value=fromId;
  if(destination && [...$('#transferTo').options].some(option=>option.value===destination)) $('#transferTo').value=destination;
  ensureDifferentDestination(); $('#transferAmount').value=''; $('#transferNote').value=''; updateTransferPreview(); showSheet('#internalTransferSheet');
}

function openTransfer(fromId='thb', destination='') {
  if(destination){openInternalTransfer(fromId,destination);return;}
  fillSelects();
  const account=accountById(fromId); if(account?.currency==='THB') $('#bankTransferFrom').value=fromId;
  $('#bankAccountNumber').value=''; $('#bankTransferAmount').value=''; $('#bankTransferError').textContent='';
  updateBankTransferSource(); validateBankTransfer(); switchBankTab('account'); showSheet('#transferSheet');
}

function destinationInfo() {
  const [type,id]=$('#transferTo').value.split(':');
  if(type==='goal') return {type,id,currency:'THB',entity:goalById(id)};
  const account=accountById(id); return {type:'account',id,currency:account?.currency||'THB',entity:account};
}

function updateTransferPreview() {
  const from=accountById($('#transferFrom').value); const destination=destinationInfo(); const amount=Number($('#transferAmount').value)||0;
  if(!from) return;
  $('#transferCurrency').textContent=from.currency;
  const received=amount*rateOf(from.currency)/rateOf(destination.currency);
  $('#conversionNote').textContent=`ปลายทางจะได้รับประมาณ ${formatAmount(received,destination.currency,true)} · อัตราตัวอย่าง 1 USD = 35.20 THB`;
}

function confirmTransfer() {
  const from=accountById($('#transferFrom').value); const destination=destinationInfo(); const amount=Number($('#transferAmount').value); let error='';
  if(!from||!destination.entity) error='กรุณาเลือกต้นทางและปลายทาง';
  else if(destination.type==='account'&&destination.id===from.id) error='กรุณาเลือกคนละบัญชี';
  else if(!amount||amount<=0) error='กรุณาใส่จำนวนเงิน';
  else if(amount>from.balance) error='ยอดเงินต้นทางไม่เพียงพอ';
  $('#transferError').textContent=error; if(error) return;
  const received=Number((amount*rateOf(from.currency)/rateOf(destination.currency)).toFixed(2));
  pendingTransfer={kind:'internal',originSheet:'#internalTransferSheet',sourceId:from.id,sourceName:from.name,sourceMeta:`${from.accountNo} · ยอดเงิน ${formatAmount(from.balance,from.currency,true)}`,destinationType:destination.type,destinationId:destination.id,destinationName:destination.entity.name,destinationMeta:destination.type==='goal'?'กล่องเป้าหมาย':`${destination.entity.accountNo||destination.currency} · Pocket หลัก`,amount,currency:from.currency,received,receivedCurrency:destination.currency,note:$('#transferNote').value.trim()||'โอนเงิน'};
  openTransferReview();
}

function updateBankTransferSource() {
  const select=$('#bankTransferFrom'); if(!select) return;
  const account=accountById(select.value)||state.accounts[0]; if(!account) return;
  $('#bankSourceName').textContent=account.name;
  $('#bankSourceBalance').textContent=`ยอดเงิน ${formatAmount(account.balance,account.currency,true)}`;
  $('#bankSourceFlag').className=`flag-mini ${flagClass(account)}`;
  $('.transfer-source-card')?.style.setProperty('--source-gradient',account.gradient);
  updateBankTransferDestinations();
}

function updateBankTransferDestinations() {
  const select=$('#bankTransferDestination'); if(!select) return;
  const previous=select.value; const sourceId=$('#bankTransferFrom')?.value;
  const accounts=state.accounts.filter(account=>account.id!==sourceId);
  const bankOptions=state.externalBanks.map(bank=>{const profile=bankProfile(bank.bankCode);return `<option value="bank:${esc(bank.id)}">${esc(bank.nickname||profile.name)} · ${esc(profile.code)}</option>`;}).join('');
  const favoriteOptions=(state.favorites||[]).map(item=>`<option value="favorite:${esc(item.id)}">★ ${esc(item.name)}</option>`).join('');
  select.innerHTML=`${favoriteOptions?`<optgroup label="รายการโปรด">${favoriteOptions}</optgroup>`:''}<optgroup label="ธนาคารภายนอก">${bankOptions}<option value="bank:new">โอนไปบัญชีธนาคารใหม่ · SCB</option></optgroup>${accounts.length?`<optgroup label="บัญชี Pocket หลัก">${accounts.map(account=>`<option value="account:${esc(account.id)}">${account.flag} ${esc(account.name)} · ${esc(account.currency)}</option>`).join('')}</optgroup>`:''}${state.goals.length?`<optgroup label="กล่องเป้าหมาย">${state.goals.map(goal=>`<option value="goal:${esc(goal.id)}">${esc(goal.icon||'◎')} ${esc(goal.name)} · THB</option>`).join('')}</optgroup>`:''}`;
  if([...select.options].some(option=>option.value===previous)) select.value=previous;
  else select.value=state.externalBanks[0]?`bank:${state.externalBanks[0].id}`:'bank:new';
  updateBankTransferDestination();
}

function bankTransferDestinationInfo() {
  const value=$('#bankTransferDestination')?.value||'bank:new'; const [type,id]=value.split(':');
  if(type==='favorite') return favoriteDestinationInfo(id);
  if(type==='account'){const entity=accountById(id);return {type,id,entity,currency:entity?.currency||'THB'};}
  if(type==='goal'){const entity=goalById(id);return {type,id,entity,currency:'THB'};}
  const saved=externalBankById(id); const profile=bankProfile(saved?.bankCode||'scb');
  return {type:'bank',id,entity:saved?{...saved,name:saved.nickname||profile.name,bankName:profile.name,code:profile.code,color:profile.color}:{name:'บัญชีธนาคารใหม่',bankName:profile.name,code:profile.code,color:profile.color,accountNo:''},currency:'THB'};
}

function updateBankTransferDestination() {
  const source=accountById($('#bankTransferFrom')?.value); const destination=bankTransferDestinationInfo();
  const external=destination.type==='bank'; const externalFields=$('#bankExternalFields');
  if(externalFields) externalFields.hidden=!external;
  $('#bankTransferLimit').hidden=!external;
  $('#confirmBankTransfer').textContent='ตรวจสอบข้อมูล';
  $('#bankDestinationMeta').textContent=external?(destination.entity?.bankName||'ธนาคารภายนอก'):destination.type==='goal'?'กล่องเป้าหมาย':'บัญชี Pocket หลัก';
  $('#bankDestinationName').textContent=destination.entity?.name||'เลือกปลายทาง';
  const iconElement=$('#bankDestinationIcon');
  if(iconElement){
    iconElement.innerHTML=external?esc(destination.entity?.code||'SCB'):destination.type==='goal'?esc(destination.entity?.icon||'◎'):flagHTML(destination.entity,true);
    iconElement.classList.toggle('has-flag',destination.type==='account');
    iconElement.style.setProperty('--destination-accent',external?(destination.entity?.color||'#e3d7ff'):destination.type==='goal'?(destination.entity?.color||'#7ee0cb'):'#fff');
  }
  if(external&&destination.entity?.accountNo) $('#bankAccountNumber').value=destination.entity.accountNo;
  $('#bankTransferCurrency').textContent=source?.currency||'THB';
  const amount=Number($('#bankTransferAmount')?.value)||0;
  const received=source?amount*rateOf(source.currency)/rateOf(destination.currency):0;
  $('#bankTransferConversion').textContent=external
    ? 'โอนออกเป็นเงินบาทไปยังบัญชีธนาคาร'
    : `ปลายทางจะได้รับประมาณ ${formatAmount(received,destination.currency,true)}`;
  validateBankTransfer();
}

function transferPickerOption(value, iconMarkup, title, subtitle, accent, selected, flag=false) {
  return `<button type="button" class="transfer-picker-option${selected?' selected':''}" data-transfer-picker-option="${esc(value)}">
    <span class="transfer-picker-option-icon${flag?' is-flag':''}" style="--picker-accent:${esc(accent)}">${iconMarkup}</span>
    <span class="transfer-picker-option-copy"><b>${esc(title)}</b><small>${esc(subtitle)}</small></span>
    <span class="transfer-picker-option-check">${selected?icon('check'):''}</span>
  </button>`;
}

function openTransferPicker(type) {
  const picker=$('#transferPickerSheet'); const options=$('#transferPickerOptions');
  if(!picker||!options) return;
  transferPickerType=type;
  const sourceId=$('#bankTransferFrom')?.value; const selectedValue=type==='source'?sourceId:$('#bankTransferDestination')?.value;
  $('#transferPickerTitle').textContent=type==='source'?'เลือก Pocket ต้นทาง':'เลือกปลายทาง';
  const groups=[];
  if(type==='source'){
    groups.push(`<section class="transfer-picker-group"><p>บัญชี Pocket ของฉัน</p>${state.accounts.map(account=>transferPickerOption(account.id,flagHTML(account,true),account.name,`ยอดเงิน ${formatAmount(account.balance,account.currency,true)}`,'#fff',selectedValue===account.id,true)).join('')}</section>`);
  }else{
    if((state.favorites||[]).length) groups.push(`<section class="transfer-picker-group"><p>รายการโปรด</p>${state.favorites.map(item=>transferPickerOption(`favorite:${item.id}`,icon('star'),item.name,item.meta||'ปลายทางที่บันทึกไว้','#dff9e8',selectedValue===`favorite:${item.id}`)).join('')}</section>`);
    const savedBanks=state.externalBanks.map(bank=>{const profile=bankProfile(bank.bankCode);return transferPickerOption(`bank:${bank.id}`,bankBadgeHTML(bank,'bank-picker-logo'),bank.nickname||profile.name,`${profile.name} · •••• ${String(bank.accountNo||'').slice(-4)}`,profile.color,selectedValue===`bank:${bank.id}`);}).join('');
    groups.push(`<section class="transfer-picker-group"><p>ธนาคารภายนอก</p>${savedBanks}${transferPickerOption('bank:new','SCB','บัญชีธนาคารใหม่','กรอกเลขบัญชีเพื่อโอน','#e3d7ff',selectedValue==='bank:new')}</section>`);
    const accounts=state.accounts.filter(account=>account.id!==sourceId);
    if(accounts.length) groups.push(`<section class="transfer-picker-group"><p>บัญชี Pocket หลัก</p>${accounts.map(account=>transferPickerOption(`account:${account.id}`,flagHTML(account,true),account.name,`ยอดเงิน ${formatAmount(account.balance,account.currency,true)}`,'#fff',selectedValue===`account:${account.id}`,true)).join('')}</section>`);
    if(state.goals.length) groups.push(`<section class="transfer-picker-group"><p>กล่องเป้าหมาย</p>${state.goals.map(goal=>transferPickerOption(`goal:${goal.id}`,esc(goal.icon||'◎'),goal.name,`${formatAmount(goal.balance,'THB',true)} จากเป้าหมาย ${formatAmount(goal.target,'THB',true)}`,goal.color||'#7ee0cb',selectedValue===`goal:${goal.id}`)).join('')}</section>`);
  }
  options.innerHTML=groups.join('');
  picker.classList.add('open'); picker.setAttribute('aria-hidden','false');
}

function closeTransferPicker() {
  const picker=$('#transferPickerSheet'); if(!picker) return;
  picker.classList.remove('open'); picker.setAttribute('aria-hidden','true'); transferPickerType='';
}

function chooseTransferPicker(value) {
  if(transferPickerType==='source'){
    $('#bankTransferFrom').value=value; updateBankTransferSource();
  }else if(transferPickerType==='destination'){
    $('#bankTransferDestination').value=value;
    const destination=bankTransferDestinationInfo();
    if(destination.type==='bank') $('#bankAccountNumber').value=destination.entity?.accountNo||'';
    updateBankTransferDestination();
  }
  closeTransferPicker();
}

function switchBankTab(tab) {
  $$('[data-bank-tab]').forEach(button=>button.classList.toggle('active',button.dataset.bankTab===tab));
  $$('[data-bank-pane]').forEach(pane=>pane.classList.toggle('active',pane.dataset.bankPane===tab));
}

function validateBankTransfer(showError=false) {
  const account=accountById($('#bankTransferFrom')?.value); const destination=bankTransferDestinationInfo(); const number=$('#bankAccountNumber')?.value.replace(/\D/g,'')||''; const amount=Number($('#bankTransferAmount')?.value)||0; let error='';
  if(!account) error='กรุณาเลือก Pocket ต้นทาง';
  else if(!destination.entity) error='กรุณาเลือกบัญชีหรือกล่องปลายทาง';
  else if(destination.type==='account'&&destination.id===account.id) error='กรุณาเลือกคนละบัญชี';
  else if(destination.type==='bank'&&account.currency!=='THB') error='บัญชีธนาคารภายนอกรับโอนจาก Pocket สกุล THB เท่านั้น';
  else if(destination.type==='bank'&&number.length<10) error='กรุณากรอกเลขบัญชีให้ครบอย่างน้อย 10 หลัก';
  else if(amount<=0) error='กรุณาใส่จำนวนเงิน';
  else if(destination.type==='bank'&&amount>200000) error='เกินวงเงินโอนคงเหลือวันนี้';
  else if(amount>account.balance) error='ยอดเงินใน Pocket ไม่เพียงพอ';
  $('#confirmBankTransfer').disabled=Boolean(error);
  if(showError) $('#bankTransferError').textContent=error;
  else if(!error) $('#bankTransferError').textContent='';
  return !error;
}

function handleBankTransfer(event) {
  event.preventDefault(); if(!validateBankTransfer(true)) return;
  const account=accountById($('#bankTransferFrom').value); const destination=bankTransferDestinationInfo(); const amount=Number($('#bankTransferAmount').value); const number=$('#bankAccountNumber').value.replace(/\D/g,'');
  const received=Number((amount*rateOf(account.currency)/rateOf(destination.currency)).toFixed(2));
  const external=destination.type==='bank'; const accountNo=external?(destination.entity?.accountNo||number):destination.entity?.accountNo||'';
  pendingTransfer={kind:'bank',originSheet:'#transferSheet',sourceId:account.id,sourceName:account.name,sourceMeta:`${account.accountNo} · ยอดเงิน ${formatAmount(account.balance,account.currency,true)}`,destinationType:destination.type,destinationId:destination.id,destinationName:destination.entity?.name||destination.entity?.bankName||'ธนาคารภายนอก',destinationMeta:external?`${destination.entity?.bankName||'ธนาคารภายนอก'} · •••• ${accountNo.slice(-4)}`:destination.type==='goal'?'กล่องเป้าหมาย':`${destination.entity?.accountNo||destination.currency} · Pocket หลัก`,amount,currency:account.currency,received,receivedCurrency:destination.currency,note:`โอนไป ${destination.entity?.name||'ปลายทาง'}`,accountNo,bankCode:destination.entity?.bankCode||destination.favorite?.bankCode||'scb'};
  openTransferReview();
}

function switchOpenSheet(fromSelector,toSelector) {
  const from=$(fromSelector); const to=$(toSelector); if(from){from.classList.remove('open');from.setAttribute('aria-hidden','true');}
  if(to){to.classList.add('open');to.setAttribute('aria-hidden','false');document.body.style.overflow='hidden';}
}

function openTransferReview() {
  if(!pendingTransfer) return;
  const transfer=pendingTransfer;
  $('#reviewAmount').textContent=formatAmount(transfer.amount,transfer.currency,true);
  $('#reviewFrom').textContent=transfer.sourceName; $('#reviewFromMeta').textContent=transfer.sourceMeta;
  $('#reviewTo').textContent=transfer.destinationName; $('#reviewToMeta').textContent=transfer.destinationMeta;
  $('#reviewDate').textContent=formatTime();
  const note=$('#reviewNote'); note.textContent=transfer.receivedCurrency!==transfer.currency?`ปลายทางจะได้รับประมาณ ${formatAmount(transfer.received,transfer.receivedCurrency,true)}`:transfer.note; note.hidden=!note.textContent;
  switchOpenSheet(transfer.originSheet,'#transferReviewSheet');
}

function returnToTransferEdit() {
  if(!pendingTransfer) return; switchOpenSheet('#transferReviewSheet',pendingTransfer.originSheet);
}

function updateTransferPinDots() {
  $$('#transferPinDots i').forEach((dot,index)=>dot.classList.toggle('filled',index<transferPinDigits.length));
}

function resetTransferPin(message='') {
  transferPinVerificationToken+=1;
  transferPinVerifying=false;
  transferPinDigits='';
  updateTransferPinDots();
  const error=$('#transferPinError');
  if(error) error.textContent=message;
}

function openTransferPinVerification() {
  const transfer=pendingTransfer; if(!transfer) return;
  protectedPinAction='transfer';
  resetTransferPin();
  $('#transferPinTitle').textContent='ยืนยันด้วย PIN';
  $('#transferPinHeading').textContent='ใส่รหัส PIN';
  $('#transferPinMessage').textContent='กรอกรหัส PIN 6 หลักเพื่อยืนยันการโอน';
  $('#transferPinAmount').textContent=formatAmount(transfer.amount,transfer.currency,true);
  $('#transferPinDestination').textContent=`ไปยัง ${transfer.destinationName}`;
  switchOpenSheet('#transferReviewSheet','#transferPinSheet');
}

function returnToTransferReview() {
  if(protectedPinAction==='clear-balances'){protectedPinAction='transfer';closeSheets();return;}
  resetTransferPin();
  switchOpenSheet('#transferPinSheet','#transferReviewSheet');
}

async function verifyTransferPin() {
  if(transferPinDigits.length!==6||transferPinVerifying) return;
  transferPinVerifying=true;
  const verificationToken=++transferPinVerificationToken;
  const entered=transferPinDigits;
  transferPinDigits=''; updateTransferPinDots(); $('#transferPinError').textContent='กำลังตรวจสอบรหัส…';
  const storedHash=localStorage.getItem(PIN_HASH_KEY);
  const correct=storedHash&&(await hashPin(entered))===storedHash;
  if(verificationToken!==transferPinVerificationToken||!$('#transferPinSheet').classList.contains('open')) return;
  if(correct){if(protectedPinAction==='clear-balances'){performClearAllBalances();return;}executePendingTransfer();return;}
  resetTransferPin(storedHash?'รหัส PIN ไม่ถูกต้อง กรุณาลองอีกครั้ง':'ยังไม่ได้ตั้งรหัส PIN สำหรับยืนยันรายการ');
  const dots=$('#transferPinDots'); dots.classList.remove('shake'); void dots.offsetWidth; dots.classList.add('shake');
}

function executePendingTransfer() {
  const transfer=pendingTransfer; if(!transfer) return;
  const source=accountById(transfer.sourceId); if(!source||transfer.amount>source.balance){resetTransferPin('ยอดเงินต้นทางเปลี่ยนแปลง กรุณากลับไปตรวจสอบอีกครั้ง');return;}
  const completedAt=new Date(); const transactionId=crypto.randomUUID();
  source.balance=Number((source.balance-transfer.amount).toFixed(2));
  if(transfer.destinationType==='bank'){
    state.transactions.push({id:transactionId,type:'expense',account:source.id,amount:transfer.amount,currency:source.currency,note:`โอนไป ${transfer.destinationName} ••••${String(transfer.accountNo||'').slice(-4)}`,date:completedAt.toISOString()});
  }else{
    const destination=transfer.destinationType==='goal'?goalById(transfer.destinationId):accountById(transfer.destinationId);
    if(!destination){source.balance=Number((source.balance+transfer.amount).toFixed(2));resetTransferPin('ไม่พบปลายทาง กรุณากลับไปเลือกใหม่');return;}
    destination.balance=Number((destination.balance+transfer.received).toFixed(2));
    state.transactions.push({id:transactionId,type:'transfer',from:source.id,toType:transfer.destinationType,to:transfer.destinationId,amount:transfer.amount,currency:transfer.currency,received:transfer.received,receivedCurrency:transfer.receivedCurrency,note:transfer.note,date:completedAt.toISOString()});
  }
  completedTransfer={...transfer,completedAt:completedAt.toISOString(),reference:`MP${completedAt.getFullYear()}${String(completedAt.getMonth()+1).padStart(2,'0')}${String(completedAt.getDate()).padStart(2,'0')}${String(Date.now()).slice(-8)}`};
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); renderAll(); renderTransferSlip(); resetTransferPin(); switchOpenSheet('#transferPinSheet','#transferSuccessSheet');
}

function renderTransferSlip() {
  if(!completedTransfer) return; const transfer=completedTransfer;
  $('#slipAmount').textContent=formatAmount(transfer.amount,transfer.currency,true); $('#slipFrom').textContent=transfer.sourceName; $('#slipTo').textContent=transfer.destinationName; $('#slipDate').textContent=formatTime(transfer.completedAt); $('#slipReference').textContent=transfer.reference;
  const favorite=matchingFavorite(transfer); const button=$('#saveTransferFavorite'); button.classList.toggle('active',Boolean(favorite)); button.querySelector('span').textContent=favorite?'บันทึกในรายการโปรดแล้ว':'เพิ่มเป็นรายการโปรด';
}

function toggleCompletedFavorite() {
  const transfer=completedTransfer; if(!transfer) return; const current=matchingFavorite(transfer);
  if(current){state.favorites=state.favorites.filter(item=>item.id!==current.id);}
  else state.favorites.push({id:`favorite-${Date.now()}`,identity:favoriteIdentity(transfer),destinationType:transfer.destinationType,targetId:transfer.destinationId,name:transfer.destinationName,meta:transfer.destinationMeta,accountNo:transfer.accountNo||'',bankCode:transfer.bankCode||'',currency:transfer.receivedCurrency||transfer.currency,createdAt:new Date().toISOString()});
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); renderFavoriteTransfers(); fillSelects(); renderTransferSlip(); notify(current?'นำออกจากรายการโปรดแล้ว':'เพิ่มเป็นรายการโปรดแล้ว');
}

function finishTransferToHome() {
  closeSheets(); pendingTransfer=null; completedTransfer=null; navigate('home');
}

function closeBankPicker() {
  const picker=$('#bankPickerSheet'); picker.classList.remove('open'); picker.setAttribute('aria-hidden','true');
}

function openScheduleEditor() {
  if(!state.accounts.length&&!state.goals.length){notify('กรุณาสร้าง Pocket หรือกล่องเป้าหมายก่อน');navigate('accounts');return;}
  renderSchedules(); const next=new Date(Date.now()+5*60*1000); const local=new Date(next.getTime()-next.getTimezoneOffset()*60000);
  $('#scheduleDate').value=local.toISOString().slice(0,10); $('#scheduleTime').value=local.toISOString().slice(11,16); $('#scheduleAmount').value=''; $('#scheduleError').textContent=''; updateScheduleDestination(); showSheet('#scheduleSheet');
}

function handleScheduleSubmit(event) {
  event.preventDefault(); const destination=getScheduleDestination($('#scheduleDestination').value); const amount=Number($('#scheduleAmount').value); const runAt=new Date(`${$('#scheduleDate').value}T${$('#scheduleTime').value}`); let error='';
  if(!destination.entity) error='กรุณาเลือกกล่องปลายทาง'; else if(!amount||amount<=0) error='กรุณาใส่จำนวนเงิน'; else if(Number.isNaN(runAt.getTime())||runAt<=new Date()) error='กรุณาเลือกเวลาในอนาคต';
  $('#scheduleError').textContent=error; if(error) return;
  state.scheduledDeposits.push({id:crypto.randomUUID(),destinationType:destination.type,destinationId:destination.id,currency:destination.currency,amount:Number(amount.toFixed(2)),runAt:runAt.toISOString(),status:'pending',createdAt:new Date().toISOString()});
  closeSheets(); saveState(`ตั้งฝากเข้า “${destination.entity.name}” แล้ว`); requestSystemNotifications(false);
}

function deleteSchedule(id) {
  const item=state.scheduledDeposits.find(schedule=>schedule.id===id); if(!item) return;
  if(!confirm('ลบรายการฝากอัตโนมัตินี้หรือไม่?')) return;
  state.scheduledDeposits=state.scheduledDeposits.filter(schedule=>schedule.id!==id); saveState('ลบรายการตั้งเวลาแล้ว');
}

async function requestSystemNotifications(showFeedback=true) {
  if(!('Notification' in window)){if(showFeedback)notify('เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน');return false;}
  let permission=Notification.permission;
  if(permission==='default') permission=await Notification.requestPermission();
  state.settings.systemNotifications=permission==='granted'; localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); renderProfileAndSettings();
  if(showFeedback) notify(permission==='granted'?'เปิดการแจ้งเตือนของโทรศัพท์แล้ว':'ยังไม่ได้รับอนุญาตการแจ้งเตือน');
  return permission==='granted';
}

async function sendSystemNotification(title,body) {
  if(!state.settings.systemNotifications||!('Notification' in window)||Notification.permission!=='granted') return;
  try {
    if('serviceWorker' in navigator){const registration=await navigator.serviceWorker.ready;registration.active?.postMessage({type:'POCKET_NOTIFICATION',title,body});}
    else new Notification(title,{body});
  } catch { /* การแจ้งเตือนเป็นความสามารถเสริม */ }
}

function formatDepositAmount(amount,currency) {
  const value=new Intl.NumberFormat('th-TH',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(amount)||0);
  return `${value} ${currency==='THB'?'บาท':currency}`;
}

function destinationReference(destination) {
  if(destination.type==='account') return String(destination.entity?.accountNo||destination.id||'').replace(/\D/g,'')||String(destination.id||'');
  const source=String(destination.id||'goal'); let hash=0;
  for(const character of source) hash=((hash*31)+character.charCodeAt(0))>>>0;
  return String(7000000000+(hash%1000000000));
}

function depositTimestamp(value=new Date()) {
  const date=new Date(value);
  const day=new Intl.DateTimeFormat('th-TH',{day:'numeric',month:'short',year:'2-digit'}).format(date);
  const time=new Intl.DateTimeFormat('th-TH',{hour:'2-digit',minute:'2-digit',hour12:false}).format(date);
  return {day,time};
}

function showDepositPopup(payload) {
  depositPopupQueue.push(payload); if(depositPopupActive) return; showNextDepositPopup();
}

function showNextDepositPopup() {
  const payload=depositPopupQueue.shift(); if(!payload){depositPopupActive=false;return;}
  depositPopupActive=true; const popup=$('#depositPopup');
  popup.classList.toggle('failed',!payload.success); $('#depositPopupTitle').textContent=payload.success?'รายการเงินเข้าอัตโนมัติสำเร็จ':'ฝากเงินอัตโนมัติไม่สำเร็จ';
  $('#depositPopupAmount').textContent=payload.amountText||'ไม่สามารถทำรายการได้'; $('#depositPopupDetail').textContent=payload.detail;
  popup.classList.add('show'); clearTimeout(depositPopupTimer); depositPopupTimer=setTimeout(hideDepositPopup,5200);
}

function hideDepositPopup() {
  const popup=$('#depositPopup'); popup.classList.remove('show'); clearTimeout(depositPopupTimer);
  setTimeout(()=>{depositPopupActive=false;showNextDepositPopup();},260);
}

function processScheduledDeposits() {
  const due=(state.scheduledDeposits||[]).filter(item=>item.status==='pending'&&new Date(item.runAt)<=new Date()); if(!due.length) return;
  due.forEach(item=>{const destination=getScheduleDestination(item);const completedAt=new Date();const when=depositTimestamp(completedAt);if(!destination.entity){item.status='failed';item.completedAt=completedAt.toISOString();showDepositPopup({success:false,detail:'ไม่พบ Pocket หรือกล่องปลายทางที่เลือกไว้'});sendSystemNotification('รายการเงินเข้าไม่สำเร็จ',`ไม่พบปลายทาง เมื่อ ${when.day} เวลา ${when.time} น.`);return;}const currency=item.currency||destination.currency;const amountText=formatDepositAmount(item.amount,currency);const reference=destinationReference(destination);const targetWord=destination.type==='goal'?'กล่อง':'บัญชี';destination.entity.balance=Number((destination.entity.balance+item.amount).toFixed(2));item.status='done';item.completedAt=completedAt.toISOString();const accountId=destination.type==='goal'?`goal:${destination.id}`:destination.id;state.transactions.push({id:crypto.randomUUID(),type:'income',account:accountId,amount:item.amount,currency,note:'ฝากเงินอัตโนมัติ',date:completedAt.toISOString()});const detail=`เข้า ${destination.entity.name} · ${targetWord} ${reference} · ${when.time} น.`;showDepositPopup({success:true,amountText,detail});sendSystemNotification('รายการเงินเข้า',`${amountText} เข้า${targetWord} ${reference} เมื่อ ${when.day} เวลา ${when.time} น.`);});
  state.scheduledDeposits=(state.scheduledDeposits||[]).filter(item=>item.status!=='done');
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); renderAll();
}

function openEntry(type='income', accountId='thb') {
  entryType=type; fillSelects(); if(accountById(accountId)) $('#entryAccount').value=accountId;
  $('#entryAmount').value=''; $('#entryNote').value=''; updateEntryType(); updateEntryCurrency(); showSheet('#entrySheet');
}
function updateEntryType(){ $$('[data-entry-type]').forEach(button=>button.classList.toggle('active',button.dataset.entryType===entryType)); $('#entryTitle').textContent=entryType==='income'?'บันทึกเงินเข้า':'บันทึกรายจ่าย'; }
function updateEntryCurrency(){ const account=accountById($('#entryAccount').value); $('#entryCurrency').textContent=account?.currency||'THB'; }

function handleEntrySubmit(event) {
  event.preventDefault(); const account=accountById($('#entryAccount').value); const amount=Number($('#entryAmount').value); let error='';
  if(!account) error='ไม่พบบัญชี'; else if(!amount||amount<=0) error='กรุณาใส่จำนวนเงิน'; else if(entryType==='expense'&&amount>account.balance) error='ยอดเงินไม่เพียงพอ';
  $('#entryError').textContent=error; if(error) return;
  account.balance=Number((account.balance+(entryType==='income'?amount:-amount)).toFixed(2));
  state.transactions.push({id:crypto.randomUUID(),type:entryType,account:account.id,amount,currency:account.currency,note:$('#entryNote').value.trim()||(entryType==='income'?'เงินเข้า':'รายจ่าย'),date:new Date().toISOString()});
  closeSheets(); saveState(entryType==='income'?'บันทึกเงินเข้าแล้ว':'บันทึกรายจ่ายแล้ว');
}

function handleGoalSubmit(event) {
  event.preventDefault(); const name=$('#goalName').value.trim(); const target=Number($('#goalTarget').value); if(!name||!target||target<=0) return;
  state.goals.push({id:`goal-${Date.now()}`,name,balance:0,target,color:$('#goalColor').value,icon:'◇'}); event.target.reset(); updateColorValue('goal'); closeSheets(); saveState(`สร้างกล่อง “${name}” แล้ว`);
}

function handleAccountSubmit(event) {
  event.preventDefault();
  const name=$('#accountName').value.trim(); const currency=$('#accountCurrency').value; const balance=Number($('#accountBalance').value)||0; const color=$('#accountColor').value;
  if(!name || !['THB','USD'].includes(currency) || balance<0) return;
  const suffix=String(Date.now()).slice(-7);
  state.accounts.push({id:`account-${Date.now()}`,currency,flag:currency==='THB'?'🇹🇭':'🇺🇸',badge:currency==='THB'?'฿':'$',badgeColor:color,name,accountNo:`${currency==='THB'?'206':'957'}-${suffix}`,balance:Number(balance.toFixed(2)),gradient:accountGradient(color),tag:mixHex(color,'#ffffff',.78),country:currency==='THB'?'ประเทศไทย':'สหรัฐอเมริกา',rateText:currency==='THB'?'บัญชีสกุลเงินบาท':'บัญชีสกุลเงินดอลลาร์สหรัฐ'});
  event.target.reset(); updateAccountCurrencyLabel(); updateColorValue('account'); closeSheets(); saveState(`สร้าง “${name}” แล้ว`);
}

function handleExternalBankSubmit(event) {
  event.preventDefault();
  const bankCode=$('#externalBankCode').value; const profile=bankProfile(bankCode); const accountNo=$('#externalBankAccountNumber').value.replace(/\D/g,'').slice(0,13); const nickname=$('#externalBankNickname').value.trim()||profile.name; let error='';
  if(!BANK_CATALOG[bankCode]) error='กรุณาเลือกธนาคาร';
  else if(accountNo.length<10) error='กรุณากรอกเลขบัญชี 10–13 หลัก';
  else if(state.externalBanks.some(bank=>bank.accountNo===accountNo&&bank.bankCode===bankCode)) error='มีบัญชีธนาคารนี้อยู่แล้ว';
  $('#externalBankError').textContent=error; if(error) return;
  state.externalBanks.push({id:`bank-${Date.now()}`,bankCode,accountNo,nickname:nickname.slice(0,30)});
  event.target.reset(); closeSheets(); saveState(`เพิ่ม “${nickname}” แล้ว`);
}

function deleteExternalBank(id) {
  const bank=externalBankById(id); if(!bank) return; const profile=bankProfile(bank.bankCode);
  if(!confirm(`ลบ “${bank.nickname||profile.name}” หรือไม่?`)) return;
  state.externalBanks=state.externalBanks.filter(item=>item.id!==id); saveState(`ลบ “${bank.nickname||profile.name}” แล้ว`);
}

function moveAccount(id,direction) {
  const index=state.accounts.findIndex(account=>account.id===id); const next=index+Number(direction); if(index<0||next<0||next>=state.accounts.length)return;
  [state.accounts[index],state.accounts[next]]=[state.accounts[next],state.accounts[index]]; selectedAccountId=state.accounts.find(account=>account.id===selectedAccountId)?.id||state.accounts[0]?.id; saveState('จัดลำดับ Pocket แล้ว');
}

function updateAccountColorPreview() {
  const color=$('#accountEditColor').value;
  $('#accountEditColorValue').textContent=color.toUpperCase();
  $('#accountColorPreview').style.background=accountGradient(color);
}

function openAccountColorEditor(id) {
  const account=accountById(id); if(!account) return;
  editingAccountColorId=id;
  const color=/^#[0-9a-f]{6}$/i.test(account.badgeColor||'')?account.badgeColor:'#58f38e';
  $('#accountEditColor').value=color;
  $('#accountColorPreviewFlag').innerHTML=flagHTML(account,true);
  $('#accountColorPreviewName').textContent=account.name;
  updateAccountColorPreview();
  showSheet('#accountColorSheet');
}

function handleAccountColorEdit(event) {
  event.preventDefault();
  const account=accountById(editingAccountColorId); if(!account) return;
  const color=$('#accountEditColor').value;
  account.badgeColor=color;
  account.gradient=accountGradient(color);
  account.tag=mixHex(color,'#ffffff',.78);
  closeSheets(); saveState(`เปลี่ยนสี “${account.name}” แล้ว`);
}

function openCardEditor() {
  $('#debitTitleInput').value=state.debitCard.title; $('#debitHolderInput').value=state.debitCard.holder; $('#debitNumberInput').value=String(state.debitCard.number).replace(/(\d{4})(?=\d)/g,'$1 '); $('#debitColor').value=state.debitCard.color; updateColorValue('debit'); $('#cardEditError').textContent=''; showSheet('#cardEditSheet');
}

function handleCardEdit(event) {
  event.preventDefault(); const title=$('#debitTitleInput').value.trim(); const holder=$('#debitHolderInput').value.trim(); const number=$('#debitNumberInput').value.replace(/\D/g,'').slice(0,16); let error='';
  if(!title||!holder)error='กรุณากรอกชื่อบัตรและชื่อบนบัตร'; else if(number.length!==16)error='เลขบัตรต้องมี 16 หลัก'; $('#cardEditError').textContent=error; if(error)return;
  state.debitCard={title,holder,number,color:$('#debitColor').value}; closeSheets(); saveState('บันทึกข้อมูลบัตรแล้ว');
}

function deleteGoal(id) {
  const goal=goalById(id); if(!goal) return;
  const refund=goal.balance>0?` เงิน ${formatAmount(goal.balance,'THB',true)} จะคืนเข้า Pocket Save`:'';
  if(!confirm(`ลบกล่อง “${goal.name}” หรือไม่?${refund}`)) return;
  const thb=state.accounts.find(account=>account.currency==='THB');
  if(goal.balance>0 && thb){thb.balance=Number((thb.balance+goal.balance).toFixed(2));state.transactions.push({id:crypto.randomUUID(),type:'income',account:thb.id,amount:goal.balance,currency:'THB',note:`คืนเงินจากกล่อง ${goal.name}`,date:new Date().toISOString()});}
  state.goals=state.goals.filter(item=>item.id!==id); saveState(`ลบกล่อง “${goal.name}” แล้ว`);
}

function updateColorValue(type) {
  const input=$(`#${type}Color`); const label=$(`#${type}ColorValue`); if(input&&label) label.textContent=input.value.toUpperCase();
}

function updateAccountCurrencyLabel(){ $('#accountCurrencyLabel').textContent=$('#accountCurrency').value; }

function handleSetting(key) { state.settings[key]=!state.settings[key]; saveState(); }

function requestClearAllBalances() {
  const hasBalance=state.accounts.some(account=>Number(account.balance)>0)||state.goals.some(goal=>Number(goal.balance)>0);
  if(!hasBalance){notify('ยอดเงินทุกบัญชีเป็น 0 อยู่แล้ว');return;}
  if(!confirm('ล้างยอดเงินของทุก Pocket และทุกกล่องเป้าหมายเป็น 0 หรือไม่?\n\nประวัติรายการจะยังคงอยู่ และการดำเนินการนี้ย้อนกลับไม่ได้')) return;
  protectedPinAction='clear-balances';
  resetTransferPin();
  $('#transferPinTitle').textContent='ยืนยันการล้างยอด';
  $('#transferPinHeading').textContent='ใส่รหัส PIN เพื่อดำเนินการ';
  $('#transferPinMessage').textContent='ขั้นตอนนี้ป้องกันการเผลอล้างยอดเงินทั้งหมด';
  $('#transferPinAmount').textContent='ล้างยอดทุก Pocket';
  $('#transferPinDestination').textContent='ประวัติรายการเดิมจะยังคงอยู่';
  showSheet('#transferPinSheet');
}

function performClearAllBalances() {
  state.accounts.forEach(account=>{account.balance=0;});
  state.goals.forEach(goal=>{goal.balance=0;});
  protectedPinAction='transfer';
  closeSheets();
  saveState('ล้างยอดเงินทั้งหมดแล้ว');
}

function notify(message) { const toast=$('#toast'); toast.textContent=message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('show'),2400); }

document.addEventListener('click', event => {
  const favoriteTransferButton=event.target.closest('[data-favorite-transfer]'); if(favoriteTransferButton){const favorite=favoriteById(favoriteTransferButton.dataset.favoriteTransfer);if(favorite){switchBankTab('account');$('#bankTransferDestination').value=`favorite:${favorite.id}`;const info=bankTransferDestinationInfo();if(info.type==='bank')$('#bankAccountNumber').value=info.entity?.accountNo||'';updateBankTransferDestination();}return;}
  if(event.target.closest('[data-close-deposit-popup]')){hideDepositPopup();return;}
  const transferPickerOptionButton=event.target.closest('[data-transfer-picker-option]'); if(transferPickerOptionButton){chooseTransferPicker(transferPickerOptionButton.dataset.transferPickerOption);return;}
  const transferPickerButton=event.target.closest('[data-transfer-picker]'); if(transferPickerButton){openTransferPicker(transferPickerButton.dataset.transferPicker);return;}
  if(event.target.closest('[data-close-transfer-picker]')){closeTransferPicker();return;}
  const goalColorButton=event.target.closest('[data-goal-color]'); if(goalColorButton){$('#goalColor').value=goalColorButton.dataset.goalColor;updateColorValue('goal');return;}
  const accountColorButton=event.target.closest('[data-account-color]'); if(accountColorButton){$('#accountColor').value=accountColorButton.dataset.accountColor;updateColorValue('account');return;}
  const accountEditColorButton=event.target.closest('[data-account-edit-color]'); if(accountEditColorButton){$('#accountEditColor').value=accountEditColorButton.dataset.accountEditColor;updateAccountColorPreview();return;}
  const debitColorButton=event.target.closest('[data-debit-color]'); if(debitColorButton){$('#debitColor').value=debitColorButton.dataset.debitColor;updateColorValue('debit');return;}
  const deleteGoalButton=event.target.closest('[data-delete-goal]'); if(deleteGoalButton){deleteGoal(deleteGoalButton.dataset.deleteGoal);return;}
  const deleteExternalBankButton=event.target.closest('[data-delete-external-bank]'); if(deleteExternalBankButton){deleteExternalBank(deleteExternalBankButton.dataset.deleteExternalBank);return;}
  const deleteScheduleButton=event.target.closest('[data-delete-schedule]'); if(deleteScheduleButton){deleteSchedule(deleteScheduleButton.dataset.deleteSchedule);return;}
  const bankTab=event.target.closest('[data-bank-tab]')?.dataset.bankTab; if(bankTab){switchBankTab(bankTab);return;}
  const bankOption=event.target.closest('[data-select-bank]'); if(bankOption){closeBankPicker();notify('เลือกธนาคารไทยพาณิชย์แล้ว');return;}
  if(event.target.closest('[data-close-bank]')){closeBankPicker();return;}
  const moveButton=event.target.closest('[data-move-account]'); if(moveButton){moveAccount(moveButton.dataset.moveAccount,moveButton.dataset.direction);return;}
  const editAccountColorButton=event.target.closest('[data-edit-account-color]'); if(editAccountColorButton){openAccountColorEditor(editAccountColorButton.dataset.editAccountColor);return;}
  const account=event.target.closest('[data-account]')?.dataset.account; if(account) openDetail(account);
  const goal=event.target.closest('[data-goal-open]')?.dataset.goalOpen; if(goal) openTransfer('thb',`goal:${goal}`);
  const planButton=event.target.closest('[data-select-plan]'); if(planButton){openPay(planButton.dataset.selectPlan);return;}
  if(event.target.closest('[data-pay-detail]')){$('#paySum').classList.toggle('open');return;}
  if(event.target.closest('[data-pay-back]')){navigate('plans');return;}
  if(event.target.closest('#payGo')){openQR();return;}
  if(event.target.closest('[data-qr-renew]')){openQR();return;}
  if(event.target.closest('[data-qr-close]')||event.target===$('#qrSheet')){closeQR();return;}
  const planGroupButton=event.target.closest('[data-plan-group]'); if(planGroupButton){setPlanGroup(planGroupButton.dataset.planGroup);return;}
  const seatButton=event.target.closest('[data-seat-plan]'); if(seatButton){const plan=planById(seatButton.dataset.seatPlan);const current=planSeats[plan.id]??plan.minSeats;planSeats[plan.id]=Math.min(99,Math.max(plan.minSeats,current+Number(seatButton.dataset.seatStep)));renderPlans();return;}
  const moreButton=event.target.closest('[data-plan-more]'); if(moreButton){togglePlanDetails(moreButton.dataset.planMore);return;}
  const learnButton=event.target.closest('[data-plan-learn]'); if(learnButton){togglePlanDetails(learnButton.dataset.planLearn,true);$(`[data-plan-card="${learnButton.dataset.planLearn}"] .plan-limits`)?.scrollIntoView({behavior:'smooth',block:'start',inline:'nearest'});return;}
  const contactPlan=event.target.closest('[data-contact-plan]'); if(contactPlan){notify('ทัก DM มาคุยรายละเอียดได้เลย');return;}
  const planJump=event.target.closest('[data-plan-jump]'); if(planJump){jumpToPlan(planJump.dataset.planJump);return;}
  const nav=event.target.closest('[data-nav]')?.dataset.nav; if(nav) navigate(nav);
  const filter=event.target.closest('[data-filter]')?.dataset.filter; if(filter){transactionFilter=filter;$$('[data-filter]').forEach(button=>button.classList.toggle('active',button.dataset.filter===filter));renderTransactions();updateBalanceVisibility();}
  const entry=event.target.closest('[data-entry-type]')?.dataset.entryType; if(entry){entryType=entry;updateEntryType();}
  const setting=event.target.closest('[data-setting]')?.dataset.setting; if(setting) handleSetting(setting);
  if(event.target.closest('[data-close]')) closeSheets();
  const actionButton=event.target.closest('[data-action]'); const action=actionButton?.dataset.action; const source=actionButton?.dataset.accountSource||(activeView==='accountDetail'?selectedAccountId:'thb');
  if(action==='transfer') openTransfer(source||'thb');
  if(action==='exchange') openTransfer('thb','account:usd');
  if(action==='exchange-in') openTransfer('thb',`account:${source}`);
  if(action==='exchange-out') openTransfer(source,'account:thb');
  if(action==='income'||action==='expense') openEntry(action,source||'thb');
  if(action==='add-goal') showSheet('#goalSheet');
  if(action==='add-account') showSheet('#accountSheet');
  if(action==='add-external-bank') showSheet('#externalBankSheet');
  if(action==='add-schedule') openScheduleEditor();
  if(action==='enable-system-notifications') requestSystemNotifications();
  if(action==='choose-bank') showSheet('#bankPickerSheet');
  if(action==='toggle-reorder'){reorderMode=!reorderMode;renderAccounts();updateBalanceVisibility();}
  if(action==='open-card') openDebitCard();
  if(action==='edit-card') openCardEditor();
  if(action==='scan') notify('โหมดสแกนเป็นตัวอย่าง ยังไม่เชื่อมธนาคาร');
});

$('#detailBack').addEventListener('click',()=>navigate(detailReturnView));
$('#cardBack').addEventListener('click',()=>navigate('home'));
$('#transferFrom').addEventListener('change',()=>{ensureDifferentDestination();updateTransferPreview();});
$('#transferTo').addEventListener('change',()=>{ensureDifferentDestination();updateTransferPreview();});
$('#transferAmount').addEventListener('input',updateTransferPreview);
$('#swapRoute').addEventListener('click',()=>{const destination=destinationInfo();if(destination.type!=='account'){notify('กล่องเป้าหมายใช้เป็นต้นทางไม่ได้');return;}const old=$('#transferFrom').value;$('#transferFrom').value=destination.id;$('#transferTo').value=`account:${old}`;updateTransferPreview();});
$('#confirmTransfer').addEventListener('click',confirmTransfer);
$('#bankTransferFrom').addEventListener('change',updateBankTransferSource);
$('#bankTransferDestination').addEventListener('change',updateBankTransferDestination);
$('#bankAccountNumber').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,13);validateBankTransfer();});
$('#bankTransferAmount').addEventListener('input',updateBankTransferDestination);
$('#bankTransferForm').addEventListener('submit',handleBankTransfer);
$('#entryAccount').addEventListener('change',updateEntryCurrency);
$('#entryForm').addEventListener('submit',handleEntrySubmit);
$('#goalForm').addEventListener('submit',handleGoalSubmit);
$('#accountForm').addEventListener('submit',handleAccountSubmit);
$('#accountColorEditForm').addEventListener('submit',handleAccountColorEdit);
$('#externalBankForm').addEventListener('submit',handleExternalBankSubmit);
$('#externalBankAccountNumber').addEventListener('input',event=>{event.target.value=event.target.value.replace(/\D/g,'').slice(0,13);});
$('#goalColor').addEventListener('input',()=>updateColorValue('goal'));
$('#accountColor').addEventListener('input',()=>updateColorValue('account'));
$('#accountEditColor').addEventListener('input',updateAccountColorPreview);
$('#accountCurrency').addEventListener('change',updateAccountCurrencyLabel);
$('#debitColor').addEventListener('input',()=>updateColorValue('debit'));
$('#debitNumberInput').addEventListener('input',event=>{const digits=event.target.value.replace(/\D/g,'').slice(0,16);event.target.value=digits.replace(/(\d{4})(?=\d)/g,'$1 ');});
$('#cardEditForm').addEventListener('submit',handleCardEdit);
$('#scheduleDestination').addEventListener('change',updateScheduleDestination);
$('#scheduleForm').addEventListener('submit',handleScheduleSubmit);
$('#editName').addEventListener('click',()=>{const name=prompt('ชื่อที่ต้องการแสดง',state.profileName);if(name?.trim()){state.profileName=name.trim().slice(0,30);saveState('แก้ชื่อแล้ว');}});
$('#clearAllBalances').addEventListener('click',requestClearAllBalances);
$('#changePin').addEventListener('click',startPinChange);
$('#enableBiometric').addEventListener('click',enableBiometric);
$('#pinKeypad').addEventListener('click',event=>{const key=event.target.closest('[data-pin-key]')?.dataset.pinKey;if(key&&pinDigits.length<6){pinDigits+=key;$('#pinError').textContent='';updatePinDots();if(pinDigits.length===6)submitPin();}if(event.target.closest('[data-pin-delete]')){pinDigits=pinDigits.slice(0,-1);$('#pinError').textContent='';updatePinDots();}});
$('#pinBiometric').addEventListener('click',authenticateBiometric);
$('#reviewBack').addEventListener('click',returnToTransferEdit);
$('#reviewConfirm').addEventListener('click',openTransferPinVerification);
$('#transferPinBack').addEventListener('click',returnToTransferReview);
$('#transferPinKeypad').addEventListener('click',event=>{if(transferPinVerifying)return;const key=event.target.closest('[data-transfer-pin-key]')?.dataset.transferPinKey;if(key&&transferPinDigits.length<6){transferPinDigits+=key;$('#transferPinError').textContent='';updateTransferPinDots();if(transferPinDigits.length===6)verifyTransferPin();}if(event.target.closest('[data-transfer-pin-delete]')){transferPinDigits=transferPinDigits.slice(0,-1);$('#transferPinError').textContent='';updateTransferPinDots();}});
$('#saveTransferFavorite').addEventListener('click',toggleCompletedFavorite);
$('#successHome').addEventListener('click',finishTransferToHome);
$('#resetData').addEventListener('click',()=>{if(confirm('เริ่มข้อมูลตัวอย่างใหม่ทั้งหมดหรือไม่?')){state=clone(seedState);localStorage.removeItem(STORAGE_KEY);renderAll();notify('เริ่มข้อมูลใหม่แล้ว');}});
document.addEventListener('keydown',event=>{if(!$('#pinScreen').hidden){if(/^\d$/.test(event.key)&&pinDigits.length<6){pinDigits+=event.key;updatePinDots();if(pinDigits.length===6)submitPin();event.preventDefault();}else if(event.key==='Backspace'){pinDigits=pinDigits.slice(0,-1);updatePinDots();event.preventDefault();}return;}if($('#transferPinSheet')?.classList.contains('open')){if(transferPinVerifying){event.preventDefault();return;}if(/^\d$/.test(event.key)&&transferPinDigits.length<6){transferPinDigits+=event.key;$('#transferPinError').textContent='';updateTransferPinDots();if(transferPinDigits.length===6)verifyTransferPin();event.preventDefault();}else if(event.key==='Backspace'){transferPinDigits=transferPinDigits.slice(0,-1);$('#transferPinError').textContent='';updateTransferPinDots();event.preventDefault();}else if(event.key==='Escape'){returnToTransferReview();event.preventDefault();}return;}if(event.key==='Escape'){if($('#transferPickerSheet')?.classList.contains('open'))closeTransferPicker();else closeSheets();}});
function stopViewportZoom(event) {
  if (event.touches?.length > 1 || (typeof event.scale === 'number' && event.scale !== 1)) event.preventDefault();
}

let viewportTouchStartX=0;
let viewportTouchStartY=0;
function rememberViewportTouch(event) {
  if(event.touches?.length!==1) return;
  viewportTouchStartX=event.touches[0].clientX;
  viewportTouchStartY=event.touches[0].clientY;
}
function stopTopRubberBand(event) {
  if(event.touches?.length!==1||event.target.closest('#accountList,.sheet-panel,.transfer-screen,.transfer-flow-screen')) return;
  const deltaX=event.touches[0].clientX-viewportTouchStartX;
  const deltaY=event.touches[0].clientY-viewportTouchStartY;
  const scrollTop=document.scrollingElement?.scrollTop||window.scrollY||0;
  if(scrollTop<=0&&deltaY>7&&Math.abs(deltaY)>Math.abs(deltaX)) event.preventDefault();
}

['gesturestart','gesturechange','gestureend'].forEach(type=>document.addEventListener(type,event=>event.preventDefault(),{passive:false}));
document.addEventListener('touchstart',stopViewportZoom,{passive:false});
document.addEventListener('touchstart',rememberViewportTouch,{passive:true});
document.addEventListener('touchmove',stopViewportZoom,{passive:false});
document.addEventListener('touchmove',stopTopRubberBand,{passive:false});
document.addEventListener('dblclick',event=>event.preventDefault(),{passive:false});
let lastTouchEnd=0;
let lastTouchTarget=null;
document.addEventListener('touchend',event=>{const now=Date.now();const target=event.target.closest?.('button,a,[role="button"]')||event.target;if(now-lastTouchEnd<320&&target===lastTouchTarget)event.preventDefault();lastTouchEnd=now;lastTouchTarget=target;},{passive:false});

if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(()=>{});
bindHomeAccountDeck();
let planScrollFrame=0;
$('#planGrid').addEventListener('scroll',()=>{cancelAnimationFrame(planScrollFrame);planScrollFrame=requestAnimationFrame(()=>syncPlanTabs());},{passive:true});
document.addEventListener('keydown',event=>{if(activeView!=='plans'||!$('#pinScreen').hidden||$('.sheet.open'))return;if(event.key==='ArrowRight'){stepPlan(1);event.preventDefault();}else if(event.key==='ArrowLeft'){stepPlan(-1);event.preventDefault();}});
renderAll();
syncViewChrome(activeView);
initializeAppLock();
processScheduledDeposits();
setInterval(processScheduledDeposits,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)processScheduledDeposits();});
window.addEventListener('focus',processScheduledDeposits);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&$('#qrSheet')?.classList.contains('open'))closeQR();});

/* ---------- share the public plans page ---------- */
async function sharePlans(){
  const url = new URL('/plans', location.origin).href;
  const data = {title:'MePocket Plans', text:'เลือกแพลน MePocket', url};
  if (navigator.share){ try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
  try { await navigator.clipboard.writeText(url); notify('คัดลอกลิงก์หน้าแพลนแล้ว'); }
  catch { const ta = document.createElement('textarea'); ta.value = url; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); notify('คัดลอกลิงก์หน้าแพลนแล้ว'); } catch { notify(url); } ta.remove(); }
}
document.addEventListener('click', event => { if (event.target.closest('[data-share-plans]')) sharePlans(); });
