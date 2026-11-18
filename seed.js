const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const dataDir = path.join(__dirname, 'data');
const publicDataDir = path.join(__dirname, 'public', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(publicDataDir)) fs.mkdirSync(publicDataDir, { recursive: true });

const dbPath = path.join(dataDir, 'lev-ari-operations.sqlite');
const jsonDbPath = path.join(dataDir, 'cloud-db.json');
const publicJsonDbPath = path.join(publicDataDir, 'cloud-db.json');

const INITIAL_METADATA = {
  weekly_capacity_he: '2–3 שעות שבועיות (מוצע)',
  weekly_capacity_en: '2–3 hours per week (proposed)',
  working_principle_he: 'תיעדוף לפי ערך עסקי וזמן זמין; הסכמה משותפת על סדר הפעולות והיקפן.',
  working_principle_en: 'Prioritize by business value and available time; agree together on sequencing and scope.',
  schools_verification_note_he: 'כתובות דוא״ל ממקורות רשמיים סומנו בהתאם; כתובות ממדריכים חיצוניים או מרשימות ישנות דורשות אימות טלפוני לפני שליחה. כל טיוטות הפנייה כוללות קישור לאתר מכבי לב-ארי.',
  schools_verification_note_en: 'Email addresses from official sources are marked accordingly; addresses from external directories or older lists require phone verification before sending. All outreach drafts include a link to Maccabi Lev-Ari’s website.'
};

const INITIAL_TASKS = [
  {
    task_number: 1,
    priority: 'P1',
    task_he: 'תיאום פגישה עם משה מורנו',
    task_en: 'Coordinate meeting with Moshe Moreno',
    description_he: 'תיאום שיחה משותפת בנוגע לאירוח כיתת אמן (Masterclass) בתשלום עבור הרשת המקצועית שלו.',
    description_en: 'Arrange a joint conversation about hosting a paid masterclass for his professional network.',
    status: 'Not started',
    next_action_he: 'מעקב אחר ההיכרות והצעת מועדים לפגישה',
    next_action_en: 'Follow up on the introduction and propose meeting times',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'סטטוס פגישה, צעד המשך מוסכם, פרטי הזמנה פוטנציאליים',
    output_results_en: 'Meeting status, agreed next step, potential booking details',
    links_files: '',
    notes_approval_he: 'לעדכן את לב-ארי באופן שוטף.',
    notes_approval_en: 'Keep Lev-Ari updated.'
  },
  {
    task_number: 2,
    priority: 'P2',
    task_he: 'קידום כיתת האמן בקריית אונו',
    task_en: 'Promote Kiryat Ono masterclass',
    description_he: 'שיתוף ההכרזה הרשמית, טיזר אנטומיה והמלצה אישית אותנטית; הפצה בקבוצות מקצועיות רלוונטיות.',
    description_en: 'Share official announcement, anatomy teaser, and a genuine personal recommendation; distribute to relevant professional groups.',
    status: 'Not started',
    next_action_he: 'איסוף ההכרזה הרשמית וטיזר האנטומיה',
    next_action_en: 'Collect official announcement and anatomy teaser',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'טיוטת המלצה אישית; רשימת קבוצות אליהן הגענו; מעורבות ופניות שנוצרו',
    output_results_en: 'Draft personal recommendation; list of groups reached; engagement / inquiries generated',
    links_files: '',
    notes_approval_he: 'כיתת אמן: 15 בדצמבר, 15:00–20:00. לתעד קישורים לפוסטים.',
    notes_approval_en: 'Masterclass: 15 Dec, 15:00–20:00. Record post links.'
  },
  {
    task_number: 3,
    priority: 'P3',
    task_he: 'קידום שבועי ברשתות החברתיות',
    task_en: 'Weekly social media promotion',
    description_he: 'סקירת עמודי הפייסבוק האישיים והעסקיים; לייק, תגובה ושיתוף תוכן רלוונטי.',
    description_en: 'Review personal and business Facebook pages; like, comment, and share relevant content.',
    status: 'In progress',
    next_action_he: 'קביעת שגרה שבועית ותיעוד פעילות משמעותית',
    next_action_en: 'Set a weekly routine and record meaningful activity',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'רשימת 10 מוסדות נבנתה; פרטי קשר והודעות מותאמות הוזנו. טרם בוצעה פנייה.',
    output_results_en: 'List of 10 institutions built; contact details and tailored outreach messages entered. Outreach not yet sent.',
    links_files: '',
    notes_approval_he: 'יעד: מינימום 3 שיתופים משמעותיים בשבוע.',
    notes_approval_en: 'Target: minimum 3 meaningful shares per week.'
  },
  {
    task_number: 4,
    priority: 'P4',
    task_he: 'מחקר ואיתור 10 בתי ספר נוספים לעיסוי',
    task_en: 'Research 10 additional massage schools',
    description_he: 'איתור 10 מוסדות חדשים עם מסלולים רלוונטיים ופרטי קשר מאומתים של מקבלי החלטות.',
    description_en: 'Identify 10 new institutions with relevant programs and verified decision-maker contact details.',
    status: 'Not started',
    next_action_he: 'בניית רשימת מוסדות פוטנציאליים ואימות פרטי קשר',
    next_action_en: 'Build prospect list and verify contacts',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'רשומות מוסדות מלאות: מוסד, מקבל החלטות, פרטי קשר מאומתים, התאמה וטיוטת פנייה',
    output_results_en: 'Completed prospect records: institution, decision-maker, verified contacts, fit, and outreach draft',
    links_files: '',
    notes_approval_he: 'אין לשכפל מוסדות שכבר נוצר עמם קשר.',
    notes_approval_en: 'Do not duplicate institutions already contacted.'
  },
  {
    task_number: 5,
    priority: 'P4',
    task_he: 'איתור איש קשר חלופי למכללת אהרון יעקובי',
    task_en: 'Find alternative contact for Aharon Yaakobi College',
    description_he: 'מציאת אימייל/טלפון חלופי מאומת, בעדיפות למקבל החלטות בתחום ההכשרה המקצועית.',
    description_en: 'Find a verified alternative email/phone, preferably professional education decision-maker.',
    status: 'Not started',
    next_action_he: 'זיהוי ערוצי קשר עדכניים ואימות איש קשר חלופי',
    next_action_en: 'Identify current contact channels and verify alternative contact',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'שם איש קשר חלופי מאומת, אימייל, טלפון ומקור',
    output_results_en: 'Verified alternative contact name, email, phone, and source',
    links_files: '',
    notes_approval_he: 'כתובת האימייל המקורית לא עבדה.',
    notes_approval_en: 'Original email did not work.'
  },
  {
    task_number: 6,
    priority: 'P5',
    task_he: 'מחקר ואיתור 10 קבוצות ריצה',
    task_en: 'Research 10 running groups',
    description_he: 'איתור 10 קבוצות ריצה ומקבלי החלטות / מאמנים רלוונטיים.',
    description_en: 'Identify 10 running groups and relevant decision-makers.',
    status: 'Not started',
    next_action_he: 'איתור קבוצות ריצה מועמדות',
    next_action_en: 'Identify candidate running groups',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'רשימת 10 קבוצות עם פרטי קשר והזדמנויות לשיתוף פעולה',
    output_results_en: 'List of 10 groups with contact details and potential collaboration opportunities',
    links_files: '',
    notes_approval_he: '',
    notes_approval_en: ''
  },
  {
    task_number: 7,
    priority: 'P5',
    task_he: 'מחקר ואיתור 10 קבוצות רכיבה (אופניים)',
    task_en: 'Research 10 cycling groups',
    description_he: 'איתור 10 קבוצות רכיבה ומקבלי החלטות / מאמנים רלוונטיים.',
    description_en: 'Identify 10 cycling groups and relevant decision-makers.',
    status: 'Not started',
    next_action_he: 'איתור קבוצות רכיבה מועמדות',
    next_action_en: 'Identify candidate cycling groups',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'רשימת 10 קבוצות עם פרטי קשר והזדמנויות לשיתוף פעולה',
    output_results_en: 'List of 10 groups with contact details and potential collaboration opportunities',
    links_files: '',
    notes_approval_he: '',
    notes_approval_en: ''
  },
  {
    task_number: 8,
    priority: 'P5',
    task_he: 'מחקר ואיתור 10 מועדונים/קבוצות טריאתלון',
    task_en: 'Research 10 triathlon clubs/groups',
    description_he: 'גיבוש הרשימה המלאה ללא השמטת ארגונים; לב-ארי יבחן שיקולי מערכות יחסים קיימות.',
    description_en: 'Compile the complete list without excluding organizations; Lev-Ari will review relationship concerns.',
    status: 'Not started',
    next_action_he: 'איתור מועדונים וקבוצות טריאתלון מועמדים',
    next_action_en: 'Identify candidate triathlon clubs and groups',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'רשימה מלאה של מועדונים, אנשי קשר, קישורים, היקף חברים משוער והזדמנויות',
    output_results_en: 'Complete list of clubs, contacts, links, estimated membership if available, and opportunities',
    links_files: '',
    notes_approval_he: 'אין להחריג שום ארגון לפני בדיקת לב-ארי.',
    notes_approval_en: 'Do not exclude any organization before Lev-Ari reviews.'
  },
  {
    task_number: 9,
    priority: 'P6',
    task_he: 'השלמת סרטון ההדרכה החסר',
    task_en: 'Complete outstanding training video',
    description_he: 'וידוא התוכן/החומר החסר הנדרש והסכמה על תאריך יעד ריאלי להשלמה.',
    description_en: 'Confirm outstanding content/material required and agree on a realistic completion date.',
    status: 'In progress',
    next_action_he: 'בדיקת ההסכם המקורי וזיהוי החומר החסר',
    next_action_en: 'Review original agreement and identify missing material',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'הגיליון נבנה ועודכן; נדרש להמשיך לעדכן סטטוסים ותוצאות.',
    output_results_en: 'The tracking workbook was built and updated; continue updating statuses and outcomes.',
    links_files: '',
    notes_approval_he: 'מועד ההשלמה יתואם במשותף.',
    notes_approval_en: 'Completion timing to be agreed.'
  },
  {
    task_number: 10,
    priority: 'P7',
    task_he: 'תחזוקת מערכת המעקב המשותפת',
    task_en: 'Maintain shared tracking spreadsheet',
    description_he: 'שמירה על סטטוס משימות, התקדמות, אישורים, מעקבים, פעולות הבאות ותוצאות מעודכנים תמיד.',
    description_en: 'Keep task status, progress, approvals, follow-ups, next actions, and results up to date.',
    status: 'In progress',
    next_action_he: 'שיתוף סביבת העבודה והסכמה על שגרת עדכונים',
    next_action_en: 'Share this workbook and agree on update routine',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'נוסחו הודעות מותאמות ל-10 מוסדות, כולל קישור לאתר מכבי לב-ארי; ממתינות לאישור לפני שליחה.',
    output_results_en: 'Tailored outreach messages drafted for 10 institutions, including link to Maccabi Lev-Ari website; awaiting approval before sending.',
    links_files: '',
    notes_approval_he: 'מערכת מעקב מרכזית לשיתוף הפעולה.',
    notes_approval_en: 'Central tracker for the collaboration.'
  },
  {
    task_number: 11,
    priority: 'P7',
    task_he: 'הכנת הודעות פנייה לאישור',
    task_en: 'Prepare outreach messages for approval',
    description_he: 'ניסוח הודעות לבתי ספר ולגורמים פוטנציאליים; קבלת אישור לפני שליחה או דיון על תמחור.',
    description_en: 'Draft messages to schools and other prospects; obtain approval before sending or discussing pricing.',
    status: 'Not started',
    next_action_he: 'ניסוח הודעת פנייה ראשונה למוסדות הלימוד',
    next_action_en: 'Draft first outreach message for schools',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'טיוטות הודעות פנייה, גרסאות מותאמות לנמען וסטטוס אישור',
    output_results_en: 'Draft outreach messages, recipient-specific versions, and approval status',
    links_files: '',
    notes_approval_he: 'אין לשלוח פניות או להתחייב לתמחור לפני קבלת אישור.',
    notes_approval_en: 'No outreach or pricing commitments before approval.'
  },
  {
    task_number: 12,
    priority: 'P7',
    task_he: 'הכנה לפגישת ה-Zoom הבאה',
    task_en: 'Prepare for next Zoom meeting',
    description_he: 'סקירת התקדמות, התחייבויות, זמינות, פעולות הבאות והחלטות.',
    description_en: 'Review progress, commitments, availability, next actions, and decisions.',
    status: 'Not started',
    next_action_he: 'עדכון מערכת המעקב לפני הפגישה',
    next_action_en: 'Update tracker before the meeting',
    owner_he: 'אופק',
    owner_en: 'Ofek',
    output_results_he: 'סדר יום לפגישה, סיכום התקדמות, החלטות ומשימות להמשך',
    output_results_en: 'Meeting agenda, progress summary, decisions, and action items',
    links_files: '',
    notes_approval_he: 'זמינות שבועית מוצעת: 2–3 שעות.',
    notes_approval_en: 'Weekly availability proposed: 2–3 hours.'
  }
];

