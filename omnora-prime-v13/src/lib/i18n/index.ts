import { LanguageCode } from "@/stores/languageStore";

export type Dictionary = {
  nav: {
    dashboard: string;
    inventory: string;
    finance: string;
    payroll: string;
    cctv: string;
    generators: string;
    settings: string;
    import: string;
  };
  inventory: {
    stock: string;
    warehouse: string;
    skus: string;
    barcode: string;
    reorder: string;
  };
  finance: {
    ledger: string;
    receivables: string;
    payables: string;
    balance_sheet: string;
    profit_loss: string;
    invoice: string;
  };
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    search: string;
    loading: string;
  };
};

const en: Dictionary = {
  nav: {
    dashboard: "Dashboard",
    inventory: "Inventory",
    finance: "Finance",
    payroll: "Payroll",
    cctv: "Sentinel CCTV",
    generators: "Generators",
    settings: "Settings",
    import: "Smart Import"
  },
  inventory: {
    stock: "Current Stock",
    warehouse: "Warehouse",
    skus: "Product Catalog",
    barcode: "Scan Barcode",
    reorder: "Reorder Alerts"
  },
  finance: {
    ledger: "General Ledger",
    receivables: "Receivables",
    payables: "Payables",
    balance_sheet: "Balance Sheet",
    profit_loss: "Profit & Loss",
    invoice: "Tax Invoice"
  },
  common: {
    save: "Save Changes",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    search: "Search...",
    loading: "Synchronizing..."
  }
};

const ur: Partial<Dictionary> = {
  nav: {
    dashboard: "ڈیش بورڈ",
    inventory: "سٹاک مینجمنٹ",
    finance: "مالیات",
    payroll: "تنخواہیں",
    cctv: "کیمرے",
    generators: "ڈاکومنٹ جنریٹر",
    settings: "ترتیبات",
    import: "اسمارٹ امپورٹ"
  },
  inventory: {
    stock: "موجودہ مال",
    warehouse: "گودام",
    skus: "سامان کی فہرست",
    barcode: "بار کوڈ سکین",
    reorder: "ری آرڈر الرٹس"
  },
  finance: {
    ledger: "کھاتہ بک",
    receivables: "وصولی",
    payables: "ادائیگی",
    balance_sheet: "بیلنس شیٹ",
    profit_loss: "نفع و نقصان",
    invoice: "انوائس"
  },
  common: {
    save: "محفوظ کریں",
    cancel: "منسوخ",
    delete: "ختم کریں",
    edit: "تبدیل کریں",
    search: "تلاش کریں...",
    loading: "لوڈنگ ہو رہی ہے..."
  }
};

const ar: Partial<Dictionary> = {
  nav: {
    dashboard: "لوحة القيادة",
    inventory: "المخزون",
    finance: "المالية",
    payroll: "الرواتب",
    cctv: "المراقبة",
    generators: "المولدات",
    settings: "الإعدادات",
    import: "الاستيراد الذكي"
  },
  inventory: {
    stock: "المخزون الحالي",
    warehouse: "المستودع",
    skus: "كتالوج المنتجات",
    barcode: "مسح الباركود",
    reorder: "تنبيهات الطلب"
  },
  finance: {
    ledger: "دفتر الأستاذ",
    receivables: "المديونية",
    payables: "الدائنية",
    balance_sheet: "الميزانية العمومية",
    profit_loss: "الأرباح والخسائر",
    invoice: "فاتورة ضريبية"
  }
};

const hi: Partial<Dictionary> = {
  nav: {
    dashboard: "डैशबोर्ड",
    inventory: "इन्वेंटरी",
    finance: "वित्त",
    payroll: "पेरोल",
    cctv: "सीसीटीवी",
    generators: "जनरेटर",
    settings: "सेटिंग्स",
    import: "स्मार्ट आयात"
  },
  inventory: {
    stock: "वर्तमान स्टॉक",
    warehouse: "गोदाम",
    skus: "उत्पाद सूची",
    barcode: "बारकोड स्कैन",
    reorder: "रीऑर्डर अलर्ट"
  },
  finance: {
    ledger: "बही खाता",
    receivables: "प्राप्य",
    payables: "देय",
    balance_sheet: "तुलन पत्र",
    profit_loss: "लाभ और हानि",
    invoice: "टैक्स इनवॉइस"
  }
};

// Add other languages here...
const dictionaries: Record<LanguageCode, any> = {
  en, ur, ar, hi,
  bn: { nav: { dashboard: "ড্যাশবোর্ড", inventory: "ইনভেন্টরি" } },
  pa: { nav: { dashboard: "ਡੈਸ਼ਬੋਰਡ", inventory: "ਸਟਾਕ" } },
  zh: { nav: { dashboard: "仪表板", inventory: "库存" } },
  tr: { nav: { dashboard: "Panel", inventory: "Envanter" } },
  es: { nav: { dashboard: "Tablero", inventory: "Inventario" } },
  ru: { nav: { dashboard: "Панель", inventory: "Инвентарь" } },
  ta: { nav: { dashboard: "டாஷ்போர்டு", inventory: "சரக்கு" } },
  fr: { nav: { dashboard: "Tableau de bord", inventory: "Inventaire" } },
  fa: { nav: { dashboard: "داشبورد", inventory: "موجودی" } },
  de: { nav: { dashboard: "Dashboard", inventory: "Inventar" } },
};

export function getDictionary(lang: LanguageCode): Dictionary {
  const dict = dictionaries[lang] || en;
  
  // Use a deep copy of 'en' to avoid mutating the original constant
  return mergeDeep(JSON.parse(JSON.stringify(en)), dict) as Dictionary;
}

function mergeDeep(target: any, source: any) {
  const isObject = (obj: any) => obj && typeof obj === 'object';

  if (!isObject(target) || !isObject(source)) {
    return source;
  }

  Object.keys(source).forEach(key => {
    const targetValue = target[key];
    const sourceValue = source[key];

    if (Array.isArray(targetValue) && Array.isArray(sourceValue)) {
      target[key] = targetValue.concat(sourceValue);
    } else if (isObject(targetValue) && isObject(sourceValue)) {
      target[key] = mergeDeep({ ...targetValue }, sourceValue);
    } else {
      target[key] = sourceValue;
    }
  });

  return target;
}
