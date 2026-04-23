import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Plus, Wallet, ArrowUpRight, ArrowDownLeft, History, LayoutDashboard, 
  Coins, Banknote, AlertTriangle, TrendingUp, Search, 
  Printer, Filter, MoreVertical, ChevronRight, Settings, FileText, 
  Save, Trash2, Pencil, X, Users, ArrowLeft, UserPlus, Download
} from 'lucide-react';
import { Account, Transaction, Currency } from './types';
import { 
  Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend 
} from 'recharts';

// مساعدات التنسيق الأساسية
const formatNumber = (amount: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

const getAccountLabel = (a: Account) => {
  return `${a.Name} - ${a.Type} (${a.Currency})`;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'transactions' | 'settings' | 'reports' | 'customers'>('dashboard');

  // --- إدارة البيانات محلياً (بديل السيرفر لضمان عمل Vercel) ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('fin_accounts_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_transactions_v2');
    return saved ? JSON.parse(saved) : [];
  });

  const [currencies, setCurrencies] = useState<Currency[]>([
    { Currency_Code: 'EGP', Exchange_Rate_to_EGP: 1 },
    { Currency_Code: 'USD', Exchange_Rate_to_EGP: 48 },
    { Currency_Code: 'EUR', Exchange_Rate_to_EGP: 52 },
    { Currency_Code: 'SAR', Exchange_Rate_to_EGP: 12.8 },
    { Currency_Code: 'GBP', Exchange_Rate_to_EGP: 60 },
    { Currency_Code: 'AED', Exchange_Rate_to_EGP: 13.1 },
    { Currency_Code: 'GOLD', Exchange_Rate_to_EGP: 3100 }
  ]);

  // حفظ تلقائي للبيانات عند أي تغيير
  useEffect(() => {
    localStorage.setItem('fin_accounts_v2', JSON.stringify(accounts));
    localStorage.setItem('fin_transactions_v2', JSON.stringify(transactions));
  }, [accounts, transactions]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "Ahmed2026") {
      setIsAuthenticated(true);
      localStorage.setItem('is_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('is_auth');
  };

  const calculateTotalBalanceEGP = () => {
    return accounts.reduce((total, acc) => {
      const curr = currencies.find(c => c.Currency_Code === acc.Currency);
      const rate = curr ? curr.Exchange_Rate_to_EGP : 1;
      return total + (acc.Balance * rate);
    }, 0);
  };

  // دوال الحسابات والعمليات
  const addAccount = (name: string, type: string, currency: string) => {
    const newAcc: Account = {
      ID: Date.now(),
      Name: name,
      Type: type as any,
      Currency: currency,
      Balance: 0,
      Minimum_Balance: 0,
      Category: 'Personal'
    };
    setAccounts([...accounts, newAcc]);
    toast.success('تم إنشاء الحساب بنجاح');
  };

  const addTransaction = (accId: number, amount: number, type: string, desc: string, weight?: number, karat?: number) => {
    const account = accounts.find(a => a.ID === accId);
    if (!account) return;

    const newTx: Transaction = {
      ID: Date.now(),
      Account_ID: accId,
      AccountName: account.Name,
      Amount: amount,
      Type: type as any,
      Description: desc,
      Date: new Date().toISOString().split('T')[0],
      Currency: account.Currency,
      Gold_Weight: weight,
      Gold_Karat: karat
    };

    setTransactions([newTx, ...transactions]);
    setAccounts(prev => prev.map(acc => {
      if (acc.ID === accId) {
        const change = type === 'Deposit' ? amount : -amount;
        return { ...acc, Balance: acc.Balance + change };
      }
      return acc;
    }));
    toast.success('تم تسجيل العملية وتحديث الرصيد');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-[2rem] shadow-2xl p-10 border border-gray-100">
          <div className="text-center mb-10">
            <div className="inline-flex p-5 bg-blue-50 rounded-3xl text-blue-600 mb-4">
              <Wallet size={52} />
            </div>
            <h1 className="text-3xl font-black text-gray-900">نظام إدارة الثروة</h1>
            <p className="text-gray-400 mt-2 font-bold italic">Private Finance System</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 text-center font-bold text-2xl"
              placeholder="••••••••"
              autoFocus
            />
            {loginError && <p className="text-rose-500 font-bold text-sm text-center">❌ كلمة المرور غير صحيحة</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all">دخول النظام</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A]" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* القائمة الجانبية */}
      <aside className="w-72 bg-white border-l border-gray-200 flex flex-col no-print">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2 rounded-xl"><Banknote className="text-white w-7 h-7" /></div>
            <h1 className="text-2xl font-black text-blue-900">FinancePro</h1>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={22}/> },
              { id: 'accounts', label: 'إدارة الحسابات', icon: <Wallet size={22}/> },
              { id: 'transactions', label: 'إدخال عمليات', icon: <History size={22}/> },
              { id: 'settings', label: 'الإعدادات', icon: <Settings size={22}/> }
            ].map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="mt-auto p-8 border-t border-gray-50">
          <div className="bg-blue-50 p-6 rounded-[2rem] mb-6 text-center">
            <p className="text-[10px] text-blue-600 font-black uppercase mb-1">إجمالي الثروة (ج.م)</p>
            <p className="text-2xl font-black text-blue-900">{formatNumber(calculateTotalBalanceEGP())}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-3 px-6 py-3 text-rose-600 font-black hover:bg-rose-50 rounded-xl transition-all">خروج</button>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 overflow-y-auto p-10 font-sans">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <h2 className="text-3xl font-black text-gray-900">مرحباً أحمد 👋</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-xl font-black mb-6">توزيع الأرصدة</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={accounts.map(a => ({ name: a.Name, value: Math.abs(a.Balance) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={5}>
                        {accounts.map((_, index) => <Cell key={index} fill={['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][index % 5]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-xl font-black mb-6">آخر العمليات</h4>
                <div className="space-y-4">
                  {transactions.slice(0, 6).map(t => (
                    <div key={t.ID} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div>
                        <p className="font-bold text-gray-900">{t.AccountName}</p>
                        <p className="text-[10px] text-gray-400 font-bold">{t.Date} • {t.Description}</p>
                      </div>
                      <span className={`text-lg font-black ${t.Type === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.Type === 'Deposit' ? '+' : '-'}{formatNumber(t.Amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-black mb-8 flex items-center gap-3"><Plus className="text-blue-600"/> إضافة حساب مالي</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <input id="aName" placeholder="اسم الحساب (مثلاً: بنك مصر)" className="px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold" />
                <select id="aType" className="px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold">
                  <option value="Bank">Bank (بنك)</option>
                  <option value="Safe">Safe (خزينة)</option>
                  <option value="Gold">Gold (ذهب)</option>
                  <option value="Customer">Customer (عميل)</option>
                </select>
                <select id="aCurr" className="px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold">
                  {currencies.map(c => <option key={c.Currency_Code} value={c.Currency_Code}>{c.Currency_Code}</option>)}
                </select>
                <button 
                  onClick={() => {
                    const n = (document.getElementById('aName') as HTMLInputElement).value;
                    const t = (document.getElementById('aType') as HTMLSelectElement).value;
                    const c = (document.getElementById('aCurr') as HTMLSelectElement).value;
                    if(n) { addAccount(n, t, c); (document.getElementById('aName') as HTMLInputElement).value = ''; }
                  }}
                  className="bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                >إنشاء الحساب</button>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="px-8 py-5 font-black text-gray-500">اسم الحساب</th>
                    <th className="px-8 py-5 font-black text-gray-500">النوع</th>
                    <th className="px-8 py-5 font-black text-gray-500">العملة</th>
                    <th className="px-8 py-5 font-black text-gray-500">الرصيد الحالي</th>
                    <th className="px-8 py-5 font-black text-gray-500 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accounts.map(a => (
                    <tr key={a.ID} className="hover:bg-gray-50 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-900">{a.Name}</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-black">{a.Type}</span></td>
                      <td className="px-8 py-5 font-bold text-gray-400">{a.Currency}</td>
                      <td className={`px-8 py-5 font-black text-xl ${a.Balance < 0 ? 'text-rose-600' : 'text-gray-900'}`}>{formatNumber(a.Balance)}</td>
                      <td className="px-8 py-5 text-center">
                        <button onClick={() => setAccounts(accounts.filter(acc => acc.ID !== a.ID))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-xl"><Trash2 size={20}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="max-w-4xl mx-auto bg-white p-12 rounded-[3rem] border border-gray-100 shadow-2xl">
            <h3 className="text-3xl font-black mb-12 text-center text-blue-900 underline decoration-blue-200 underline-offset-8">تسجيل حركة مالية جديدة</h3>
            <div className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 mr-2 uppercase">اختر الحساب</label>
                  <select id="txA" className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-black text-xl transition-all">
                    {accounts.map(a => <option key={a.ID} value={a.ID}>{a.Name} ({a.Currency})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 mr-2 uppercase">المبلغ / القيمة</label>
                  <input id="txM" type="number" placeholder="0.00" className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-black text-3xl text-center" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 mr-2 uppercase">نوع العملية</label>
                  <select id="txT" className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-black text-xl">
                    <option value="Deposit" className="text-emerald-600 font-black">إيداع / إضافة (+)</option>
                    <option value="Withdrawal" className="text-rose-600 font-black">سحب / خصم (-)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 mr-2 uppercase">البيان / الوصف</label>
                  <input id="txD" placeholder="مثلاً: دفعة توريد أو سحب نقدي" className="w-full px-6 py-5 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold" />
                </div>
              </div>
              <button 
                onClick={() => {
                  const id = parseInt((document.getElementById('txA') as HTMLSelectElement).value);
                  const m = parseFloat((document.getElementById('txM') as HTMLInputElement).value);
                  const t = (document.getElementById('txT') as HTMLSelectElement).value;
                  const d = (document.getElementById('txD') as HTMLInputElement).value;
                  if(id && m) {
                    addTransaction(id, m, t, d);
                    (document.getElementById('txM') as HTMLInputElement).value = '';
                    (document.getElementById('txD') as HTMLInputElement).value = '';
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl shadow-emerald-50 hover:scale-[1.01] active:scale-95 transition-all transform"
              >تنفيذ وحفظ الحركة</button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-12 rounded-[3rem] border border-gray-100 shadow-sm">
            <h3 className="text-2xl font-black mb-10 flex items-center gap-3 text-blue-900"><Coins className="text-blue-600"/> إدارة أسعار الصرف والذهب</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {currencies.map(curr => (
                <div key={curr.Currency_Code} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 transition-all hover:bg-white hover:shadow-xl">
                  <p className="text-[10px] font-black text-gray-400 mb-3 uppercase tracking-widest text-center">{curr.Currency_Code} مقابل الجنيه</p>
                  <input 
                    type="number" 
                    value={curr.Exchange_Rate_to_EGP} 
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setCurrencies(prev => prev.map(c => c.Currency_Code === curr.Currency_Code ? {...c, Exchange_Rate_to_EGP: val} : c));
                    }}
                    className="w-full bg-white border-2 border-gray-100 rounded-2xl py-4 font-black text-2xl text-center text-blue-600 outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>
            <div className="mt-12 p-8 bg-amber-50 rounded-[2rem] border border-amber-100 text-amber-900 text-sm font-bold flex items-center gap-4">
              <AlertTriangle className="text-amber-500" size={24}/>
              تنبيه: أي تغيير في أسعار الصرف سيؤثر فوراً على حساب "إجمالي الثروة" المعروض في النظام. يتم تخزين هذه البيانات محلياً.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
