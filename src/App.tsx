import React, { useState, useEffect, useMemo } from 'react';
import { Toaster, toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  Plus, Wallet, ArrowUpRight, ArrowDownLeft, History, LayoutDashboard, 
  Coins, Banknote, AlertTriangle, TrendingUp, TrendingDown, Search, 
  Printer, Filter, MoreVertical, ChevronRight, Settings, FileText, 
  Save, Trash2, Pencil, X, Users, ArrowLeft, UserPlus, Download
} from 'lucide-react';
import { Account, Transaction, Currency } from './types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  Cell, PieChart, Pie, Legend 
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

  // تحميل البيانات من LocalStorage بدلاً من السيرفر
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

  const [activeTab, setActiveTab] = useState('dashboard');

  // حفظ البيانات تلقائياً عند أي تغيير
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

  // --- دوال الإضافة والحذف المحلية ---
  const addAccount = (newAcc: any) => {
    const accWithId = { ...newAcc, ID: Date.now(), Balance: 0 };
    setAccounts([...accounts, accWithId]);
    toast.success('تمت إضافة الحساب بنجاح');
  };

  const addTransaction = (newTx: any) => {
    const txWithId = { ...newTx, ID: Date.now() };
    setTransactions([txWithId, ...transactions]);
    
    // تحديث رصيد الحساب فوراً
    setAccounts(prev => prev.map(acc => {
      if (acc.ID === newTx.Account_ID) {
        const change = newTx.Type === 'Deposit' ? newTx.Amount : -newTx.Amount;
        return { ...acc, Balance: acc.Balance + change };
      }
      return acc;
    }));
    toast.success('تم تسجيل العملية بنجاح');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 space-y-8">
          <div className="text-center">
            <div className="inline-flex p-4 bg-blue-50 rounded-2xl text-blue-600 mb-2">
              <Wallet size={40} />
            </div>
            <h1 className="text-2xl font-black">نظام إدارة الثروة</h1>
            <p className="text-gray-500">ادخل كلمة المرور</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none text-center font-bold"
              placeholder="••••••••"
            />
            {loginError && <p className="text-rose-500 text-xs text-center">خطأ في كلمة المرور</p>}
            <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg">دخول</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A]" dir="rtl">
      <Toaster position="top-center" richColors />
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-l border-gray-200 flex flex-col no-print">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg"><Banknote className="text-white" /></div>
            <h1 className="text-xl font-bold">FinancePro</h1>
          </div>
          <nav className="space-y-2">
            <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}><LayoutDashboard size={20}/> لوحة التحكم</button>
            <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'accounts' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}><Wallet size={20}/> إدارة الحسابات</button>
            <button onClick={() => setActiveTab('transactions')} className={`w-full flex items-center gap-3 p-3 rounded-xl ${activeTab === 'transactions' ? 'bg-blue-50 text-blue-600' : 'text-gray-500'}`}><History size={20}/> إدخال عمليات</button>
          </nav>
          <button onClick={handleLogout} className="mt-10 w-full flex items-center gap-3 p-3 text-rose-600 font-bold">خروج</button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-8">
          <h2 className="text-3xl font-black">إجمالي الثروة: {formatNumber(calculateTotalBalanceEGP())} ج.م</h2>
        </header>

        {activeTab === 'accounts' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="text-xl font-bold mb-6">إضافة حساب جديد</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input id="accName" placeholder="اسم الحساب" className="p-3 border rounded-xl" />
              <select id="accCurr" className="p-3 border rounded-xl">
                {currencies.map(c => <option key={c.Currency_Code} value={c.Currency_Code}>{c.Currency_Code}</option>)}
              </select>
              <button 
                onClick={() => {
                  const name = (document.getElementById('accName') as HTMLInputElement).value;
                  const curr = (document.getElementById('accCurr') as HTMLSelectElement).value;
                  if(name) addAccount({ Name: name, Currency: curr, Type: 'Bank' });
                }}
                className="bg-blue-600 text-white rounded-xl font-bold"
              >إضافة الحساب</button>
            </div>
            <table className="w-full mt-8 text-right">
                <thead><tr className="border-b"><th>الاسم</th><th>العملة</th><th>الرصيد</th></tr></thead>
                <tbody>
                    {accounts.map(a => <tr key={a.ID} className="border-b"><td className="p-3">{a.Name}</td><td>{a.Currency}</td><td>{formatNumber(a.Balance)}</td></tr>)}
                </tbody>
            </table>
          </div>
        )}

        {activeTab === 'transactions' && (
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-xl font-bold mb-6">تسجيل عملية (إيداع/سحب)</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <select id="txAcc" className="p-3 border rounded-xl">
                        {accounts.map(a => <option key={a.ID} value={a.ID}>{a.Name}</option>)}
                    </select>
                    <input id="txAmt" type="number" placeholder="المبلغ" className="p-3 border rounded-xl" />
                    <select id="txType" className="p-3 border rounded-xl">
                        <option value="Deposit">إيداع (+)</option>
                        <option value="Withdrawal">سحب (-)</option>
                    </select>
                    <button 
                        onClick={() => {
                            const accId = parseInt((document.getElementById('txAcc') as HTMLSelectElement).value);
                            const amt = parseFloat((document.getElementById('txAmt') as HTMLInputElement).value);
                            const type = (document.getElementById('txType') as HTMLSelectElement).value;
                            if(accId && amt) addTransaction({ Account_ID: accId, Amount: amt, Type: type, Date: new Date().toISOString().split('T')[0] });
                        }}
                        className="bg-emerald-600 text-white rounded-xl font-bold"
                    >تنفيذ العملية</button>
                </div>
            </div>
        )}

        {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold mb-4">توزيع الأرصدة</h4>
                    <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={accounts.map(a => ({ name: a.Name, value: Math.abs(a.Balance) }))} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#2563EB">
                                {accounts.map((_, index) => <Cell key={`cell-${index}`} fill={['#2563EB', '#10B981', '#F59E0B', '#8B5CF6'][index % 4]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="font-bold mb-4">آخر العمليات</h4>
                    <ul className="space-y-3">
                        {transactions.slice(0, 5).map(t => (
                            <li key={t.ID} className="flex justify-between border-b pb-2">
                                <span>{accounts.find(a => a.ID === t.Account_ID)?.Name}</span>
                                <span className={t.Type === 'Deposit' ? 'text-emerald-600' : 'text-rose-600'}>
                                    {t.Type === 'Deposit' ? '+' : '-'}{formatNumber(t.Amount)}
                                </span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}
