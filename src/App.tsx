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
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
} from 'recharts';

// --- مساعدات التنسيق ---
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
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // --- إدارة البيانات عبر LocalStorage (بديل السيرفر لـ Vercel) ---
  const [accounts, setAccounts] = useState<Account[]>(() => {
    const saved = localStorage.getItem('fin_accounts');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('fin_transactions');
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

  // حفظ تلقائي عند أي تغيير
  useEffect(() => {
    localStorage.setItem('fin_accounts', JSON.stringify(accounts));
    localStorage.setItem('fin_transactions', JSON.stringify(transactions));
  }, [accounts, transactions]);

  // --- وظائف النظام ---
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
      return total + (acc.Balance * (curr?.Exchange_Rate_to_EGP || 1));
    }, 0);
  };

  // إضافة حساب جديد
  const handleAddAccount = (name: string, type: string, currency: string, category: string) => {
    const newAcc: Account = {
      ID: Date.now(),
      Name: name,
      Type: type as any,
      Currency: currency,
      Balance: 0,
      Minimum_Balance: 0,
      Category: category as any
    };
    setAccounts([...accounts, newAcc]);
    toast.success('تمت إضافة الحساب بنجاح');
  };

  // تسجيل عملية جديدة
  const handleAddTransaction = (accId: number, amount: number, type: 'Deposit' | 'Withdrawal', desc: string, weight?: number, karat?: number) => {
    const account = accounts.find(a => a.ID === accId);
    if (!account) return;

    const newTx: Transaction = {
      ID: Date.now(),
      Account_ID: accId,
      AccountName: account.Name,
      Amount: amount,
      Type: type,
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
    toast.success('تم تسجيل العملية بنجاح');
  };

  const deleteTransaction = (id: number) => {
    const tx = transactions.find(t => t.ID === id);
    if (!tx) return;

    setAccounts(prev => prev.map(acc => {
      if (acc.ID === tx.Account_ID) {
        const revert = tx.Type === 'Deposit' ? -tx.Amount : tx.Amount;
        return { ...acc, Balance: acc.Balance + revert };
      }
      return acc;
    }));
    setTransactions(prev => prev.filter(t => t.ID !== id));
    toast.error('تم حذف العملية وتعديل الرصيد');
  };

  // --- الواجهات ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100 text-center">
          <div className="bg-blue-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-blue-600">
            <Wallet size={40} />
          </div>
          <h1 className="text-2xl font-black mb-2">نظام إدارة الثروة</h1>
          <p className="text-gray-400 mb-8 font-bold">يرجى إدخال كلمة المرور</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 text-center font-bold text-xl"
              placeholder="••••••••"
              autoFocus
            />
            {loginError && <p className="text-rose-500 font-bold text-sm">❌ الباسورد غير صحيح</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg shadow-lg shadow-blue-100">دخول النظام</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col no-print">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Banknote /></div>
            <h1 className="text-xl font-bold tracking-tight">FinancePro</h1>
          </div>
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}><LayoutDashboard size={20}/> لوحة التحكم</button>
            <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'accounts' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}><Wallet size={20}/> إدارة الحسابات</button>
            <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'transactions' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}><History size={20}/> إدخال عمليات</button>
            <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}`}><Settings size={20}/> الإعدادات</button>
          </nav>
        </div>
        <div className="mt-auto p-6 border-t border-gray-100">
          <div className="bg-blue-50 p-4 rounded-2xl mb-4">
            <p className="text-[10px] text-blue-600 font-black uppercase mb-1">إجمالي الثروة (ج.م)</p>
            <p className="text-xl font-black">{formatNumber(calculateTotalBalanceEGP())}</p>
          </div>
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2 text-rose-600 font-bold hover:bg-rose-50 rounded-lg transition-colors">خروج</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            <header className="flex justify-between items-center">
              <h2 className="text-3xl font-black">نظرة عامة</h2>
              <div className="text-gray-400 font-bold">{new Date().toLocaleDateString('ar-EG')}</div>
            </header>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold mb-6">توزيع الأصول</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={accounts.map(a => ({ name: a.Name, value: Math.abs(a.Balance) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={60} paddingAngle={5}>
                        {accounts.map((_, i) => <Cell key={i} fill={['#2563EB', '#10B981', '#F59E0B', '#8B5CF6'][i % 4]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                <h4 className="text-lg font-bold mb-6">آخر 5 عمليات</h4>
                <div className="space-y-4">
                  {transactions.slice(0, 5).map(t => (
                    <div key={t.ID} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-bold text-sm">{t.AccountName}</p>
                        <p className="text-[10px] text-gray-400">{t.Date} - {t.Description}</p>
                      </div>
                      <span className={`font-black ${t.Type === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.Type === 'Deposit' ? '+' : '-'}{formatNumber(t.Amount)} {t.Currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h3 className="text-xl font-black mb-6">إضافة حساب / خزينة</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <input id="accN" placeholder="اسم الحساب" className="px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:border-blue-500 font-bold" />
                <select id="accT" className="px-4 py-3 bg-gray-50 border rounded-xl outline-none font-bold">
                  <option value="Bank">Bank (بنك)</option>
                  <option value="Safe">Safe (خزينة)</option>
                  <option value="Customer">Customer (عميل)</option>
                  <option value="Gold">Gold (ذهب)</option>
                </select>
                <select id="accC" className="px-4 py-3 bg-gray-50 border rounded-xl outline-none font-bold">
                  {currencies.map(c => <option key={c.Currency_Code} value={c.Currency_Code}>{c.Currency_Code}</option>)}
                </select>
                <button 
                  onClick={() => {
                    const n = (document.getElementById('accN') as HTMLInputElement).value;
                    const t = (document.getElementById('accT') as HTMLSelectElement).value;
                    const c = (document.getElementById('accC') as HTMLSelectElement).value;
                    if(n) handleAddAccount(n, t, c, 'Personal');
                  }}
                  className="bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700"
                >إنشاء</button>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-right">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="p-4 font-black text-gray-500">الحساب</th>
                    <th className="p-4 font-black text-gray-500">النوع</th>
                    <th className="p-4 font-black text-gray-500">العملة</th>
                    <th className="p-4 font-black text-gray-500">الرصيد</th>
                    <th className="p-4 font-black text-gray-500 text-center">حذف</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(a => (
                    <tr key={a.ID} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-bold">{a.Name}</td>
                      <td className="p-4 text-xs font-black text-blue-600">{a.Type}</td>
                      <td className="p-4 font-bold text-gray-400">{a.Currency}</td>
                      <td className="p-4 font-black text-lg">{formatNumber(a.Balance)}</td>
                      <td className="p-4 text-center">
                        <button onClick={() => setAccounts(accounts.filter(acc => acc.ID !== a.ID))} className="text-rose-500 p-2 hover:bg-rose-50 rounded-lg"><Trash2 size={18}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="max-w-3xl mx-auto bg-white p-8 rounded-3xl border border-gray-200 shadow-xl">
            <h3 className="text-2xl font-black mb-8 text-center text-blue-900">تسجيل حركة مالية</h3>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select id="tAcc" className="px-4 py-4 bg-gray-50 border rounded-2xl outline-none font-bold">
                  {accounts.map(a => <option key={a.ID} value={a.ID}>{a.Name} ({a.Currency})</option>)}
                </select>
                <input id="tAmt" type="number" placeholder="المبلغ" className="px-4 py-4 bg-gray-50 border rounded-2xl outline-none font-black text-xl text-center" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <select id="tType" className="px-4 py-4 bg-gray-50 border rounded-2xl outline-none font-bold">
                  <option value="Deposit">إيداع / إضافة (+)</option>
                  <option value="Withdrawal">سحب / خصم (-)</option>
                </select>
                <input id="tDesc" placeholder="البيان" className="px-4 py-4 bg-gray-50 border rounded-2xl outline-none font-bold" />
              </div>
              <button 
                onClick={() => {
                  const id = parseInt((document.getElementById('tAcc') as HTMLSelectElement).value);
                  const amt = parseFloat((document.getElementById('tAmt') as HTMLInputElement).value);
                  const type = (document.getElementById('tType') as HTMLSelectElement).value as any;
                  const desc = (document.getElementById('tDesc') as HTMLInputElement).value;
                  if(id && amt) handleAddTransaction(id, amt, type, desc);
                }}
                className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black text-xl shadow-lg shadow-emerald-50 hover:bg-emerald-700 transition-all"
              >تنفيذ وحفظ العملية</button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-black mb-6">إعدادات النظام (أسعار الصرف)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currencies.map(curr => (
                <div key={curr.Currency_Code} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black text-gray-400 mb-2">{curr.Currency_Code} مقابل الجنيه</p>
                  <input 
                    type="number" 
                    value={curr.Exchange_Rate_to_EGP} 
                    onChange={(e) => {
                      const newRate = parseFloat(e.target.value);
                      setCurrencies(prev => prev.map(c => c.Currency_Code === curr.Currency_Code ? {...c, Exchange_Rate_to_EGP: newRate} : c));
                    }}
                    className="w-full bg-white border rounded-lg p-2 font-bold text-center"
                  />
                </div>
              ))}
            </div>
            <div className="mt-8 p-4 bg-blue-50 rounded-2xl text-blue-800 text-sm font-bold">
              ⚠️ يتم حفظ أسعار الصرف هذه محلياً وتستخدم لحساب إجمالي الثروة والذهب فوراً.
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
