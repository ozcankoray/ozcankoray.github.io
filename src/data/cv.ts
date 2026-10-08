import type { Localized } from '../i18n/localized';

export interface Experience {
  readonly id: string;
  readonly role: Localized;
  readonly company: string;
  readonly kind: 'full-time' | 'internship' | 'part-time';
  readonly start: string;
  readonly end: string | null;
  readonly bullets: readonly Localized[];
  readonly tags: readonly string[];
}

export interface Education {
  readonly degree: Localized;
  readonly school: Localized;
  readonly start: string;
  readonly end: string;
  readonly gpa: string;
}

export interface SpokenLanguage {
  readonly name: Localized;
  readonly level: Localized;
}

export const KIND_LABEL: Readonly<Record<Experience['kind'], Localized>> = {
  'full-time': { tr: 'Tam zamanlı', en: 'Full-time' },
  internship: { tr: 'Staj', en: 'Internship' },
  'part-time': { tr: 'Yarı zamanlı', en: 'Part-time' },
};

export const experience: readonly Experience[] = [
  {
    id: 'sompo-qa',
    role: { tr: 'Junior Yazılım Test Otomasyonu ve Kalite Mühendisi', en: 'Junior Software Test Automation & Quality Engineer' },
    company: 'Sompo Sigorta',
    kind: 'full-time',
    start: '2026-08',
    end: null,
    bullets: [
      {
        tr: 'İç ve dış uygulamalar için Selenium ve Playwright ile test otomasyonu geliştiriyorum.',
        en: 'Automate tests for internal and external applications with Selenium and Playwright.',
      },
      {
        tr: 'Test kodunu Java ile yazıyorum; hataları ve işleri Jira’da takip ediyorum.',
        en: 'Write test code in Java and track defects and tasks in Jira.',
      },
    ],
    tags: ['test automation', 'selenium', 'playwright', 'java', 'jira'],
  },
  {
    id: 'odeal-ba',
    role: { tr: 'İş Analisti', en: 'Business Analyst' },
    company: 'Ödeal',
    kind: 'internship',
    start: '2026-04',
    end: '2026-07',
    bullets: [
      {
        tr: 'Odoo ERP özelleştirmeleri dahil süreç iyileştirme projeleri için İş Gereksinim Dokümanları (BRD) hazırladım ve gözden geçirdim.',
        en: 'Prepared and reviewed Business Requirements Documents (BRDs) for process improvement initiatives, including Odoo ERP customizations.',
      },
      {
        tr: 'UAT senaryolarını yönettim, kullanıcı geri bildirimlerini değerlendirdim ve iç/dış uygulamaların doğrulanmasına destek oldum.',
        en: 'Managed UAT scenarios, evaluated user feedback and supported validation of internal/external applications.',
      },
      {
        tr: 'Departman bazında ihtiyaç analizleri yaptım, dijital iş akışı iyileştirmeleri için fonksiyonel taslaklar hazırladım.',
        en: 'Conducted departmental needs analysis and prepared functional drafts for digital workflow optimization.',
      },
      {
        tr: 'Agile bir ortamda iş ve teknik ekiplerle çalıştım; gereksinim takibi ve dokümantasyon için Jira ve Confluence kullandım.',
        en: 'Worked with business and technical teams in an Agile environment using Jira and Confluence for requirement tracking and documentation.',
      },
    ],
    tags: ['business analysis', 'uat', 'odoo', 'jira'],
  },
  {
    id: 'kontrolmatik-swe',
    role: { tr: 'Yazılım Mühendisi', en: 'Software Engineer' },
    company: 'Kontrolmatik Technologies',
    kind: 'internship',
    start: '2025-09',
    end: '2025-12',
    bullets: [
      {
        tr: 'ThingsBoard ile kritik sensör verilerini gösteren gerçek zamanlı bir IoT panosunun geliştirilmesinde yer aldım.',
        en: 'Co-engineered a real-time IoT dashboard using ThingsBoard to visualize critical sensor data.',
      },
      {
        tr: 'Flutter ile UI/UX ilkelerini ön planda tutan duyarlı bir mobil uygulama arayüzü prototipledim.',
        en: 'Prototyped a responsive mobile app interface with Flutter, prioritizing UI/UX best practices.',
      },
      {
        tr: 'Yapay zekâ tabanlı bir kamera tanıma sisteminin ML iş akışlarını iyileştirerek veri işleme verimliliğini artırdım.',
        en: 'Optimized ML workflows for an AI-based camera recognition system, boosting data processing efficiency.',
      },
      {
        tr: 'Roboflow’da 4.000+ görsellik bir veri setini derleyip etiketledim; bu, model doğruluğunu doğrudan artırdı.',
        en: 'Curated and annotated a 4,000+ image dataset in Roboflow, directly improving model accuracy.',
      },
    ],
    tags: ['thingsboard', 'flutter', 'machine learning', 'roboflow'],
  },
  {
    id: 'eclit-psm',
    role: { tr: 'Proje ve Hizmet Yönetimi', en: 'Project & Service Management' },
    company: 'Eclit',
    kind: 'internship',
    start: '2025-04',
    end: '2025-08',
    bullets: [
      {
        tr: '30+ kurumsal müşterinin hizmet teslimini SLA’lara bağlı kalarak koordine ettim.',
        en: 'Coordinated service delivery for 30+ corporate clients, strictly adhering to SLAs and ensuring satisfaction.',
      },
      {
        tr: 'Görev takibini iyileştirip yönetim dokümantasyonunu standartlaştırarak proje süreçlerini sadeleştirdim.',
        en: 'Streamlined project lifecycles by optimizing task tracking and standardizing documentation for management.',
      },
      {
        tr: 'İş süreçlerini analiz ederek darboğazları belirledim ve operasyonel akışı iyileştirdim.',
        en: 'Analyzed business processes to identify bottlenecks and enhance operational workflow.',
      },
      {
        tr: 'ConnectWise üzerinden olay çözümlerini yönettim, proje kayıtlarında veri doğruluğunu sağladım.',
        en: 'Managed incident resolution via ConnectWise, ensuring high data accuracy in project ticketing.',
      },
    ],
    tags: ['project management', 'itsm', 'connectwise'],
  },
  {
    id: 'bfrc-ra',
    role: { tr: 'Öğrenci Araştırma Asistanı', en: 'Student Research Assistant' },
    company: 'BFRC — Bahçeşehir University Financial Research Center',
    kind: 'part-time',
    start: '2025-01',
    end: '2026-06',
    bullets: [
      {
        tr: 'Dönemsel ekonomi bülteni için ekonomik beklentiler ve piyasa eğilimleri üzerine veriye dayalı yazılar yazdım.',
        en: 'Authored data-driven articles on economic expectations and market trends for the periodic economic bulletin.',
      },
      {
        tr: 'Öğretim üyelerinin yürüttüğü araştırma projelerinde çalıştım; karmaşık makroekonomik verileri uygulanabilir içgörülere dönüştürdüm.',
        en: 'Collaborated on faculty-led research projects, translating complex macroeconomic data into actionable insights.',
      },
    ],
    tags: ['financial analysis', 'macroeconomics'],
  },
  {
    id: 'sompo-itgov',
    role: { tr: 'BT Yönetişimi', en: 'IT Governance' },
    company: 'Sompo Sigorta',
    kind: 'internship',
    start: '2024-09',
    end: '2024-10',
    bullets: [
      {
        tr: 'BT yönetişimi çerçevesinde kurumsal ölçekli yapay zekâ projelerinin fizibilite analizlerine katkı verdim.',
        en: 'Contributed to feasibility analysis of enterprise-level AI projects within the IT governance framework.',
      },
      {
        tr: 'Departmanların dijital dönüşüm süreçlerine uyumu için toplantıları yürüttüm.',
        en: 'Facilitated meetings to align departments with digital transformation protocols.',
      },
      {
        tr: 'Yapay zekâ teknolojileri üzerine araştırma yapıp BT ekip liderlerine uygulanabilir öneriler sundum.',
        en: 'Conducted research on Artificial Intelligence technologies and presented actionable insights to IT team leaders.',
      },
    ],
    tags: ['ai', 'it governance'],
  },
];

