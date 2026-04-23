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
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  // --- نظام تخزين البيانات محلياً (المتصفح) ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('finance_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('finance_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [currencies] = useState([
    { Currency_Code: 'EGP', Exchange_Rate_to_EGP: 1 },
    { Currency_Code: 'USD', Exchange_Rate_to_EGP: 48 },
    { Currency_Code: 'EUR', Exchange_Rate_to_EGP: 52 },
    { Currency_Code: 'SAR', Exchange_Rate_to_EGP: 12.8 },
    { Currency_Code: 'GBP', Exchange_Rate_to_EGP: 60 },
    { Currency_Code: 'AED', Exchange_Rate_to_EGP: 13.1 },
    { Currency_Code: 'GOLD', Exchange_Rate_to_EGP: 3100 }
  ]);

  // حفظ التغييرات تلقائياً
  useEffect(() => {
    localStorage.setItem('finance_accounts', JSON.stringify(accounts));
    localStorage.setItem('finance_transactions', JSON.stringify(transactions));
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
      const currency = currencies.find(c => c.Currency_Code === acc.Currency);
      const rate = currency ? currency.Exchange_Rate_to_EGP : 1;
      return total + (acc.Balance * rate);
    }, 0);
  };

  // --- دوال العمليات الأساسية ---
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
    
    // تحديث رصيد الحساب فوراً
    setAccounts(prev => prev.map(acc => {
      if (acc.ID === accId) {
        const change = type === 'Deposit' ? amount : -amount;
        return { ...acc, Balance: acc.Balance + change };
      }
      return acc;
    }));
    toast.success('تم تسجيل العملية وتحديث الرصيد');
  };

  const deleteAccount = (id: number) => {
    setAccounts(accounts.filter(a => a.ID !== id));
    setTransactions(transactions.filter(t => t.Account_ID !== id));
    toast.error('تم حذف الحساب وكافة عملياته');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
          <div className="text-center mb-8">
            <div className="inline-flex p-4 bg-blue-50 rounded-2xl text-blue-600 mb-4">
              <Wallet size={48} />
            </div>
            <h1 className="text-3xl font-black text-gray-900">نظام إدارة الثروة</h1>
            <p className="text-gray-500 mt-2">يرجى إدخال كلمة المرور للمتابعة</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 text-center font-bold text-2xl transition-all"
              placeholder="••••••••"
              autoFocus
            />
            {loginError && <p className="text-rose-500 text-sm font-bold text-center">❌ كلمة المرور غير صحيحة</p>}
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-2xl font-black text-xl shadow-lg shadow-blue-200 transition-all">دخول النظام</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar */}
      <aside className="w-72 bg-white border-l border-gray-200 flex flex-col no-print">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-100">
              <Banknote className="text-white w-7 h-7" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-blue-900">FinancePro</h1>
          </div>
          
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}><LayoutDashboard size={22}/> لوحة التحكم</button>
            <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'accounts' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}><Wallet size={22}/> إدارة الحسابات</button>
            <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-bold transition-all ${activeTab === 'transactions' ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-500 hover:bg-gray-50'}`}><History size={22}/> إدخال عمليات</button>
          </nav>
        </div>
        
        <div className="mt-auto p-8 border-t border-gray-50">
          <div className="bg-blue-50 p-6 rounded-3xl mb-6">
            <p className="text-xs text-blue-600 font-black uppercase tracking-widest mb-1">الإجمالي العام (ج.م)</p>
            <p className="text-2xl font-black text-blue-900">{formatNumber(calculateTotalBalanceEGP())}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-5 py-3 text-rose-600 font-black hover:bg-rose-50 rounded-xl transition-all">
            <ArrowUpRight className="rotate-45" size={20} /> خروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-10">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <h4 className="text-xl font-black mb-6 flex items-center gap-2"><TrendingUp className="text-emerald-500"/> توزيع الأصول</h4>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={accounts.map(a => ({ name: a.Name, value: Math.abs(a.Balance) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} paddingAngle={5}>
                        {accounts.map((_, index) => <Cell key={`cell-${index}`} fill={['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][index % 5]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                <h4 className="text-xl font-black mb-6 flex items-center gap-2"><History className="text-blue-500"/> آخر 5 عمليات</h4>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.ID} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                      <div>
                        <p className="font-bold text-gray-900">{t.AccountName}</p>
                        <p className="text-xs text-gray-400">{t.Date} - {t.Description}</p>
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
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
              <h3 className="text-2xl font-black mb-8">إضافة حساب بنكي أو خزينة</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <input id="accName" placeholder="اسم الحساب (مثلاً: بنك مصر)" className="px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold" />
                <select id="accType" className="px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold">
                  <option value="Bank">بنك (Bank)</option>
                  <option value="Safe">خزينة (Safe)</option>
                  <option value="Customer">عميل (Customer)</option>
                  <option value="Gold">ذهب (Gold)</option>
                </select>
                <select id="accCurr" className="px-5 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-bold">
                  {currencies.map(c => <option key={c.Currency_Code} value={c.Currency_Code}>{c.Currency_Code}</option>)}
                </select>
                <button 
                  onClick={() => {
                    const n = (document.getElementById('accName') as HTMLInputElement).value;
                    const t = (document.getElementById('accType') as HTMLSelectElement).value;
                    const c = (document.getElementById('accCurr') as HTMLSelectElement).value;
                    if(n) { addAccount(n, t, c); (document.getElementById('accName') as HTMLInputElement).value = ''; }
                  }}
                  className="bg-blue-600 text-white rounded-2xl font-black text-lg hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all"
                >+ إنشاء الحساب</button>
              </div>
            </div>

            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-8 py-5 font-black text-gray-500">اسم الحساب</th>
                    <th className="px-8 py-5 font-black text-gray-500">النوع</th>
                    <th className="px-8 py-5 font-black text-gray-500">العملة</th>
                    <th className="px-8 py-5 font-black text-gray-500">الرصيد الحالي</th>
                    <th className="px-8 py-5 font-black text-gray-500 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accounts.map(a => (
                    <tr key={a.ID} className="hover:bg-blue-50/30 transition-colors">
                      <td className="px-8 py-5 font-bold text-gray-900">{a.Name}</td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-black">{a.Type}</span></td>
                      <td className="px-8 py-5 font-bold text-blue-600">{a.Currency}</td>
                      <td className="px-8 py-5 font-black text-xl">{formatNumber(a.Balance)}</td>
                      <td className="px-8 py-5 text-center">
                        <button onClick={() => deleteAccount(a.ID)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="max-w-4xl mx-auto bg-white p-10 rounded-[2.5rem] border border-gray-100 shadow-xl">
            <h3 className="text-3xl font-black mb-10 text-center text-blue-900 underline decoration-blue-200 underline-offset-8">تسجيل حركة مالية جديدة</h3>
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 mr-2">اختر الحساب</label>
                  <select id="txAcc" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold text-lg transition-all">
                    {accounts.map(a => <option key={a.ID} value={a.ID}>{a.Name} ({a.Currency})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 mr-2">المبلغ / القيمة</label>
                  <input id="txAmt" type="number" placeholder="0.00" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-black text-xl transition-all" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 mr-2">نوع العملية</label>
                  <select id="txType" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none font-black text-lg">
                    <option value="Deposit" className="text-emerald-600">إيداع / إضافة (+)</option>
                    <option value="Withdrawal" className="text-rose-600">سحب / خصم (-)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-400 mr-2">البيان / الوصف</label>
                  <input id="txDesc" placeholder="مثلاً: دفعة توريد أو سحب نقدي" className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold transition-all" />
                </div>
              </div>

              <button 
                onClick={() => {
                  const accId = parseInt((document.getElementById('txAcc') as HTMLSelectElement).value);
                  const amt = parseFloat((document.getElementById('txAmt') as HTMLInputElement).value);
                  const type = (document.getElementById('txType') as HTMLSelectElement).value;
                  const desc = (document.getElementById('txDesc') as HTMLInputElement).value;
                  if(accId && amt) {
                    addTransaction(accId, amt, type, desc);
                    (document.getElementById('txAmt') as HTMLInputElement).value = '';
                    (document.getElementById('txDesc') as HTMLInputElement).value = '';
                  }
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-5 rounded-2xl font-black text-2xl shadow-xl shadow-emerald-100 transition-all transform active:scale-95"
              >تنفيذ وحفظ العملية</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}