const INITIAL_SCHOOLS = [
  {
    record_number: 1,
    record_type: 'prospect',
    institution_he: 'המכללה האקדמית גליל מערבי – היחידה ללימודי חוץ',
    institution_en: 'Western Galilee Academic College – External Studies Division',
    location_he: 'עכו',
    location_en: 'Akko (Acre)',
    relevant_program_he: 'מטפלים בכירים בעיסוי הוליסטי; עיסוי שוודי, רקמות עמוקות ועיסוי ארבע ידיים',
    relevant_program_en: 'Senior Holistic Massage Therapists; Swedish Massage, Deep Tissue & Four-Hands Massage',
    decision_maker_he: 'רכז/ת היחידה ללימודי חוץ או מנהל/ת התוכנית (שם לא פורסם)',
    decision_maker_en: 'External Studies Coordinator or Program Director (name unpublished)',
    verified_email: 'info_ext@wgalil.ac.il',
    verified_phone: '04-9015262',
    website: 'https://wgalil.ac.il/external_studies/alternative/senior_holistic_therapists/',
    fit_opportunity_he: 'התאמה גבוהה: מסלול עיסוי פעיל ביחידה אקדמית ללימודי חוץ; קהל של מטפלים בהכשרה ובהמשך מקצועי.',
    fit_opportunity_en: 'High Fit: Active massage track in an academic external studies unit; audience of therapists in training and continuing professional development.',
    outreach_message_he: `שלום רב,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

מכיוון שהיחידה ללימודי חוץ במכללה מציעה הכשרות מקצועיות בתחומי הטיפול, נשמח לבחון אפשרות לקיים אצלכם השתלמות קלינית מעשית למטפלים ולבוגרי מסלולי טיפול במגע.

ההשתלמות מועברת על ידי מכבי לב-ארי, בעל ניסיון של למעלה מ-25 שנה בתחום הטיפול הידני והעבודה עם ספורטאים. התוכן יכול לכלול אנטומיה יישומית, חשיבה קלינית, הערכה באמצעות מגע, עבודה עם רקמות רכות וטכניקות טיפול מתקדמות.

נשמח לבדוק התאמה לתוכניות ההכשרה של היחידה ולשוחח עם הגורם האחראי על לימודי החוץ וההשתלמויות.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

אשמח לדעת למי ניתן להעביר פרטים נוספים.

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Dear External Studies Team,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

Since the External Studies Division at Western Galilee Academic College offers professional training in manual therapy, we would love to explore hosting a practical clinical masterclass for your massage therapy students and alumni.

The workshop is led by Maccabi Lev-Ari, who brings over 25 years of experience in manual therapy and elite athletic treatment. Topics can include applied anatomy, clinical reasoning, palpation assessment, soft-tissue work, and advanced treatment techniques.

We would be glad to discuss how this can complement your current curriculum with the head of external studies and professional workshops.

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

Best regards,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לאתר את מנהל/ת התוכנית דרך היחידה ללימודי חוץ.',
    next_action_en: 'Locate the program director through the External Studies unit.',
    notes_he: 'פרטי קשר ומסלול אומתו באתר המכללה ובאיגוד. | כתובת היחידה ללימודי חוץ לפי ידיעון/פרסום המכללה. מקור: https://fliphtml5.com/ixnnz/xhlv/ידיעון_לימודי_חוץ_2025-3/60/ . יש לאמת טלפונית לפני שליחה.',
    notes_en: 'Contact details and track verified on college website and association directory. | External studies email per 2025 college bulletin. Verify by phone prior to sending.'
  },
  {
    record_number: 2,
    record_type: 'prospect',
    institution_he: 'מכללת מדיסין',
    institution_en: 'Medicin College',
    location_he: 'חיפה (שלוחות נוספות לפי אתר המכללה)',
    location_en: 'Haifa (plus additional branches per college website)',
    relevant_program_he: 'עיסוי רפואי מוסמך ועיסוי רפואי בכיר; קורס מתקדם כולל טיפול בפציעות ספורט',
    relevant_program_en: 'Certified & Senior Medical Massage; Advanced track including Sports Injury Treatment',
    decision_maker_he: 'רכז/ת תחום העיסוי או מנהל/ת אקדמי/ת (שם לא פורסם)',
    decision_maker_en: 'Massage Department Coordinator or Academic Director (name unpublished)',
    verified_email: 'medicinc@college.org.il',
    verified_phone: '5030*',
    website: 'https://medicin.org.il/',
    fit_opportunity_he: 'התאמה גבוהה מאוד: קיימים מסלולי עיסוי רפואי ובכיר, עם זיקה מפורשת לפציעות ספורט ולטכניקות מתקדמות.',
    fit_opportunity_en: 'Very High Fit: Offers Certified & Senior Medical Massage tracks with explicit focus on sports injuries and advanced techniques.',
    outreach_message_he: `שלום רב,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

לאור מסלולי העיסוי הרפואי והעיסוי הרפואי הבכיר שמכללת מדיסין מציעה, רצינו לבדוק אפשרות לקיים במכללה כיתת אמן מתקדמת לבוגרים ולתלמידים מתקדמים.

מכבי לב-ארי מביא למפגש ניסיון של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים. ההשתלמות מתמקדת בחיבור בין אנטומיה יישומית לחשיבה קלינית, הערכה במגע, טיפול ברקמות רכות ויישום טכניקות טיפול במקרים מעולם הספורט.

נשמח לבחון יחד תוכן שישלים את ההכשרה הקיימת במכללה ויעניק למשתתפים העשרה מעשית ומעמיקה.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

האם ניתן להפנות אותי למנהל/ת תחום העיסוי או למי שאחראי/ת על השתלמויות מקצועיות?

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Dear Medicin College Team,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

Given Medicin College’s Certified and Senior Medical Massage programs, we would love to explore hosting an advanced masterclass for your senior students and graduates.

Maccabi Lev-Ari brings over 25 years of clinical experience in manual therapy and working with competitive athletes. The masterclass bridges applied anatomy with clinical reasoning, palpation assessment, soft-tissue mobilization, and sports injury case applications.

Could you connect me with the Head of the Massage Department or the coordinator for professional continuing education?

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

Thank you,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לבקש חיבור למנהל/ת תחום העיסוי או למנהל/ת ההכשרות.',
    next_action_en: 'Request connection to the Massage Department Head or Training Director.',
    notes_he: 'האתר הרשמי מציג את הקורסים ופרטי הקשר. | כתובת הדוא״ל נשמרה מהרשימה הקודמת; יש לאמת לפני שליחה.',
    notes_en: 'Official website lists courses and contact details. | Email retained from previous list; verify before sending.'
  },
  {
    record_number: 3,
    record_type: 'prospect',
    institution_he: 'Manual IL',
    institution_en: 'Manual IL – Center for Advanced Manual Therapy',
    location_he: 'הרצליה פיתוח',
    location_en: 'Herzliya Pituach',
    relevant_program_he: 'הכשרות מתקדמות בתרפיה מנואלית, STB, עיסוי רפואי, ספורטתרפיה ושיקום',
    relevant_program_en: 'Advanced Manual Therapy, Soft Tissue Balance (STB), Medical Massage, Sports Therapy & Rehab',
    decision_maker_he: 'אייל פייגין / גבעון פלד (מייסדים)',
    decision_maker_en: 'Eyal Feigin / Givon Peled (Founders)',
    verified_email: 'feigineyal@gmail.com',
    verified_phone: '054-8145858',
    website: 'https://www.manualil.org/',
    fit_opportunity_he: 'התאמה מקצועית גבוהה לתוכן מתקדם ולקהל של מטפלים מנוסים; עם זאת, יש לבדוק אם קיימת חפיפה או תחרות מול תוכניות ההכשרה שלהם.',
    fit_opportunity_en: 'High professional fit for advanced content and experienced practitioners; however, evaluate potential overlap or competition with their own courses.',
    outreach_message_he: `שלום אייל וגבעון,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

ראיתי ש-Manual IL מתמחה בהכשרות מתקדמות בתרפיה מנואלית, Soft Tissue Balance, ספורטתרפיה ועיסוי רפואי. לאור החיבור המקצועי הזה, רציתי לבדוק האם עשוי להיות עניין בשיתוף פעולה או בהשתלמות אורח ייעודית למטפלים.

מכבי לב-ארי מביא ניסיון קליני של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים. ניתן לבנות מפגש ממוקד סביב חשיבה קלינית, הערכה במגע, אנטומיה יישומית וגישות לעבודה עם רקמות רכות, בהתאם לתכנים שכבר נלמדים אצלכם.

ברור לנו שיש חפיפה מקצועית מסוימת בין תחומי הפעילות, ולכן הפנייה היא לבחון אפשרות לתוכן משלים ולא לחזור על הכשרות קיימות.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

אשמח לשמוע אם יש עניין בשיחה ראשונית.

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Hi Eyal and Givon,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

Seeing Manual IL’s focus on advanced manual therapy, Soft Tissue Balance, sports therapy, and medical massage, I wanted to explore whether there might be interest in a collaborative guest masterclass for practicing therapists.

Maccabi Lev-Ari brings over 25 years of clinical experience in manual therapy and athletic treatment. We can structure a focused workshop around clinical reasoning, palpation assessment, applied anatomy, and soft-tissue approaches tailored to complement—rather than duplicate—your existing curriculum.

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

I would love to hear if you are open to a brief introductory call.

Best,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לבחון קודם את מידת החפיפה המקצועית והמסחרית לפני פנייה.',
    next_action_en: 'Review professional and commercial overlap internally before reaching out.',
    notes_he: 'טלפון ודוא״ל מופיעים ברישום האיגוד; תחומי ההכשרה מופיעים באתר הרשמי. | כתובת הדוא״ל נשמרה מהרשימה הקודמת; יש לאמת לפני שליחה.',
    notes_en: 'Phone and email listed in association registry; training tracks on official website. | Verify email before sending.'
  },
  {
    record_number: 4,
    record_type: 'prospect',
    institution_he: 'מכללת כרכור',
    institution_en: 'Karkur College (BeSpirit)',
    location_he: 'פרדס חנה-כרכור',
    location_en: 'Pardes Hanna-Karkur',
    relevant_program_he: 'עיסוי רפואי הוליסטי; השתלמויות למטפלים בכירים בעיסוי רפואי',
    relevant_program_en: 'Holistic Medical Massage; Continuing Education for Senior Medical Massage Therapists',
    decision_maker_he: 'רכז/ת תחום העיסוי או מנהל/ת המכללה (שם לא אומת)',
    decision_maker_en: 'Massage Track Coordinator or College Director (name unverified)',
    verified_email: 'info@spirit.co.il',
    verified_phone: '04-6377716 / 072-3712226',
    website: 'https://bespirit.co.il/',
    fit_opportunity_he: 'התאמה גבוהה: מציעה הכשרות בעיסוי רפואי והשתלמויות למטפלים בכירים, כלומר קהל יעד מתאים לכיתת אמן מתקדמת.',
    fit_opportunity_en: 'High Fit: Offers medical massage certifications and continuing education for senior therapists—ideal target audience for an advanced masterclass.',
    outreach_message_he: `שלום רב,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

מכיוון שמכללת כרכור מציעה הכשרות בעיסוי רפואי והשתלמויות למטפלים, נשמח לבדוק אפשרות לקיים אצלכם כיתת אמן מתקדמת לבוגרי המכללה ולתלמידים בעלי רקע מתאים.

ההשתלמות מועברת על ידי מכבי לב-ארי, בעל ניסיון של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים. היא משלבת אנטומיה יישומית, חשיבה קלינית, הערכה במגע, עבודה עם רקמות רכות וטכניקות טיפול מעשיות.

נשמח להתאים את התוכן לרמת המשתתפים ולתחומי הלימוד במכללה, ולבחון אפשרות לשיתוף פעולה מקצועי.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

אשמח לדעת מי הגורם המתאים לשיחה בנושא השתלמויות וקורסי המשך.

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Dear Karkur College Team,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

Since Karkur College offers medical massage training and continuing education for practitioners, we would love to explore hosting an advanced clinical masterclass for your alumni and senior students.

Led by Maccabi Lev-Ari—with over 25 years of experience in manual therapy and athletic treatment—the workshop integrates applied anatomy, clinical reasoning, palpation assessment, soft-tissue work, and practical techniques.

Could you let me know the right person to speak with regarding professional workshops and continuing education?

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

Thank you,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לפנות למכללה ולבקש את מנהל/ת תחום ההכשרות בעיסוי.',
    next_action_en: 'Contact the college and ask for the Head of Massage Training.',
    notes_he: 'פרטי קשר באתר הרשמי; תחומי לימוד באתר ובאיגוד. | כתובת הדוא״ל נשמרה מהרשימה הקודמת; יש לאמת לפני שליחה.',
    notes_en: 'Contact details on official website; study programs on website and association registry. | Verify email before sending.'
  },
  {
    record_number: 5,
    record_type: 'prospect',
    institution_he: 'קמפוס ברושים',
    institution_en: 'Broshim Campus (Tel Aviv University Sports Club)',
    location_he: 'רמת אביב, תל אביב',
    location_en: 'Ramat Aviv, Tel Aviv',
    relevant_program_he: 'עיסוי רפואי משולב; מסלול הכשרת מטפלים',
    relevant_program_en: 'Integrated Medical Massage; Therapist Certification Track',
    decision_maker_he: 'מנהל/ת בית הספר להכשרת מטפלים או רכז/ת מסלול העיסוי (שם לא אומת)',
    decision_maker_en: 'School of Therapist Training Director or Massage Track Coordinator (name unverified)',
    verified_email: 'broshimservice@tausc.co.il',
    verified_phone: '03-6422511 (נדרש אימות מול הקמפוס)',
    website: 'https://www.broshim.tau.org.il/',
    fit_opportunity_he: 'התאמה גבוהה: מסלול עיסוי רפואי משולב משלב עיסוי שוודי וכלים טיפוליים/רפואיים. פרטי המסלול נמצאו במאגר לימודים חיצוני; יש לוודא שהוא עדיין פעיל מול הקמפוס.',
    fit_opportunity_en: 'High Fit: Integrated medical massage track combining Swedish massage with clinical/therapeutic tools. Verify current program activity directly with the campus.',
    outreach_message_he: `שלום רב,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

קמפוס ברושים פועל בתחום הרפואה המשלימה ומכשיר מטפלים במקצועות המגע. נשמח לבדוק אפשרות להציע לתלמידים מתקדמים ולבוגרים השתלמות קלינית מעשית שתעמיק את הידע והכלים שלהם בתחום הטיפול הידני.

מכבי לב-ארי מביא ניסיון של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים. נושאי ההשתלמות יכולים לכלול אנטומיה יישומית, חשיבה קלינית, הערכה באמצעות מגע, עבודה עם רקמות רכות וטכניקות טיפול מתקדמות.

נשמח לשוחח עם הגורם האחראי על תוכניות הלימוד או ההשתלמויות ולבחון התאמה לתכנים הנלמדים בקמפוס.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Dear Broshim Campus Team,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

As Broshim Campus trains practitioners in complementary medicine and manual therapies, we would love to explore offering a practical clinical masterclass for your advanced students and alumni.

Maccabi Lev-Ari brings over 25 years of experience in manual therapy and working with athletes. Workshop topics can include applied anatomy, clinical reasoning, palpation assessment, soft-tissue therapy, and advanced clinical techniques.

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

Thank you,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לאמת טלפונית את פרטי הקשר ואת הפעילות העדכנית של מסלול העיסוי הרפואי המשולב.',
    next_action_en: 'Verify contact details and current status of the Integrated Medical Massage track by phone.',
    notes_he: 'תוכנית הלימוד נמצאה במאגר לימודים חיצוני; הטלפון מופיע במדריך קשר חיצוני ולא אומת באתר הרשמי. | כתובת דוא״ל שמופיעה במדריך עסקי חיצוני, לא נמצאה בעמוד קשר רשמי של הקמפוס. יש לאמת בטלפון/טופס באתר לפני שליחה. מקור: https://easy.co.il/page/9118938',
    notes_en: 'Program found in external study directory; phone and email from external business directory (https://easy.co.il/page/9118938). Verify by phone or official contact form before sending.'
  },
  {
    record_number: 6,
    record_type: 'prospect',
    institution_he: 'מכללת הנות',
    institution_en: 'Henot College',
    location_he: 'חדרה',
    location_en: 'Hadera',
    relevant_program_he: 'עיסוי רפואי; סדנאות והשתלמויות לבעלי תעודת עיסוי',
    relevant_program_en: 'Medical Massage; Workshops & Continuing Education for Certified Massage Therapists',
    decision_maker_he: 'הנהלת המכללה / רכזת הקורס יפעת חרזי',
    decision_maker_en: 'College Management / Course Coordinator Yifat Harazi',
    verified_email: 'henot.co@gmail.com',
    verified_phone: '077-4304337',
    website: 'https://www.henot.co.il/',
    fit_opportunity_he: 'התאמה גבוהה מאוד: באתר הרשמי מופיע קורס עיסוי רפואי שנתי, לימוד פתולוגיות גופניות וסדנאות עיסוי המיועדות לבעלי תעודה.',
    fit_opportunity_en: 'Very High Fit: Official website features an annual medical massage course, pathology studies, and specialized workshops for certified practitioners.',
    outreach_message_he: `שלום רב,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

ראינו שמכללת הנות מציעה הכשרה בעיסוי רפואי וכן סדנאות והשתלמויות לבעלי רקע בתחום. רצינו לבדוק אפשרות לקיים אצלכם השתלמות מתקדמת המיועדת לבוגרי מסלול העיסוי ולמטפלים פעילים.

מכבי לב-ארי מביא ניסיון של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים. ההשתלמות תתמקד בהעמקת החשיבה הקלינית, אנטומיה יישומית, הערכה במגע, טיפול ברקמות רכות וטכניקות מעשיות מעולם הטיפול בספורט.

נשמח להתאים את רמת התוכן לקהל היעד ולבחון יחד אפשרות לשיתוף פעולה.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

למי ניתן לפנות בנושא השתלמויות מקצועיות?

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Dear Henot College Team,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

We saw that Henot College offers medical massage certification as well as continuing education workshops for certified practitioners. We would love to explore hosting an advanced masterclass for your massage alumni and active therapists.

Maccabi Lev-Ari brings over 25 years of experience in manual therapy and athletic treatment. The workshop focuses on clinical reasoning, applied anatomy, palpation assessment, soft-tissue treatment, and sports therapy techniques.

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

Who is the best person to speak with regarding professional workshops?

Thank you,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לברר מי מקבל ההחלטות לגבי השתלמויות מקצועיות ולוודא מועדים ומחזורי לימוד פעילים.',
    next_action_en: 'Confirm decision-maker for professional workshops and check active course schedules.',
    notes_he: 'טלפון, דוא״ל ומסלול עיסוי רפואי מופיעים באתר הרשמי. | כתובת הדוא״ל נשמרה מהרשימה הקודמת; יש לאמת לפני שליחה.',
    notes_en: 'Phone, email, and medical massage track appear on official site. | Verify email before sending.'
  },
  {
    record_number: 7,
    record_type: 'prospect',
    institution_he: 'מכון וולפסון',
    institution_en: 'Wolfson Institute',
    location_he: 'באר שבע',
    location_en: 'Be’er Sheva',
    relevant_program_he: 'לימודי עיסוי רפואי',
    relevant_program_en: 'Medical Massage Studies',
    decision_maker_he: 'הנהלת המכון / אחראי/ת לימודי עיסוי (שם לא פורסם)',
    decision_maker_en: 'Institute Management / Head of Massage Studies (name unpublished)',
    verified_email: 'wolfsonmedic@gmail.com',
    verified_phone: '08-6230574',
    website: 'https://wclinic.ilbiz.co.il/',
    fit_opportunity_he: 'התאמה טובה: מוסד ייעודי ללימודי עיסוי רפואי; יש לאמת את היקף הפעילות והאם קיימים קורסים מתקדמים.',
    fit_opportunity_en: 'Good Fit: Dedicated institution for medical massage studies; verify current activity volume and advanced course offerings.',
    outreach_message_he: `שלום רב,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

רציתי לבדוק אפשרות לקיים במכון וולפסון השתלמות מקצועית בתחום הטיפול הידני והעיסוי, המיועדת לבוגרי הכשרות ולמטפלים בעלי רקע מתאים.

מכבי לב-ארי מביא ניסיון של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים. ההשתלמות יכולה להתמקד באנטומיה יישומית, חשיבה קלינית, הערכה במגע, עבודה עם רקמות רכות וטכניקות טיפול מתקדמות.

נשמח להבין אילו מסלולי עיסוי והכשרות פעילים כיום במכון, ולבדוק האם ניתן לבנות פעילות שתתאים לתלמידים ולבוגרים שלכם.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

אשמח אם תוכלו להפנות אותי לאדם האחראי על תוכניות הלימוד וההשתלמויות.

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Dear Wolfson Institute Team,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

I wanted to explore hosting a professional manual therapy and medical massage workshop at the Wolfson Institute for graduates and practicing therapists.

Maccabi Lev-Ari brings over 25 years of clinical experience in manual therapy and working with athletes. The workshop can focus on applied anatomy, clinical reasoning, palpation assessment, soft-tissue work, and advanced treatment techniques.

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

Could you direct me to the person responsible for study programs and continuing education?

Thank you,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לאמת שהקורסים מתקיימים כיום ולבקש איש קשר פדגוגי.',
    next_action_en: 'Verify that courses are currently active and request a pedagogical contact person.',
    notes_he: 'פרטי קשר ומסלול עיסוי רפואי מופיעים בפרופיל המוסד באיגוד. | כתובת הדוא״ל נשמרה מהרשימה הקודמת; יש לאמת לפני שליחה.',
    notes_en: 'Contact details and medical massage track appear in association profile. | Verify email before sending.'
  },
  {
    record_number: 8,
    record_type: 'prospect',
    institution_he: 'בית הספר למקצועות הטיפול – שימי בק',
    institution_en: 'MT Academy – School of Therapeutic Professions (Shimiibaq)',
    location_he: 'תל אביב',
    location_en: 'Tel Aviv',
    relevant_program_he: 'קורס עיסוי משולב; ספורטתרפיה; תרפיה מנואלית והכשרות מתקדמות למטפלים',
    relevant_program_en: 'Integrated Massage Course; Sports Therapy; Manual Therapy & Advanced Practitioner Training',
    decision_maker_he: 'שימי בק – מייסד ומנהל',
    decision_maker_en: 'Shimi Bak – Founder & Director',
    verified_email: 'support@mtacademy.co.il',
    verified_phone: '072-3341005',
    website: 'https://mtacademy.co.il/',
    fit_opportunity_he: 'התאמה מקצועית גבוהה: קהל יעד של מטפלים ומאמנים, הכשרות בעיסוי משולב, ספורטתרפיה ותחומי טיפול מתקדמים. יש לבדוק חפיפה מקצועית/מסחרית לפני פנייה.',
    fit_opportunity_en: 'High Professional Fit: Target audience of therapists and coaches, courses in integrated massage, sports therapy, and manual therapy. Review commercial/professional overlap prior to outreach.',
    outreach_message_he: `שלום שימי,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

אני מכיר את הפעילות של בית הספר למקצועות הטיפול ואת הדגש שאתם שמים על הכשרות עומק למטפלים בתחומי המגע, התנועה והספורטתרפיה.

רציתי לבדוק אפשרות לשיתוף פעולה מקצועי סביב כיתת אמן בהנחיית מכבי לב-ארי, בעל ניסיון של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים.

אפשר לבחון מפגש ממוקד שיעסוק בניסיון קליני מהשטח, חשיבה קלינית, אנטומיה יישומית, הערכה במגע ועבודה עם רקמות רכות. כמובן, נרצה לתאם את התוכן כך שישלים את ההכשרות הקיימות אצלכם ולא יחזור עליהן.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

אם זה רלוונטי, אשמח לתאם שיחה קצרה ולבחון אפשרות לשיתוף פעולה.

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Hi Shimi,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

I am familiar with the School of Therapeutic Professions (MT Academy) and your emphasis on in-depth training in touch, movement, and sports therapy.

I wanted to explore a professional collaboration around a masterclass led by Maccabi Lev-Ari, who has over 25 years of experience in manual therapy and working with athletes. We can design a focused session covering field clinical experience, clinical reasoning, applied anatomy, palpation assessment, and soft-tissue work—tailored to complement your existing courses.

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

If relevant, I would love to schedule a brief call to explore collaboration.

Best,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לבחון תחילה את מידת החפיפה והאם קיימת אפשרות לשיתוף פעולה משלים.',
    next_action_en: 'First assess overlap and determine potential for complementary collaboration.',
    notes_he: 'פרטי קשר, מנהל ותוכניות לימוד מופיעים באתר הרשמי. | כתובת הדוא״ל נשמרה מהרשימה הקודמת; יש לאמת לפני שליחה.',
    notes_en: 'Contact info, director, and curriculum appear on official website. | Verify email before sending.'
  },
  {
    record_number: 9,
    record_type: 'prospect',
    institution_he: 'מכללת מדיטבע',
    institution_en: 'Mediteva College',
    location_he: 'פתח תקווה',
    location_en: 'Petah Tikva',
    relevant_program_he: 'עיסוי רפואי; טכניקות עיסוי משולבות, אנטומיה ופיזיולוגיה',
    relevant_program_en: 'Medical Massage; Integrated Massage Techniques, Anatomy & Physiology',
    decision_maker_he: 'הנהלת המכללה / רכז/ת מסלול העיסוי (שם לא פורסם)',
    decision_maker_en: 'College Management / Massage Track Coordinator (name unpublished)',
    verified_email: 'mediteva@mediteva.com',
    verified_phone: '03-9233946',
    website: 'https://www.mediteva.com/',
    fit_opportunity_he: 'התאמה גבוהה: קורס עיסוי רפואי הכולל טכניקות עיסוי שונות ותרגול מעשי; מיקום נגיש במרכז.',
    fit_opportunity_en: 'High Fit: Medical massage course covering diverse techniques and hands-on practice; accessible central location.',
    outreach_message_he: `שלום רב,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

ראינו שמכללת מדיטבע מציעה לימודי עיסוי רפואי לצד הכשרות בתחומי המגע והגוף. נשמח לבדוק אפשרות לקיים אצלכם השתלמות קלינית מעשית לבוגרי המסלול ולתלמידים מתקדמים.

מכבי לב-ארי מביא ניסיון של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים. ההשתלמות יכולה להעמיק את החיבור בין אנטומיה ופיזיולוגיה לבין חשיבה קלינית, הערכה במגע, עבודה עם רקמות רכות וטכניקות טיפול מעשיות.

נשמח להתאים את התוכן לתוכנית הלימודים ולרמת המשתתפים, ולבדוק אפשרות לקיים פעילות מקצועית משותפת.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

אשמח לדעת מי הגורם המתאים לשוחח איתו בנושא.

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Dear Mediteva College Team,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

Seeing that Mediteva College offers medical massage studies alongside manual therapy training, we would love to explore hosting a practical clinical masterclass for your graduates and advanced students.

Maccabi Lev-Ari brings over 25 years of experience in manual therapy and working with athletes. The workshop deepens the connection between anatomy/physiology and clinical reasoning, palpation assessment, soft-tissue work, and hands-on techniques.

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

Who would be the appropriate contact person to discuss this with?

Thank you,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לבקש את איש הקשר שאחראי על מסלול העיסוי הרפואי והשתלמויות.',
    next_action_en: 'Request the contact person responsible for the Medical Massage track and continuing education.',
    notes_he: 'כתובת, טלפון ודוא״ל מופיעים באתר הרשמי; פרטי הקורס מופיעים באתר מכללות חיצוני. | כתובת הדוא״ל נשמרה מהרשימה הקודמת; יש לאמת לפני שליחה.',
    notes_en: 'Address, phone, and email on official website; course details on external college directory. | Verify email before sending.'
  },
  {
    record_number: 10,
    record_type: 'prospect',
    institution_he: 'מכללת תמורות',
    institution_en: 'Tmurot College',
    location_he: 'תל אביב-יפו וחיפה',
    location_en: 'Tel Aviv-Yafo & Haifa',
    relevant_program_he: 'תרפיית עיסוי; עיסוי משולב/אינטגרטיבי/הוליסטי/רפואי; קורסי המשך',
    relevant_program_en: 'Massage Therapy; Integrated / Holistic / Medical Massage; Continuing Education Courses',
    decision_maker_he: 'הנהלת המכללה / גלעד פסל / רכז/ת תחום העיסוי',
    decision_maker_en: 'College Management / Gilad Passal / Massage Coordinator',
    verified_email: 'giladpassal@gmail.com',
    verified_phone: '077-8050088 (תל אביב) / 077-8045245 (חיפה)',
    website: 'https://www.tmurot.org.il/',
    fit_opportunity_he: 'התאמה גבוהה: באתר הרשמי מופיעים לימודי עיסוי משולב וקורס עיסוי לבעלי רקע טיפולי במקצועות המגע; קיימות שלוחות בתל אביב ובחיפה.',
    fit_opportunity_en: 'High Fit: Official website features integrated massage studies and advanced courses for practitioners with touch-therapy backgrounds; campuses in Tel Aviv and Haifa.',
    outreach_message_he: `שלום גלעד,

שמי אופק, ואני פונה מטעם מכבי לב-ארי.

ראיתי שמכללת תמורות מציעה לימודי עיסוי משולב, עיסוי רפואי, רקמות עמוקות וכן קורסי המשך לבעלי רקע טיפולי במקצועות המגע. לכן חשבתי שיכולה להיות התאמה להשתלמות מתקדמת המיועדת לבוגרי המכללה ולמטפלים פעילים.

מכבי לב-ארי מביא ניסיון של למעלה מ-25 שנה בטיפול ידני ובעבודה עם ספורטאים. ההשתלמות יכולה להעמיק את הידע הקיים בתחומי האנטומיה היישומית, החשיבה הקלינית, ההערכה במגע והעבודה המעשית עם רקמות רכות.

נשמח לבחון יחד תוכן שישלים את מסלולי העיסוי וההכשרות הקיימות בתמורות, ולא יחזור על חומר שכבר נלמד.

למידע נוסף על מכבי לב-ארי: https://maccibilevari.com/he.html

אשמח לשוחח ולבדוק אם יש עניין בשיתוף פעולה.

תודה,
אופק

אתר מכבי לב-ארי: https://maccibilevari.com/he.html`,
    outreach_message_en: `Hi Gilad,

My name is Ofek, reaching out on behalf of Maccabi Lev-Ari.

Seeing that Tmurot College offers integrated massage, medical massage, deep tissue, and continuing education courses for touch-therapy practitioners, I thought there could be a great fit for an advanced masterclass for your alumni and active therapists.

Maccabi Lev-Ari brings over 25 years of experience in manual therapy and working with athletes. The workshop deepens practical skills in applied anatomy, clinical reasoning, palpation assessment, and soft-tissue therapy, tailored to complement Tmurot’s existing tracks.

More information about Maccabi Lev-Ari: https://maccibilevari.com/he.html

I would be glad to speak and explore potential collaboration.

Thank you,
Ofek`,
    status: 'Ready for approval',
    response_result_he: 'טרם נשלחה פנייה',
    response_result_en: 'Outreach not sent yet',
    next_action_he: 'לבקש איש קשר שמרכז את תחום העיסוי וקורסי ההמשך.',
    next_action_en: 'Request the coordinator for Massage Studies and Continuing Education.',
    notes_he: 'מסלולי לימוד וטלפונים מופיעים באתר הרשמי; לא פורסמה כתובת דוא״ל בטקסט עמוד יצירת הקשר. | כתובת ישירה שפורסמה ברשימת אנשי קשר באתר תמורות עבור גלעד פסל, מנהל המכללה. הרשימה ותיקה ולכן יש לאמת שהכתובת עדיין פעילה. מקור: https://www.tmurot.org.il/2021/11/22/referrallisttmurot/',
    notes_en: 'Tracks and phones on official website; direct email found on Tmurot referral list for College Director Gilad Passal. Verify email is still active before sending.'
  }
];