export const jobs: readonly Experience[] = experience.filter((x) => x.kind !== 'internship');
export const internships: readonly Experience[] = experience.filter((x) => x.kind === 'internship');

export const education: readonly Education[] = [
  {
    degree: { tr: 'Bilgisayar Mühendisliği (İngilizce), Lisans', en: 'B.Sc. Computer Engineering (English)' },
    school: { tr: 'Bahçeşehir Üniversitesi', en: 'Bahçeşehir University' },
    start: '2022',
    end: '2026',
    gpa: '3.27',
  },
  {
    degree: { tr: 'Ekonomi (İngilizce), Yan Dal', en: 'Minor in Economics (English)' },
    school: { tr: 'Bahçeşehir Üniversitesi', en: 'Bahçeşehir University' },
    start: '2024',
    end: '2026',
    gpa: '3.50',
  },
];

export const programs: readonly Localized[] = [
  { tr: 'YÖK Veri Analizi Okulu — Yapay Zekâ Bölümü', en: 'YÖK Data Analysis School — Artificial Intelligence Department' },
  { tr: 'TÖDEB & Marmara Üniversitesi “Fintek Çırağı” Programı', en: 'TÖDEB & Marmara University “Fintech Apprentice” Program' },
];

export const skills: readonly string[] = [
  'Python', 'Java', 'C++', 'SQL', 'Test Automation', 'Selenium', 'Playwright', 'Deep Learning', 'Agile', 'Jira', 'Confluence', 'Documentation',
];

export const languages: readonly SpokenLanguage[] = [
  { name: { tr: 'Türkçe', en: 'Turkish' }, level: { tr: 'Anadil', en: 'Native' } },
  { name: { tr: 'İngilizce', en: 'English' }, level: { tr: 'C1', en: 'C1' } },
];
