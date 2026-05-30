export const GLOBAL_INDUSTRIES = {
  // Textile & Garment (largest global factory sector)
  textile: {
    en: 'Textile & Fabric',
    ur: 'کپڑا اور فیبرک',
    ar: 'النسيج والأقمشة',
    bn: 'বস্ত্র ও কাপড়',
    tr: 'Tekstil ve Kumaş',
    id: 'Tekstil dan Kain',
    vi: 'Dệt may và Vải',
    fr: 'Textile et Tissu',
  },
  garment: {
    en: 'Garment & Apparel',
    ur: 'گارمنٹ اور لباس',
    ar: 'الملابس والأزياء',
    bn: 'পোশাক ও পরিধেয়',
    tr: 'Giyim ve Hazır Giyim',
    id: 'Garmen dan Pakaian',
    vi: 'May mặc và Thời trang',
    fr: 'Confection et Prêt-à-porter',
  },
  rice_mill: {
    en: 'Rice Mill & Grain',
    ur: 'چاول مل اور اناج',
    ar: 'مطحنة الأرز والحبوب',
    bn: 'চাল কল ও শস্য',
    tr: 'Çeltik Değirmeni ve Tahıl',
    id: 'Penggilingan Padi dan Biji-bijian',
    vi: 'Xay xát gạo và Ngũ cốc',
    fr: 'Rizerie et Céréales',
  },
  pharma: {
    en: 'Pharmaceutical',
    ur: 'دوا ساز',
    ar: 'صناعة الأدوية',
    bn: 'ওষুধ শিল্প',
    tr: 'İlaç Sanayi',
    id: 'Farmasi',
    vi: 'Dược phẩm',
    fr: 'Pharmaceutique',
  },
  auto_parts: {
    en: 'Auto Parts & Engineering',
    ur: 'آٹو پارٹس اور انجینئرنگ',
    ar: 'قطع غيار السيارات والهندسة',
    bn: 'অটো পার্টস ও ইঞ্জিনিয়ারিং',
    tr: 'Otomobil Parçaları ve Mühendislik',
    id: 'Suku Cadang Otomotif dan Teknik',
    vi: 'Phụ tùng ô tô và Kỹ thuật',
    fr: 'Pièces Auto et Ingénierie',
  },
  food_processing: {
    en: 'Food Processing',
    ur: 'فوڈ پروسیسنگ',
    ar: 'تصنيع الأغذية',
    bn: 'خادym প্রক্রিয়াকরণ',
    tr: 'Gıda İşleme',
    id: 'Pengolahan Makanan',
    vi: 'Chế biến thực phẩm',
    fr: 'Transformation Alimentaire',
  },
  construction: {
    en: 'Construction Materials',
    ur: 'تعمیراتی سامان',
    ar: 'مواد البناء',
    bn: 'নির্মাণ সামগ্রী',
    tr: 'İnşaat Malzemeleri',
    id: 'Material Konstruksi',
    vi: 'Vật liệu xây dựng',
    fr: 'Matériaux de Construction',
  },
  leather: {
    en: 'Leather & Footwear',
    ur: 'چمڑا اور جوتا',
    ar: 'الجلود والأحذية',
    bn: 'চামড়া ও জুতা',
    tr: 'Deri ve Ayakkabı',
    id: 'Kulit dan Alas Kaki',
    vi: 'Da thuộc and Giày dép',
    fr: 'Cuir et Chaussures',
  },
}

// Get industry label in current language
export function getIndustryLabel(
  industryKey: string,
  langCode: string = 'en'
): string {
  const industry = GLOBAL_INDUSTRIES[
    industryKey as keyof typeof GLOBAL_INDUSTRIES
  ]
  if (!industry) return industryKey
  return industry[langCode as keyof typeof industry]
    || industry.en
}
