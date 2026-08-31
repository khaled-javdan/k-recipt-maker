// The app speaks Farsi and only Farsi. This replaces the old app's
// three-language switcher: one flat object, no provider, no context, no
// runtime lookup — just an import.

export const fa = {
  appName: "فاکتور ساز",

  auth: {
    signIn: "ورود",
    signInTitle: "ورود به حساب",
    signInSubtitle: "برای ادامه وارد حساب خود شوید",
    username: "نام کاربری",
    password: "رمز عبور",
    signOut: "خروج",
    invalid: "نام کاربری یا رمز عبور اشتباه است",
    inactive: "این حساب غیرفعال شده است",
    missingFields: "نام کاربری و رمز عبور را وارد کنید",
    signingIn: "در حال ورود…",
  },

  nav: {
    receipts: "فاکتورها",
    ledgers: "حساب‌ها",
    priceLists: "فیش مزاد",
    manReceipts: "فیش من",
    clients: "مشتریان",
    products: "محصولات",
    settings: "تنظیمات",
  },

  actions: {
    new: "جدید",
    add: "افزودن",
    save: "ذخیره",
    cancel: "انصراف",
    edit: "ویرایش",
    delete: "حذف",
    confirm: "تایید",
    back: "بازگشت",
    create: "ایجاد",
    update: "به‌روزرسانی",
    print: "چاپ",
    exportPdf: "خروجی PDF",
    exportImage: "خروجی تصویر",
    search: "جستجو…",
  },

  common: {
    name: "نام",
    phone: "تلفن",
    address: "آدرس",
    notes: "یادداشت",
    date: "تاریخ",
    total: "جمع",
    empty: "هنوز چیزی اینجا نیست",
    required: "الزامی",
    loading: "در حال بارگذاری…",
    error: "خطایی رخ داد",
  },
} as const

export type Fa = typeof fa