const DO_NOT_DUPLICATE_SCHOOLS = [
  { he: 'קמפוס שיאים (Campus Siim)', en: 'Campus Siim' },
  { he: 'מירב – האוניברסיטה הפתוחה (Merav – Open University)', en: 'Merav – Open University' },
  { he: 'מדי וין – לוינסקי-וינגייט (Medi Win – Levinsky-Wingate)', en: 'Medi Win – Levinsky-Wingate' },
  { he: 'מכללת תילתן (Tiltan College)', en: 'Tiltan College' },
  { he: 'מכללת גודלמן (Godelman College)', en: 'Godelman College' },
  { he: 'מכללת אהרון יעקובי (Aharon Yaakobi College)', en: 'Aharon Yaakobi College' },
  { he: 'מרכז הכשרה אלגנט (Elegant Training Center)', en: 'Elegant Training Center' },
  { he: 'בית הספר לעיסוי לוטוס (Lotus Massage School)', en: 'Lotus Massage School' },
  { he: 'מכללת ברק – ירושלים (Barak College – Jerusalem)', en: 'Barak College – Jerusalem' },
  { he: 'מכללת מעיינות – ירושלים (Ma’ayanot College – Jerusalem)', en: 'Ma’ayanot College – Jerusalem' },
  { he: 'לרנובייט חינוך בינלאומי (Learnovate Education)', en: 'Learnovate Education (international)' }
];

