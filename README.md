# Finance Manager Pro - دليل التشغيل والنشر

هذا التطبيق هو نظام متكامل لإدارة الثروة والأصول، تم بناؤه باستخدام **React** للواجهة الأمامية و **Node.js (Express)** للواجهة الخلفية مع قاعدة بيانات **SQLite**.

## 🚀 كيفية النشر على GitHub و Cloud

بما أن التطبيق يعتمد على Node.js، فإن أفضل طريقة لنشره هي استخدام منصات مثل **Render** أو **Railway** أو **DigitalOcean**. إذا كنت ترغب في استخدام **Streamlit Cloud**، فيجب ملاحظة أن Streamlit مخصصة لتطبيقات Python، بينما هذا التطبيق احترافي يعتمد على JavaScript/TypeScript.

### الخطوة 1: الرفع على GitHub
1. قم بإنشاء مستودع جديد (Repository) على GitHub باسم `finance-manager`.
2. في مجلد المشروع على جهازك، قم بتنفيذ الأوامر التالية:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Finance App Ready"
   git remote add origin https://github.com/YOUR_USERNAME/finance-manager.git
   git push -u origin main
   ```

### الخطوة 2: النشر على Render (البديل الأفضل لـ Node.js)
1. سجل دخولك في [Render.com](https://render.com).
2. اختر **New > Web Service**.
3. اربط حساب GitHub الخاص بك واختر مستودع `finance-manager`.
4. الإعدادات المطلوبة:
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `node server.ts` (أو `npm start`)
5. اضغط على **Deploy**. سيعطيك Render رابطاً خاصاً (مثل `finance-app.onrender.com`).

---

## 🛠 المتطلبات التقنية (Dependencies)

تم تثبيت المكتبات التالية لضمان عمل التطبيق بكفاءة:

### الواجهة الخلفية (Backend):
- `express`: خادم الويب.
- `better-sqlite3`: قاعدة بيانات سريعة وخفيفة.
- `cors`: للسماح بالاتصال بين الواجهة الأمامية والخلفية.
- `tsx`: لتشغيل ملفات TypeScript مباشرة.

### الواجهة الأمامية (Frontend):
- `react` & `lucide-react`: لبناء الواجهة والأيقونات.
- `recharts`: للرسوم البيانية التفاعلية.
- `sonner`: لنظام التنبيهات (Toast Notifications).
- `tailwind css`: للتنسيق الجمالي والاحترافي.

---

## 🔒 ملاحظات الأمان والأداء
- **كلمة المرور:** تم ضبطها على `Ahmed2026`.
- **قاعدة البيانات:** يتم إغلاق الاتصال بقاعدة البيانات تلقائياً عند توقف الخادم لضمان سلامة البيانات.
- **التنبيهات:** تظهر رسائل تأكيد خضراء عند كل عملية ناجحة (حفظ، حذف، تحديث) وتختفي تلقائياً.

تم تجهيز الكود ليكون **Production Ready** مع معالجة كافة التضاربات المحتملة.
