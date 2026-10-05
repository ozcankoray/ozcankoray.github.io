import type { Localized } from '../i18n/localized';

export interface Profile {
  readonly name: string;
  readonly email: string;
  readonly site: string;
  readonly github: string;
  readonly linkedin: string;
  readonly roleMono: Localized;
  readonly intro: Localized;
  readonly about: readonly Localized[];
}

export const profile: Profile = {
  name: 'Koray Özcan',
  email: 'korayozcan33@gmail.com',
  site: 'https://korayozcan.me',
  github: 'https://github.com/ozcankoray',
  linkedin: 'https://www.linkedin.com/in/koray%C3%B6zcan/',
  roleMono: { tr: 'bilgisayar_mühendisi / istanbul', en: 'computer_engineer / istanbul' },
  intro: {
    tr: 'Sompo Sigorta’da test otomasyonu ve kalite mühendisi. Veri, finans ve iOS üzerine projeler geliştiriyorum.',
    en: 'Test automation & QA engineer at Sompo Sigorta. I build things around data, finance and iOS.',
  },
  about: [
    {
      tr: 'Bahçeşehir Üniversitesi’nde İngilizce Bilgisayar Mühendisliği okudum ve Ekonomi yan dalını tamamladım. Bugün Sompo Sigorta’da yazılım test otomasyonu ve kalite mühendisliği yapıyorum.',
      en: 'I studied Computer Engineering (in English) at Bahçeşehir University with a minor in Economics. Today I work on software test automation and quality engineering at Sompo Sigorta.',
    },
    {
      tr: 'En çok yazılımın finans ve veriyle kesiştiği yerde çalışmayı seviyorum: KAP fon raporlarını yapılandırılmış veriye çeviren bir pipeline, market fiyatlarından gıda enflasyonu hesaplayan bir veri projesi ve App Store’da yayında olan bir iOS uygulaması bu ilginin ürünleri.',
      en: 'I enjoy work where software meets finance and data. A pipeline that turns KAP fund reports into structured data, a project that measures food inflation from supermarket prices, and an iOS app live on the App Store all came out of that.',
    },
    {
      tr: 'Daha önce iş analizi, proje ve hizmet yönetimi, IoT ve makine öğrenmesi üzerine stajlar yaptım; BFRC’de ekonomi bülteni için yazılar yazdım.',
      en: 'Before that I interned across business analysis, project and service management, IoT and machine learning, and wrote for the economic bulletin at BFRC.',
    },
  ],
};
