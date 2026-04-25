import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Plus, Wallet, ArrowUpRight, ArrowDownLeft, History, LayoutDashboard, 
  Coins, Banknote, AlertTriangle, TrendingUp, Search, 
  Printer, Filter, MoreVertical, ChevronRight, Settings, FileText, 
  Save, Trash2, Pencil, X, Users, ArrowLeft, UserPlus, Download, Share
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie, Legend
} from 'recharts';

// --- تضمين التايبس داخل الملف لمنع أخطاء الشاشة البيضاء ---
export interface Account {
  ID: number;
  Name: string;
  Type: 'Bank' | 'Safe' | 'Visa' | 'Customer' | 'Gold';
  Currency: string;
  Balance: number;
  Minimum_Balance: number;
  Category: 'Business' | 'Personal';
}

export interface Transaction {
  ID: number;
  Account_ID: number;
  AccountName: string;
  Amount: number;
  Type: 'Deposit' | 'Withdrawal';
  Description: string;
  Date: string;
  Currency: string;
  Gold_Weight?: number;
  Gold_Karat?: number;
}

export interface Currency {
  Currency_Code: string;
  Exchange_Rate_to_EGP: number;
}

const formatNumber = (amount: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'transactions' | 'settings' | 'customers' | 'reports'>('dashboard');

  // --- إدارة البيانات عبر LocalStorage لضمان العمل على Vercel ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('fin_v4_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_v4_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currencies, setCurrencies] = useState<Currency[]>([
    { Currency_Code: 'EGP', Exchange_Rate_to_EGP: 1 },
    { Currency_Code: 'USD', Exchange_Rate_to_EGP: 48.5 },
    { Currency_Code: 'EUR', Exchange_Rate_to_EGP: 52 },
    { Currency_Code: 'SAR', Exchange_Rate_to_EGP: 12.9 },
    { Currency_Code: 'AED', Exchange_Rate_to_EGP: 13.2 },
    { Currency_Code: 'GOLD', Exchange_Rate_to_EGP: 3100 }
  ]);

  useEffect(() => {
    localStorage.setItem('fin_v4_accounts', JSON.stringify(accounts));
    localStorage.setItem('fin_v4_transactions', JSON.stringify(transactions));
  }, [accounts, transactions]);

  // --- دالة حساب الإجمالي (تطرح الديون والفيزا تلقائياً) ---
  const calculateTotalBalanceEGP = () => {
    return accounts.reduce((total, acc) => {
      const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
      return total + (acc.Balance * rate);
    }, 0);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Ahmed2026") {
      setIsAuthenticated(true);
      localStorage.setItem('is_auth', 'true');
    } else {
      toast.error("الباسورد غير صحيح يا أحمد");
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 text-center animate-in fade-in zoom-in duration-500">
          <div className="bg-blue-600 w-24 h-24 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-white shadow-xl shadow-blue-200">
            <Wallet size={48} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 mb-2">خزنتي الخاصة</h1>
          <p className="text-gray-400 mb-10 font-bold tracking-wide uppercase text-xs">Security Dashboard v4.0</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-[1.5rem] outline-none focus:border-blue-600 text-center font-black text-3xl transition-all"
              placeholder="••••"
              autoFocus
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-5 rounded-[1.5rem] font-black text-xl shadow-2xl shadow-blue-200 active:scale-95 transition-all">فتح النظام</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-slate-900 font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar */}
      <aside className="w-80 bg-white border-l border-gray-200 flex flex-col no-print">
        <div className="p-8">
          <div className="flex items-center gap-4 mb-12">
            <div className="bg-blue-600 p-3 rounded-2xl text-white shadow-lg shadow-blue-100"><Banknote size={28} /></div>
            <div>
               <h1 className="text-2xl font-black tracking-tighter text-slate-900">FINANCE</h1>
               <p className="text-[10px] font-black text-blue-600 tracking-[0.3em] -mt-1 uppercase">Manager Pro</p>
            </div>
          </div>
          
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={w-full flex items-center gap-4 px-6 py-4 rounded-[1.2rem] font-black transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-gray-50'}}><LayoutDashboard size={22}/> لوحة التحكم</button>
            <button onClick={() => setActiveTab('accounts')} className={w-full flex items-center gap-4 px-6 py-4 rounded-[1.2rem] font-black transition-all ${activeTab === 'accounts' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-gray-50'}}><Wallet size={22}/> الحسابات</button>
            <button onClick={() => setActiveTab('customers')} className={w-full flex items-center gap-4 px-6 py-4 rounded-[1.2rem] font-black transition-all ${activeTab === 'customers' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-gray-50'}}><Users size={22}/> العملاء</button>
            <button onClick={() => setActiveTab('transactions')} className={w-full flex items-center gap-4 px-6 py-4 rounded-[1.2rem] font-black transition-all ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-gray-50'}}><History size={22}/> العمليات</button>
            <button onClick={() => setActiveTab('settings')} className={w-full flex items-center gap-4 px-6 py-4 rounded-[1.2rem] font-black transition-all ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'text-slate-400 hover:bg-gray-50'}}><Settings size={22}/> الإعدادات</button>
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-gray-50">
          <div className="bg-slate-900 p-6 rounded-[2rem] mb-6 shadow-2xl">
            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-2 text-center">إجمالي صافي الثروة</p>
            <p className={text-2xl font-black text-center tracking-tighter ${calculateTotalBalanceEGP() < 0 ? 'text-rose-500' : 'text-white'}}>
              {formatNumber(calculateTotalBalanceEGP())} <span className="text-xs font-bold text-slate-500">ج.م</span>
            </p>
          </div>
          <button onClick={() => { localStorage.removeItem('is_auth'); window.location.reload(); }} className="w-full py-4 text-rose-600 font-black hover:bg-rose-50 rounded-2xl transition-all">خروج</button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-[#F8F9FA] p-12">
{/* استكمال الجزء الثاني - تابع لـ main content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-center">
              <div>
                <h2 className="text-4xl font-black text-slate-900 mb-2">مرحباً أحمد 👋</h2>
                <p className="text-slate-400 font-bold">إليك ملخص الحالة المالية الحالية</p>
              </div>
              <div className="bg-white px-6 py-4 rounded-[1.5rem] shadow-sm border border-gray-100 font-black text-blue-600">
                {new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-xl font-black mb-8 flex items-center gap-2"><TrendingUp className="text-emerald-500"/> توزيع الأصول</h4>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={accounts.map(a => ({ name: a.Name, value: Math.abs(a.Balance) }))} 
                        dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={70} paddingAngle={5}
                      >
                        {accounts.map((_, i) => <Cell key={i} fill={['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][i % 5]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-xl font-black mb-8 flex items-center gap-2"><History className="text-blue-500"/> أحدث العمليات</h4>
                <div className="space-y-4">
                  {transactions.slice(0, 6).map(t => (
                    <div key={t.ID} className="flex justify-between items-center p-5 bg-gray-50 rounded-[1.5rem] border border-gray-100 group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                        <div className={p-3 rounded-xl ${t.Type === 'Deposit' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}}>
                          {t.Type === 'Deposit' ? <ArrowDownLeft size={20}/> : <ArrowUpRight size={20}/>}
                        </div>
                        <div>
                          <p className="font-black text-slate-900">{t.AccountName}</p>
                          <p className="text-[10px] text-gray-400 font-bold">{t.Date} • {t.Description}</p>
                        </div>
                      </div>
                      <span className={text-lg font-black ${t.Type === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}}>
                        {t.Type === 'Deposit' ? '+' : '-'}{formatNumber(t.Amount)}
                      </span>
                    </div>
                  ))}
                  {transactions.length === 0 && <p className="text-center py-10 text-gray-300 font-bold italic">لا توجد حركات مسجلة</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <AccountsView 
            accounts={accounts} 
            currencies={currencies} 
            onAdd={(n, t, c) => {
              const newAcc: Account = { ID: Date.now(), Name: n, Type: t as any, Currency: c, Balance: 0, Minimum_Balance: 0, Category: 'Personal' };
              setAccounts([...accounts, newAcc]);
              toast.success('تم إنشاء الحساب بنجاح');
            }}
            onDelete={(id) => setAccounts(accounts.filter(a => a.ID !== id))}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersView 
            accounts={accounts} 
            transactions={transactions}
            formatNumber={formatNumber}
          />
        )}
      </main>
    </div>
  );
}

// --- مكون صفحة العملاء (مع السيرش واللون الأخضر للموجب) ---
function CustomersView({ accounts, transactions, formatNumber }: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const customers = accounts.filter((acc: any) => acc.Type === 'Customer');
  
  const filteredCustomers = customers.filter((c: any) => 
    c.Name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">إدارة العملاء</h2>
          <p className="text-slate-400 font-bold">ابحث وتابع أرصدة عملائك بدقة</p>
        </div>
        
        <div className="relative w-full md:w-[450px]">
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-blue-500" size={24} />
          <input 
            type="text" 
            placeholder="ابحث عن اسم العميل..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pr-14 pl-6 py-5 bg-white border-2 border-transparent rounded-[2rem] shadow-xl shadow-blue-900/5 outline-none focus:border-blue-600 font-black text-lg transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCustomers.map((customer: any) => (
          <div key={customer.ID} className="bg-white p-8 rounded-[3rem] border border-gray-100 hover:border-blue-600 hover:shadow-2xl transition-all cursor-pointer group">
            <div className="flex justify-between items-start mb-8">
              <div className="space-y-1">
                <p className="font-black text-2xl text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{customer.Name}</p>
                <span className="inline-block text-[10px] bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-black tracking-widest">{customer.Currency}</span>
              </div>
              <div className="bg-blue-50 p-4 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                <Users size={28} />
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">صافي الرصيد</p>
                <p className={text-2xl font-black tracking-tighter ${customer.Balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}}>
                  {formatNumber(customer.Balance)}
                </p>
              </div>
            </div>
          </div>
        ))}
        {filteredCustomers.length === 0 && (
          <div className="col-span-full py-20 bg-white rounded-[3rem] border-2 border-dashed border-gray-100 text-center">
             <p className="text-gray-300 font-black text-2xl">لا يوجد عملاء يطابقون البحث</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- مكون إدارة الحسابات ---
function AccountsView({ accounts, currencies, onAdd, onDelete }: any) {
  return (
    <div className="space-y-10">
      <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm">
        <h3 className="text-2xl font-black mb-8">إنشاء حساب جديد</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <input id="accName" placeholder="اسم الحساب" className="px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-600 font-bold" />
          <select id="accType" className="px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold">
            <option value="Bank">Bank (بنك)</option>
            <option value="Safe">Safe (خزينة)</option>
            <option value="Visa">Visa (فيزا)</option>
            <option value="Gold">Gold (ذهب)</option>
            <option value="Customer">Customer (عميل)</option>
          </select>
          <select id="accCurr" className="px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold">
            {currencies.map((c: any) => <option key={c.Currency_Code} value={c.Currency_Code}>{c.Currency_Code}</option>)}
          </select>
          <button 
            onClick={() => {
              const n = (document.getElementById('accName') as HTMLInputElement).value;
              const t = (document.getElementById('accType') as HTMLSelectElement).value;
              const c = (document.getElementById('accCurr') as HTMLSelectElement).value;
              if(n) { onAdd(n, t, c); (document.getElementById('accName') as HTMLInputElement).value = ''; }
            }}
            className="bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg"
          >تأكيد الإضافة</button>
        </div>
      </div>
{/* استكمال الجزء الثالث والأخير - تابع لـ AccountsView وما بعدها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-10">
        {accounts.map((acc: any) => {
          const isNegative = acc.Balance < 0;
          const isSpecialAccount = acc.Type === 'Visa' || acc.Type === 'Safe' || acc.Type === 'Customer';
          return (
            <div key={acc.ID} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase">{acc.Name}</h4>
                  <p className="text-[10px] font-black text-gray-400 tracking-widest">{acc.Type} | {acc.Currency}</p>
                </div>
                <button onClick={() => onDelete(acc.ID)} className="text-gray-300 hover:text-rose-600 transition-colors"><Trash2 size={18}/></button>
              </div>
              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">الرصيد الحالي</p>
                <p className={text-2xl font-black tracking-tighter ${(isNegative && isSpecialAccount) ? 'text-rose-600' : 'text-slate-900'}}>
                  {formatNumber(acc.Balance)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- مكون تسجيل العمليات (مع ميزة النوافذ القابلة للتمرير Scrollable) ---
function TransactionsView({ accounts, onAddTransaction }: any) {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-black text-slate-900">سجل العمليات المالية</h2>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-blue-200 flex items-center gap-2 hover:bg-blue-700 transition-all"
        >
          <Plus size={20}/> إضافة عملية جديدة
        </button>
      </div>

      {/* نافذة إضافة عملية - تم جعلها قابلة للتمرير لضمان ظهور زر Save */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">تسجيل حركة مالية</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-slate-900"><X size={28}/></button>
            </div>
            
            {/* منطقة التمرير (The Scrollable Area) */}
            <div className="p-8 overflow-y-auto space-y-6 flex-1">
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase ml-2">اختر الحساب</label>
                <select id="txAcc" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-600 font-bold">
                  {accounts.map((a: any) => <option key={a.ID} value={a.ID}>{a.Name} ({a.Currency})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase ml-2">النوع</label>
                  <select id="txType" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold">
                    <option value="Deposit">إيداع (+)</option>
                    <option value="Withdrawal">سحب (-)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-slate-400 uppercase ml-2">المبلغ</label>
                  <input id="txAmount" type="number" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold text-lg" placeholder="0.00" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase ml-2">التاريخ</label>
                <input id="txDate" type="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-slate-400 uppercase ml-2">البيان / الملاحظات</label>
                <textarea id="txDesc" rows={3} className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" placeholder="اكتب تفاصيل العملية هنا..."></textarea>
              </div>
            </div>

            <div className="p-8 border-t border-gray-100">
              <button 
                onClick={() => {
                  const accId = Number((document.getElementById('txAcc') as HTMLSelectElement).value);
                  const type = (document.getElementById('txType') as HTMLSelectElement).value;
                  const amount = Number((document.getElementById('txAmount') as HTMLInputElement).value);
                  const date = (document.getElementById('txDate') as HTMLInputElement).value;
                  const desc = (document.getElementById('txDesc') as HTMLTextAreaElement).value;
                  if(amount > 0) {
                    onAddTransaction(accId, amount, type, date, desc);
                    setShowModal(false);
                    toast.success("تم حفظ العملية بنجاح يا أحمد");
                  }
                }}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-blue-700 transition-all active:scale-95"
              >
                حفظ العملية (SAVE)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- نهاية الكود ---