const EXISTING_RELATIONSHIPS = [
  { he: 'מכללת רידמן (Reidman)', en: 'Reidman College' },
  { he: 'הקריה האקדמית אונו (Kiryat Ono)', en: 'Kiryat Ono Academic College' },
  { he: 'משה מורנו (Moshe Moreno)', en: 'Moshe Moreno' }
];

function initDatabase() {
  const db = new DatabaseSync(dbPath);

  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS workbook_metadata (
      meta_key TEXT PRIMARY KEY,
      meta_value TEXT NOT NULL,
      worksheet_source TEXT DEFAULT 'Workbook',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      task_number INTEGER NOT NULL,
      priority TEXT NOT NULL,
      task_he TEXT NOT NULL,
      task_en TEXT NOT NULL,
      description_he TEXT DEFAULT '',
      description_en TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Not started',
      next_action_he TEXT DEFAULT '',
      next_action_en TEXT DEFAULT '',
      owner_he TEXT DEFAULT 'אופק',
      owner_en TEXT DEFAULT 'Ofek',
      output_results_he TEXT DEFAULT '',
      output_results_en TEXT DEFAULT '',
      links_files TEXT DEFAULT '',
      notes_approval_he TEXT DEFAULT '',
      notes_approval_en TEXT DEFAULT '',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS schools_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      record_number INTEGER,
      record_type TEXT NOT NULL DEFAULT 'prospect',
      institution_he TEXT NOT NULL,
      institution_en TEXT NOT NULL,
      location_he TEXT DEFAULT '',
      location_en TEXT DEFAULT '',
      relevant_program_he TEXT DEFAULT '',
      relevant_program_en TEXT DEFAULT '',
      decision_maker_he TEXT DEFAULT '',
      decision_maker_en TEXT DEFAULT '',
      verified_email TEXT DEFAULT '',
      verified_phone TEXT DEFAULT '',
      website TEXT DEFAULT '',
      fit_opportunity_he TEXT DEFAULT '',
      fit_opportunity_en TEXT DEFAULT '',
      outreach_message_he TEXT DEFAULT '',
      outreach_message_en TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Ready for approval',
      response_result_he TEXT DEFAULT '',
      response_result_en TEXT DEFAULT '',
      next_action_he TEXT DEFAULT '',
      next_action_en TEXT DEFAULT '',
      notes_he TEXT DEFAULT '',
      notes_en TEXT DEFAULT '',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS athletic_groups_v2 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slot_number INTEGER NOT NULL,
      category TEXT NOT NULL,
      club_organization_he TEXT DEFAULT '',
      club_organization_en TEXT DEFAULT '',
      location_he TEXT DEFAULT '',
      location_en TEXT DEFAULT '',
      decision_maker_he TEXT DEFAULT '',
      decision_maker_en TEXT DEFAULT '',
      contact_details TEXT DEFAULT '',
      website_social TEXT DEFAULT '',
      approx_membership_he TEXT DEFAULT '',
      approx_membership_en TEXT DEFAULT '',
      potential_opportunity_he TEXT DEFAULT '',
      potential_opportunity_en TEXT DEFAULT '',
      outreach_message_he TEXT DEFAULT '',
      outreach_message_en TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Not researched',
      response_result_he TEXT DEFAULT '',
      response_result_en TEXT DEFAULT '',
      next_action_he TEXT DEFAULT '',
      next_action_en TEXT DEFAULT '',
      notes_he TEXT DEFAULT '',
      notes_en TEXT DEFAULT '',
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed metadata
  const upsertMeta = db.prepare(`
    INSERT INTO workbook_metadata (meta_key, meta_value, worksheet_source, updated_at)
    VALUES (?, ?, 'Workbook', CURRENT_TIMESTAMP)
    ON CONFLICT(meta_key) DO UPDATE SET meta_value = excluded.meta_value, updated_at = CURRENT_TIMESTAMP
  `);
  for (const [k, v] of Object.entries(INITIAL_METADATA)) {
    upsertMeta.run(k, v);
  }

  // Seed tasks_v2
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks_v2').get().count;
  if (taskCount === 0) {
    const insertTask = db.prepare(`
      INSERT INTO tasks_v2 (
        task_number, priority, task_he, task_en, description_he, description_en,
        status, next_action_he, next_action_en, owner_he, owner_en,
        output_results_he, output_results_en, links_files, notes_approval_he, notes_approval_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const t of INITIAL_TASKS) {
      insertTask.run(
        t.task_number, t.priority, t.task_he, t.task_en, t.description_he, t.description_en,
        t.status, t.next_action_he, t.next_action_en, t.owner_he, t.owner_en,
        t.output_results_he, t.output_results_en, t.links_files, t.notes_approval_he, t.notes_approval_en
      );
    }
  }

  // Seed schools_v2
  const schoolCount = db.prepare('SELECT COUNT(*) as count FROM schools_v2').get().count;
  if (schoolCount === 0) {
    const insertSchool = db.prepare(`
      INSERT INTO schools_v2 (
        record_number, record_type, institution_he, institution_en, location_he, location_en,
        relevant_program_he, relevant_program_en, decision_maker_he, decision_maker_en,
        verified_email, verified_phone, website, fit_opportunity_he, fit_opportunity_en,
        outreach_message_he, outreach_message_en, status, response_result_he, response_result_en,
        next_action_he, next_action_en, notes_he, notes_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const s of INITIAL_SCHOOLS) {
      insertSchool.run(
        s.record_number, s.record_type, s.institution_he, s.institution_en, s.location_he, s.location_en,
        s.relevant_program_he, s.relevant_program_en, s.decision_maker_he, s.decision_maker_en,
        s.verified_email, s.verified_phone, s.website, s.fit_opportunity_he, s.fit_opportunity_en,
        s.outreach_message_he, s.outreach_message_en, s.status, s.response_result_he, s.response_result_en,
        s.next_action_he, s.next_action_en, s.notes_he, s.notes_en
      );
    }

    let refIdx = 11;
    for (const item of DO_NOT_DUPLICATE_SCHOOLS) {
      insertSchool.run(
        refIdx++, 'do_not_duplicate', item.he, item.en, '', '',
        '', '', '', '',
        '', '', '', '', '',
        '', '', 'Already contacted', 'נוצר קשר בעבר', 'Already contacted previously',
        'לא לשכפל פנייה', 'Do not duplicate outreach', 'נוצר קשר בעבר – אין לשכפל', 'Do not duplicate'
      );
    }

    for (const item of EXISTING_RELATIONSHIPS) {
      insertSchool.run(
        refIdx++, 'existing_relationship', item.he, item.en, '', '',
        '', '', '', '',
        '', '', '', '', '',
        '', '', 'Existing relationship', 'קשר קיים', 'Existing relationship',
        'לנהל בנפרד בתיאום עם לב-ארי', 'Manage separately with Lev-Ari', 'קשר קיים; לשמור בנפרד', 'Existing relationship; keep separate'
      );
    }
  }

  // Seed athletic_groups_v2
  const groupCount = db.prepare('SELECT COUNT(*) as count FROM athletic_groups_v2').get().count;
  if (groupCount === 0) {
    const insertGroup = db.prepare(`
      INSERT INTO athletic_groups_v2 (
        slot_number, category, club_organization_he, club_organization_en,
        location_he, location_en, decision_maker_he, decision_maker_en,
        contact_details, website_social, approx_membership_he, approx_membership_en,
        potential_opportunity_he, potential_opportunity_en, outreach_message_he, outreach_message_en,
        status, response_result_he, response_result_en, next_action_he, next_action_en, notes_he, notes_en
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (let i = 1; i <= 30; i++) {
      const category = i <= 10 ? 'Running' : (i <= 20 ? 'Cycling' : 'Triathlon');
      const nextActHe = category === 'Running'
        ? 'לאתר מועדון ריצה ומאמן ראשי'
        : (category === 'Cycling' ? 'לאתר קבוצת רכיבה ומאמן ראשי' : 'לאתר מועדון טריאתלון (ללא החרגה לפני בדיקת לב-ארי)');
      const nextActEn = category === 'Running'
        ? 'Identify candidate running group & head coach'
        : (category === 'Cycling' ? 'Identify candidate cycling group & head coach' : 'Identify triathlon club (do not exclude before Lev-Ari reviews)');
      insertGroup.run(
        i, category, '', '',
        '', '', '', '',
        '', '', '', '',
        '', '', '', '',
        'Not researched', '', '', nextActHe, nextActEn, '', ''
      );
    }
  }

  return db;
}

function syncJsonSnapshot(db) {
  const metaRows = db.prepare('SELECT meta_key, meta_value FROM workbook_metadata').all();
  const metadata = {};
  for (const r of metaRows) metadata[r.meta_key] = r.meta_value;

  const tasks = db.prepare('SELECT * FROM tasks_v2 ORDER BY task_number ASC, id ASC').all();
  const schools = db.prepare(`
    SELECT * FROM schools_v2
    ORDER BY CASE record_type WHEN 'prospect' THEN 1 WHEN 'existing_relationship' THEN 2 ELSE 3 END, record_number ASC, id ASC
  `).all();
  const athleticGroups = db.prepare('SELECT * FROM athletic_groups_v2 ORDER BY slot_number ASC, id ASC').all();

  const totalTasks = tasks.length;
  const tasksInProgress = tasks.filter(t => t.status.toLowerCase() === 'in progress').length;
  const completedTasks = tasks.filter(t => t.status.toLowerCase() === 'completed' || t.status.toLowerCase() === 'done').length;
  const notStartedTasks = tasks.filter(t => t.status.toLowerCase() === 'not started').length;

  const prospectSchools = schools.filter(s => s.record_type === 'prospect');
  const schoolsResearched = prospectSchools.length;
  const outreachPrepared = schools.filter(
    s => (s.outreach_message_he && s.outreach_message_he.trim().length > 0) ||
         (s.outreach_message_en && s.outreach_message_en.trim().length > 0)
  ).length;

  const pendingSchoolApprovals = schools.filter(
    s => s.status.toLowerCase() === 'ready for approval' || s.status.toLowerCase() === 'pending approval'
  ).length;
  const pendingTaskApprovals = tasks.filter(
    t => t.status.toLowerCase() === 'ready for approval' || t.status.toLowerCase() === 'pending approval'
  ).length;
  const pendingGroupApprovals = athleticGroups.filter(
    g => g.status.toLowerCase() === 'ready for approval' || g.status.toLowerCase() === 'pending approval'
  ).length;

  const payload = {
    lastSyncedAt: new Date().toISOString(),
    metadata,
    tasks,
    schools,
    athleticGroups,
    summary: {
      totalTasks,
      tasksInProgress,
      completedTasks,
      notStartedTasks,
      pendingApprovals: pendingSchoolApprovals + pendingTaskApprovals + pendingGroupApprovals,
      pendingSchoolApprovals,
      pendingTaskApprovals,
      schoolsResearched,
      totalSchoolRecords: schools.length,
      outreachPrepared,
      athleticGroupsTotal: athleticGroups.length,
      athleticGroupsResearched: athleticGroups.filter(
        g => (g.club_organization_he && g.club_organization_he.trim().length > 0) ||
             (g.club_organization_en && g.club_organization_en.trim().length > 0)
      ).length
    }
  };

  const jsonStr = JSON.stringify(payload, null, 2);
  fs.writeFileSync(jsonDbPath, jsonStr, 'utf8');
  fs.writeFileSync(publicJsonDbPath, jsonStr, 'utf8');
  return payload;
}

if (require.main === module) {
  const db = initDatabase();
  syncJsonSnapshot(db);
  console.log('Bilingual Database & Cloud JSON Snapshot initialized successfully.');
}

module.exports = { initDatabase, syncJsonSnapshot, dbPath, jsonDbPath };
