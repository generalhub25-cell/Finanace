import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Toaster, toast } from 'sonner';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import arabicReshaper from 'arabic-reshaper';
import bidiFactory from 'bidi-js';
import { 
  Plus, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  LayoutDashboard, 
  Coins, 
  Banknote,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Search,
  Printer,
  Filter,
  MoreVertical,
  ChevronRight,
  Settings,
  FileText,
  Save,
  Trash2,
  Pencil,
  X,
  Users,
  ArrowLeft,
  UserPlus,
  Download,
  Share
} from 'lucide-react';
import { Account, Transaction, Currency } from './types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend
} from 'recharts';

const formatNumber = (amount: number, decimals = 2) => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(amount);
};

const formatForCSV = (num: number) => {
  return formatNumber(num, 2);
};

const getAccountLabel = (a: Account) => {
  if (a.Type === 'Bank') {
    return `${a.Name} - ${a.Type} (${a.Category}) - (${a.Currency})`;
  }
  if (a.Name === a.Type) {
    return `${a.Name} - (${a.Currency})`;
  }
  return `${a.Name} - ${a.Type} - (${a.Currency})`;
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('is_auth') === 'true';
  });
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currencies, setCurrencies] = useState([
    { id: '1', code: 'EGP', name: 'Egyptian Pound', symbol: 'ج.م' },
    { id: '2', code: 'USD', name: 'US Dollar', symbol: '$' },
    { id: '3', code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { id: '4', code: 'EUR', name: 'Euro', symbol: '€' },
    { id: '5', code: 'GBP', name: 'British Pound', symbol: '£' }
  ]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'accounts' | 'transactions' | 'currencies' | 'history' | 'settings' | 'reports' | 'customers'>('dashboard');

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    onConfirm: () => void;
    message: string;
  }>({
    isOpen: false,
    onConfirm: () => {},
    message: 'هل أنت متأكد من رغبتك في حذف هذه البيانات؟',
  });

  const requestConfirm = (onConfirm: () => void, message?: string) => {
    setConfirmModal({
      isOpen: true,
      onConfirm: () => {
        onConfirm();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      },
      message: message || 'هل أنت متأكد من رغبتك في حذف هذه البيانات؟',
    });
  };
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
  const fetchData = async () => {
    if (!isAuthenticated) return;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    try {
      const [accRes, transRes, currRes] = await Promise.all([
        fetch('/api/accounts', { signal: controller.signal }),
        fetch('/api/transactions', { signal: controller.signal }),
        fetch('/api/currencies', { signal: controller.signal })
      ]);
      
      clearTimeout(timeoutId);
      
      const accData = await accRes.json();
      const transData = await transRes.json();
      const currData = await currRes.json();
      
      setAccounts(accData);
      setTransactions(transData);
      setCurrencies(currData.currencies);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Fetch data timeout');
        toast.error('فشل تحميل البيانات: انتهت مهلة الاتصال');
      } else {
        console.error('Error fetching data:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  const calculateTotalBalanceEGP = () => {
    return accounts.reduce((total, acc) => {
      const currency = currencies.find(c => c.Currency_Code === acc.Currency);
      const rate = currency ? currency.Exchange_Rate_to_EGP : 1;
      return total + (acc.Balance * rate);
    }, 0);
  };

  const getCurrencySymbol = (code: string) => {
    switch(code) {
      case 'EGP': return '£';
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      default: return code;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 font-sans" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8">
          <div className="text-center space-y-2">
            <div className="inline-flex p-4 bg-blue-50 rounded-2xl text-blue-600 mb-2">
              <Wallet size={40} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">نظام إدارة الثروة</h1>
            <p className="text-gray-500 font-medium">يرجى إدخال كلمة المرور للمتابعة</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700 mr-1">كلمة المرور</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className={`w-full px-4 py-3 bg-gray-50 border rounded-xl outline-none focus:ring-2 transition-all text-center font-bold tracking-widest ${
                  loginError ? 'border-rose-500 focus:ring-rose-200' : 'border-gray-200 focus:ring-blue-200'
                }`}
                autoFocus
              />
              {loginError && (
                <p className="text-rose-500 text-xs font-bold text-center mt-2">كلمة المرور غير صحيحة!</p>
              )}
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              دخول النظام
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 font-medium">
            جميع الحقوق محفوظة © 2026
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#F8F9FA]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F8F9FA] text-[#1A1A1A] font-sans">
      <Toaster position="top-center" richColors />
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col no-print">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Banknote className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">FinancePro</h1>
          </div>
          
          <nav className="space-y-1">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="لوحة التحكم" 
              active={activeTab === 'dashboard'} 
              onClick={() => setActiveTab('dashboard')} 
            />
            <NavItem 
              icon={<Wallet size={20} />} 
              label="إدارة الحسابات" 
              active={activeTab === 'accounts'} 
              onClick={() => setActiveTab('accounts')} 
            />
            <NavItem 
              icon={<History size={20} />} 
              label="العمليات" 
              active={activeTab === 'transactions'} 
              onClick={() => setActiveTab('transactions')} 
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="العملاء" 
              active={activeTab === 'customers'} 
              onClick={() => setActiveTab('customers')} 
            />
            <NavItem 
              icon={<Search size={20} />} 
              label="سجل العمليات" 
              active={activeTab === 'history'} 
              onClick={() => setActiveTab('history')} 
            />
            <NavItem 
              icon={<TrendingUp size={20} />} 
              label="التقارير الزمنية" 
              active={activeTab === 'reports'} 
              onClick={() => setActiveTab('reports')} 
            />
            <NavItem 
              icon={<Settings size={20} />} 
              label="⚙️ الإعدادات" 
              active={activeTab === 'settings'} 
              onClick={() => setActiveTab('settings')} 
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-gray-100">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-rose-600 hover:bg-rose-50 rounded-xl transition-all font-bold"
            >
              <ArrowUpRight className="rotate-45" size={20} />
              تسجيل الخروج
            </button>
          </div>
        </div>
        
        <div className="mt-auto p-6 border-t border-gray-100">
          <div className="bg-blue-50 p-4 rounded-xl">
            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">Total Balance (EGP)</p>
            <p className="text-xl font-bold">{formatNumber(calculateTotalBalanceEGP())}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 no-print">
          <h2 className="text-lg font-semibold">
            {activeTab === 'dashboard' ? 'لوحة التحكم' : 
             activeTab === 'accounts' ? 'إدارة الحسابات' : 
             activeTab === 'transactions' ? 'العمليات' : 
             activeTab === 'customers' ? 'العملاء' :
             activeTab === 'history' ? 'سجل العمليات' : 
             activeTab === 'reports' ? 'التقارير الزمنية' : '⚙️ الإعدادات'}
          </h2>
        </header>

        <div className="p-8">
          <div className="print-only mb-8 border-b pb-4" dir="rtl">
            <h1 className="text-2xl font-bold text-gray-900">تقرير لوحة التحكم - Dashboard Report</h1>
            <p className="text-sm text-gray-500">تاريخ الاستخراج: {new Date().toLocaleString('ar-EG')}</p>
          </div>
          {activeTab === 'dashboard' && (
            <DashboardView 
              accounts={accounts} 
              transactions={transactions} 
              currencies={currencies} 
              totalEGP={calculateTotalBalanceEGP()}
              onUpdate={fetchData}
            />
          )}
          {activeTab === 'accounts' && (
            <AccountsView 
              accounts={accounts} 
              currencies={currencies} 
              onUpdate={fetchData} 
              requestConfirm={requestConfirm}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionsView 
              transactions={transactions} 
              accounts={accounts} 
              onUpdate={fetchData} 
              requestConfirm={requestConfirm}
            />
          )}
          {activeTab === 'history' && (
            <TransactionHistoryView 
              transactions={transactions} 
              accounts={accounts} 
              currencies={currencies} 
              onUpdate={fetchData} 
              requestConfirm={requestConfirm}
            />
          )}
          {activeTab === 'reports' && (
            <ReportsView currencies={currencies} />
          )}
          {activeTab === 'customers' && (
            <CustomersView 
              accounts={accounts} 
              transactions={transactions} 
              onUpdate={fetchData} 
              requestConfirm={requestConfirm}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsView currencies={currencies} onUpdate={fetchData} />
          )}
        </div>
      </main>

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 text-center space-y-6">
              <div className="bg-rose-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-rose-600">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 leading-relaxed">
                {confirmModal.message}
              </h3>
              <div className="grid grid-cols-2 gap-4 pt-2">
                <button 
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="py-4 bg-gray-100 text-gray-600 rounded-2xl font-black hover:bg-gray-200 transition-all active:scale-95"
                >
                  إلغاء
                </button>
                <button 
                  onClick={confirmModal.onConfirm}
                  className="py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg shadow-rose-200 hover:bg-rose-700 transition-all active:scale-95"
                >
                  نعم
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
        active 
          ? 'bg-blue-50 text-blue-600' 
          : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function DashboardView({ accounts, transactions, currencies, totalEGP, onUpdate }: { accounts: Account[], transactions: Transaction[], currencies: Currency[], totalEGP: number, onUpdate: () => void }) {
  const [selectedAccountIds, setSelectedAccountIds] = useState<(number | string)[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Business' | 'Personal'>('All');
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    onUpdate();
  }, []);

  const handleExportPDF = async () => {
    try {
      toast.info('جاري إنشاء التقرير...');
      const response = await fetch(`/api/reports/pdf?date=${asOfDate}`);
      
      if (!response.ok) throw new Error('فشل في إنشاء التقرير');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Dashboard_Report_${asOfDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('تم تحميل التقرير بنجاح');
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast.error('حدث خطأ أثناء تحميل ملف PDF');
    }
  };

  const getGoldPrice = (karat: number) => {
    const baseGold = currencies.find(c => c.Currency_Code === 'GOLD')?.Exchange_Rate_to_EGP || 0;
    // Check for specific karat price if available (e.g. GOLD21)
    const specificGold = currencies.find(c => c.Currency_Code === `GOLD${karat}`)?.Exchange_Rate_to_EGP;
    if (specificGold) return specificGold;
    // Fallback to proportional price
    return (baseGold / 24) * karat;
  };

  // Calculate daily movement for the selected date, splitting Gold by Karat
  const dailyMovementAccounts = useMemo(() => {
    const result: any[] = [];
    accounts.forEach(acc => {
      const todayTransactions = transactions.filter(t => t.Account_ID === acc.ID && t.Date === asOfDate);
      
      if (acc.Type === 'Gold') {
        const karats = Array.from(new Set(todayTransactions.map(t => t.Gold_Karat).filter(k => k != null)));
        if (karats.length === 0) {
          result.push({ ...acc, Balance: 0, EgpValue: 0 });
        } else {
          karats.forEach(karat => {
            const weight = todayTransactions
              .filter(t => t.Gold_Karat === karat)
              .reduce((sum, t) => sum + (t.Type === 'Deposit' ? (t.Gold_Weight || 0) : -(t.Gold_Weight || 0)), 0);
            
            const egpAmount = todayTransactions
              .filter(t => t.Gold_Karat === karat)
              .reduce((sum, t) => sum + (t.Type === 'Deposit' ? t.Amount : -t.Amount), 0);
            
            if (weight !== 0 || egpAmount !== 0) {
              result.push({ 
                ...acc, 
                ID: `${acc.ID}-${karat}`, 
                OriginalID: acc.ID,
                Name: `${acc.Name} ${karat}K`, 
                Balance: weight,
                EgpValue: egpAmount,
                Karat: karat,
                IsGoldSplit: true
              });
            }
          });
        }
      } else {
        const netChangeToday = todayTransactions.reduce((sum, t) => {
          if (acc.Type === 'Customer') {
            return sum + (t.Type === 'Withdrawal' ? t.Amount : -t.Amount);
          } else {
            return sum + (t.Type === 'Deposit' ? t.Amount : -t.Amount);
          }
        }, 0);
        result.push({ ...acc, Balance: netChangeToday, EgpValue: netChangeToday });
      }
    });
    return result;
  }, [accounts, transactions, asOfDate]);

  const filteredByCategory = categoryFilter === 'All' 
    ? dailyMovementAccounts 
    : dailyMovementAccounts.filter(acc => acc.Type === 'Bank' && acc.Category === categoryFilter);

  // Clear selected account IDs if they are no longer in the filtered list
  useEffect(() => {
    const validIds = filteredByCategory.map(acc => acc.ID);
    setSelectedAccountIds(prev => prev.filter(id => validIds.includes(id)));
  }, [categoryFilter, dailyMovementAccounts]);

  const filteredAccounts = selectedAccountIds.length > 0 
    ? filteredByCategory.filter(acc => selectedAccountIds.includes(acc.ID))
    : filteredByCategory;

  const currentTotalEGP = filteredAccounts.reduce((sum, acc) => {
    if (acc.IsGoldSplit) {
      return sum + acc.EgpValue;
    }
    const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
    return sum + (acc.Balance * rate);
  }, 0);

  const goldWeightMovement = filteredAccounts
    .filter(a => a.Type === 'Gold' && a.Currency === 'GOLD')
    .reduce((sum, a) => sum + a.Balance, 0);

  // Calculate gold weight and karat from transactions for the selected date
  const goldTransactions = transactions.filter(t => {
    const acc = accounts.find(a => a.ID === t.Account_ID);
    return t.Date === asOfDate && acc?.Type === 'Gold';
  });

  const totalGoldWeight = goldTransactions.reduce((sum, t) => sum + (t.Gold_Weight || 0), 0);
  
  const uniqueKarats = Array.from(new Set(goldTransactions.map(t => t.Gold_Karat).filter(k => k !== null && k !== undefined)));
  const karatDisplay = uniqueKarats.length === 0 ? '---' : uniqueKarats.length === 1 ? uniqueKarats[0] : 'Mixed';

  const goldBreakdown = useMemo(() => {
    const breakdown: Record<number, { weight: number, value: number }> = {};
    filteredAccounts.filter(a => a.Type === 'Gold' && a.IsGoldSplit).forEach(a => {
      if (!breakdown[a.Karat]) breakdown[a.Karat] = { weight: 0, value: 0 };
      breakdown[a.Karat].weight += a.Balance;
      breakdown[a.Karat].value += a.EgpValue;
    });
    return Object.entries(breakdown)
      .map(([karat, data]) => ({ karat: parseInt(karat), ...data }))
      .filter(item => item.weight !== 0 || item.value !== 0)
      .sort((a, b) => b.karat - a.karat);
  }, [filteredAccounts, currencies]);

  const goldValueMovement = goldBreakdown.reduce((sum, item) => sum + item.value, 0);

  const totalAED = filteredAccounts
    .filter(a => a.Currency === 'AED')
    .reduce((sum, a) => sum + a.Balance, 0);

  // Currency Totals - Global Sum regardless of filters
  const currencyTotals = useMemo(() => {
    const totals: Record<string, { total: number, egpValue: number }> = {};
    dailyMovementAccounts.forEach(acc => {
      if (acc.IsGoldSplit) {
        const label = `GOLD ${acc.Karat}K`;
        if (!totals[label]) totals[label] = { total: 0, egpValue: 0 };
        totals[label].total += acc.Balance;
        totals[label].egpValue += acc.EgpValue;

        // Add EGP value of gold transaction to EGP total
        if (!totals['EGP']) totals['EGP'] = { total: 0, egpValue: 0 };
        totals['EGP'].total += acc.EgpValue;
      } else {
        const label = acc.Currency;
        if (!totals[label]) totals[label] = { total: 0, egpValue: 0 };
        totals[label].total += acc.Balance;
      }
    });
    return Object.entries(totals).map(([code, data]) => ({ code, ...data }));
  }, [dailyMovementAccounts]);

  // Alert Logic
  const lowBalanceAccounts = filteredAccounts.filter(acc => 
    (acc.Type === 'Bank' || acc.Type === 'Safe') && 
    acc.Balance < acc.Minimum_Balance
  );

  const goldProfitLoss = dailyMovementAccounts
    .filter(acc => acc.Type === 'Gold')
    .reduce((total, acc) => {
      if (acc.IsGoldSplit) {
        const currentMarketValue = acc.Balance * getGoldPrice(acc.Karat);
        return total + (currentMarketValue - acc.EgpValue);
      }
      const currentRate = currencies.find(c => c.Currency_Code === 'GOLD')?.Exchange_Rate_to_EGP || 0;
      const profitPerGram = currentRate - acc.Purchase_Price;
      return total + (profitPerGram * acc.Balance);
    }, 0);

  const totalCustomerBalance = useMemo(() => {
    return accounts
      .filter(acc => acc.Type === 'Customer')
      .reduce((sum, acc) => {
        const futureTransactions = transactions.filter(t => t.Account_ID === acc.ID && t.Date > asOfDate);
        const futureChange = futureTransactions.reduce((accSum, t) => {
          return accSum + (t.Type === 'Deposit' ? t.Amount : -t.Amount);
        }, 0);
        const balanceAtDate = acc.Balance - futureChange;
        const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
        return sum + (balanceAtDate * rate);
      }, 0);
  }, [accounts, transactions, asOfDate, currencies]);

  const totalSafeBalance = useMemo(() => {
    return accounts
      .filter(acc => acc.Type === 'Safe')
      .reduce((sum, acc) => {
        const futureTransactions = transactions.filter(t => t.Account_ID === acc.ID && t.Date > asOfDate);
        const futureChange = futureTransactions.reduce((accSum, t) => {
          return accSum + (t.Type === 'Deposit' ? t.Amount : -t.Amount);
        }, 0);
        const balanceAtDate = acc.Balance - futureChange;
        const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
        return sum + (balanceAtDate * rate);
      }, 0);
  }, [accounts, transactions, asOfDate, currencies]);

  // Data for Asset Type Pie Chart
  const assetTypeData = ['Bank', 'Safe', 'Customer', 'Gold'].map(type => {
    const value = filteredAccounts
      .filter(acc => acc.Type === type)
      .reduce((sum, acc) => {
        if (acc.IsGoldSplit) return sum + acc.EgpValue;
        const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
        return sum + (acc.Balance * rate);
      }, 0);
    
    const label = type === 'Bank' ? 'بنوك' : type === 'Safe' ? 'خزينة' : type === 'Customer' ? 'عملاء' : 'ذهب';
    return { name: label, value };
  }).filter(item => item.value > 0);

  // Data for Wealth Distribution Pie Chart (Split Gold by Karat)
  const currencyData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredAccounts.forEach(acc => {
      let label = acc.Currency;
      let rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
      let value = acc.Balance * rate;
      
      if (acc.IsGoldSplit) {
        label = `GOLD ${acc.Karat}K`;
        value = acc.EgpValue;
      }
      
      if (value > 0) {
        data[label] = (data[label] || 0) + value;
      }
    });
    return Object.entries(data).map(([name, value]) => ({ name, value }));
  }, [filteredAccounts, currencies]);

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4'];

  return (
    <div className="space-y-8">
      {/* Date Selector & Category Filter */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 flex-1">
            <span className="text-sm font-bold text-gray-500">عرض أرصدة تاريخ معين:</span>
            <input 
              type="date" 
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
            />
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4 flex-1">
            <span className="text-sm font-bold text-gray-500">نوع الأرصدة المعروضة:</span>
            <div className="flex gap-2 p-1 bg-gray-50 rounded-xl border border-gray-100 flex-1">
              {(['All', 'Business', 'Personal'] as const).map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all ${categoryFilter === cat ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}
                >
                  {cat === 'All' ? 'الكل' : cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        <button 
          onClick={handleExportPDF}
          className="flex items-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-2xl border border-gray-200 font-bold hover:bg-gray-50 transition-all shadow-sm h-full"
        >
          <Printer size={20} className="text-blue-600" />
          تحميل تقرير الحالة المالية (PDF)
        </button>
      </div>

      <div className="space-y-8 p-2">
        <div className="print-only mb-8 border-b pb-4" dir="rtl">
          <h1 className="text-2xl font-bold text-gray-900">تقرير لوحة التحكم - Dashboard Report</h1>
          <p className="text-sm text-gray-500">تاريخ الاستخراج: {new Date().toLocaleString('ar-EG')}</p>
        </div>

      {asOfDate !== new Date().toISOString().split('T')[0] && (
        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-center">
          <p className="text-amber-800 font-bold text-sm">
            ⚠️ أنت تشاهد حركة اليوم لتاريخ: {asOfDate}
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
          <Filter size={18} />
          تصفية الحسابات:
        </div>
        <div className="flex flex-wrap gap-2">
          {filteredByCategory.map(acc => (
            <button
              key={acc.ID}
              onClick={() => {
                setSelectedAccountIds(prev => 
                  prev.includes(acc.ID) ? prev.filter(id => id !== acc.ID) : [...prev, acc.ID]
                );
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${
                selectedAccountIds.includes(acc.ID)
                ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {acc.Name}
            </button>
          ))}
          {selectedAccountIds.length > 0 && (
            <button 
              onClick={() => setSelectedAccountIds([])}
              className="px-3 py-1.5 rounded-full text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              إعادة تعيين
            </button>
          )}
        </div>
      </div>

      {/* Currency Totals Grid */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <Coins className="text-blue-600" />
          إجماليات العملات
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {currencyTotals.map(curr => {
            const isGoldKarat = curr.code.startsWith('GOLD ');
            const label = isGoldKarat 
              ? `إجمالي عيار ${curr.code.replace('GOLD ', '')}` 
              : `حركة ${curr.code === 'GOLD' ? 'الذهب' : curr.code}`;
            const unit = isGoldKarat || curr.code === 'GOLD' ? 'جرام (g)' : curr.code;

            return (
              <div key={curr.code} className="p-4 bg-gray-50 rounded-xl border border-gray-100 flex flex-col justify-between min-h-[100px]">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{label}</p>
                  <p className="text-lg font-black text-gray-900 leading-tight">
                    {formatNumber(curr.total)} 
                    <span className="text-[10px] opacity-50 mr-1">{unit}</span>
                  </p>
                </div>
                {isGoldKarat && (
                  <div className="mt-2 pt-2 border-t border-gray-200/50">
                    <p className="text-sm font-bold text-blue-600">
                      {formatNumber(curr.egpValue)} 
                      <span className="text-[10px] opacity-60 mr-1">EGP</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* AED Summary Info */}
      <div className="bg-blue-600 p-6 rounded-3xl shadow-xl shadow-blue-200 text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
            <Banknote size={32} />
          </div>
          <div>
            <p className="text-blue-100 font-medium uppercase tracking-wider text-sm">إجمالي حركة الدرهم الإماراتي في {asOfDate}</p>
            <h2 className="text-4xl font-black tracking-tight">{formatNumber(totalAED)} <span className="text-xl font-bold opacity-60">AED</span></h2>
          </div>
        </div>
        <div className="hidden md:block text-right opacity-60">
          <p className="text-xs font-bold uppercase">تحديث فوري</p>
          <p className="text-sm font-medium">{new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>

      {/* Alerts and Summaries */}
      <div className="space-y-4">
        {lowBalanceAccounts.length > 0 && (
          <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
            <div className="bg-rose-500 p-2 rounded-lg text-white">
              <MoreVertical size={18} />
            </div>
            <div>
              <h4 className="text-rose-900 font-bold text-sm">تنبيه: انخفاض رصيد الحسابات</h4>
              <p className="text-rose-700 text-xs mt-1">
                الحسابات التالية تجاوزت الحد الأدنى للأمان: {lowBalanceAccounts.map(a => a.Name).join('، ')}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 p-2 rounded-lg text-white">
                <TrendingUp size={18} />
              </div>
              <div>
                <h4 className="text-emerald-900 font-bold text-sm">أرباح/خسائر الذهب التقديرية</h4>
                <p className="text-emerald-700 text-xs">بناءً على سعر الشراء والسعر الحالي</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-black ${goldProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {goldProfitLoss >= 0 ? '+' : ''}{formatNumber(goldProfitLoss)} ج.م
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500 p-2 rounded-lg text-white">
                <Wallet size={18} />
              </div>
              <div>
                <h4 className="text-blue-900 font-bold text-sm">رصيد الخزنة</h4>
                <p className="text-blue-700 text-xs">إجمالي النقدية أو العجز</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-black ${totalSafeBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatNumber(totalSafeBalance)} ج.م
              </p>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg text-white">
                <Wallet size={18} />
              </div>
              <div>
                <h4 className="text-indigo-900 font-bold text-sm">مستحقات العملاء (التحصيل)</h4>
                <p className="text-indigo-700 text-xs">إجمالي المبالغ المطلوبة من العملاء</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-lg font-black ${totalCustomerBalance >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
                {formatNumber(totalCustomerBalance)} ج.م
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section - Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-blue-100 font-medium uppercase tracking-wider text-sm">إجمالي حركة الثروة في {asOfDate}</p>
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-5xl font-black tracking-tight">
              {formatNumber(currentTotalEGP)}
            </h2>
            <span className="text-xl font-bold text-blue-200">ج.م</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-3xl p-8 text-white shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <p className="text-amber-100 font-medium uppercase tracking-wider text-sm">حركة الذهب في {asOfDate}</p>
            <div className="bg-white/20 p-2 rounded-xl backdrop-blur-md">
              <Coins className="w-6 h-6" />
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-black tracking-tight">
                {formatNumber(goldValueMovement)}
              </h2>
              <span className="text-xl font-bold text-amber-200">ج.م</span>
            </div>
            
            {goldBreakdown.length > 0 ? (
              <div className="space-y-1.5 pt-2 border-t border-white/20">
                {goldBreakdown.map(item => (
                  <div key={item.karat} className="flex justify-between items-center text-[11px] font-bold text-amber-50">
                    <span>{formatNumber(item.weight, 2)}g (Karat {item.karat})</span>
                    <span className="opacity-80">{formatNumber(item.value)} EGP</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs font-medium text-amber-100 opacity-90">
                0 grams
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Pie Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-center">توزيع حركة الأصول حسب النوع</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={assetTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {assetTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${formatNumber(value)} ج.م`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h3 className="text-lg font-bold mb-6 text-center">توزيع حركة الثروة حسب العملة</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={currencyData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {currencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `${formatNumber(value)} ج.م`}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Balances Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">الأرصدة الحالية (Current Balances)</h3>
            <button onClick={onUpdate} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <History size={18} className="text-gray-500" />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">اسم الحساب</th>
                  <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">العملة</th>
                  <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">الرصيد</th>
                  <th className="pb-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">القيمة بالجنيه</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredAccounts.map(acc => {
                  const valueInEGP = acc.IsGoldSplit 
                    ? acc.EgpValue 
                    : acc.Balance * (currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1);

                  let goldDetails = '';
                  if (acc.IsGoldSplit) {
                    goldDetails = ` (${formatNumber(acc.Balance, 2)}g - ${acc.Karat}K)`;
                  }

                  return (
                    <tr key={acc.ID} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-4 font-semibold whitespace-nowrap">
                        {acc.Name}
                        {goldDetails && (
                          <span className="text-[10px] text-amber-600 font-bold ml-1">
                            {goldDetails}
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                          {acc.IsGoldSplit ? `GOLD ${acc.Karat}K` : acc.Currency}
                        </span>
                      </td>
                      <td className="py-4 text-right font-bold">
                        {acc.Balance >= 0 ? '+' : ''}{formatNumber(acc.Balance)}
                      </td>
                      <td className="py-4 text-right font-bold text-blue-600">
                        {valueInEGP >= 0 ? '+' : ''}{formatNumber(valueInEGP)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">آخر النشاطات</h3>
            <button className="text-blue-600 text-sm font-semibold hover:underline">عرض الكل</button>
          </div>
          <div className="space-y-4">
            {transactions.slice(0, 6).map(t => (
              <div key={t.ID} className="flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${t.Type === 'Deposit' ? (t.Amount >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600') : 'bg-rose-50 text-rose-600'}`}>
                    {t.Type === 'Deposit' ? (t.Amount >= 0 ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />) : <ArrowUpRight size={16} />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.AccountName}</p>
                    <p className="text-xs text-gray-500">{t.Description || (t.Type === 'Deposit' ? (t.Amount >= 0 ? 'إيداع' : 'سحب') : 'سحب')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${t.Type === 'Deposit' ? (t.Amount >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-rose-600'}`}>
                    {t.Type === 'Deposit' ? (t.Amount >= 0 ? '+' : '') : '-'}{formatNumber(t.Amount)}
                  </p>
                  <p className="text-[10px] text-gray-400 uppercase font-medium">{t.Date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
  );
}

function StatCard({ title, value, currency, isCount, icon, trend }: { title: string, value: number, currency?: string, isCount?: boolean, icon: React.ReactNode, trend?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="bg-gray-50 p-2 rounded-lg">{icon}</div>
        {trend && (
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{trend}</span>
        )}
      </div>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <div className="flex items-baseline gap-1">
        <h4 className="text-2xl font-bold">
          {isCount ? value : formatNumber(value)}
        </h4>
        {!isCount && <span className="text-xs text-gray-400 font-bold uppercase">{currency}</span>}
      </div>
    </div>
  );
}

function CustomerDetailView({ 
  customer, 
  transactions, 
  onBack, 
  onUpdate,
  requestConfirm
}: { 
  customer: Account, 
  transactions: Transaction[], 
  onBack: () => void,
  onUpdate: () => void,
  requestConfirm: (onConfirm: () => void, message?: string) => void
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'Deposit' | 'Withdrawal'>('Deposit'); // له = Deposit, عليه = Withdrawal
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [addedBy, setAddedBy] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Transaction State
  const [editTx, setEditTx] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editAddedBy, setEditAddedBy] = useState('');
  const [editType, setEditType] = useState<'Deposit' | 'Withdrawal'>('Deposit');

  // Filter transactions for this customer and sort by date ascending for balance calculation
  const customerTransactions = useMemo(() => {
    return transactions
      .filter(t => t.Account_ID === customer.ID)
      .sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());
  }, [transactions, customer.ID]);

  // Calculate balances
  // User: "تخصم 'عليه' (Debit) وتضيف 'له' (Credit)"
  // In our system: Type='Deposit' is 'له' (Credit), Type='Withdrawal' is 'عليه' (Debit)
  const transactionsWithBalance = useMemo(() => {
    let currentBalance = 0;
    return customerTransactions.map(t => {
      if (t.Type === 'Withdrawal') {
        currentBalance += t.Amount;
      } else {
        currentBalance -= t.Amount;
      }
      return { ...t, runningBalance: currentBalance };
    });
  }, [customerTransactions]);

  // Sort descending for display
  const sortedTransactions = [...transactionsWithBalance].reverse();

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(parseFloat(amount))) {
      toast.error('يرجى إدخال مبلغ صحيح');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Date: date,
          Account_ID: customer.ID,
          Amount: parseFloat(amount),
          Type: type,
          Description: description,
          Added_By: addedBy
        })
      });

      if (res.ok) {
        toast.success('تمت إضافة العملية بنجاح');
        setShowAddModal(false);
        setAmount('');
        setDescription('');
        setDate(new Date().toISOString().split('T')[0]);
        setAddedBy('');
        onUpdate();
      } else {
        toast.error('فشل إضافة العملية');
      }
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    requestConfirm(async () => {
      try {
        const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('تم حذف العملية بنجاح');
          onUpdate();
        } else {
          toast.error('فشل حذف العملية');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('حدث خطأ');
      }
    });
  };

  const handleDeleteAll = async () => {
    requestConfirm(async () => {
      try {
        const res = await fetch(`/api/accounts/${customer.ID}/transactions`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('تم مسح كشف الحساب بالكامل');
          onUpdate();
        } else {
          toast.error('فشل مسح كشف الحساب');
        }
      } catch (error) {
        console.error('Clear error:', error);
        toast.error('حدث خطأ');
      }
    }, 'تحذير: هل أنت متأكد من مسح كشف الحساب بالكامل؟ سيتم تصفير رصيد العميل وحذف كافة العمليات!');
  };

  const handleEditTxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTx) return;

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${editTx.ID}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          Date: editDate,
          Account_ID: customer.ID,
          Amount: parseFloat(editAmount),
          Type: editType,
          Description: editDescription,
          Added_By: editAddedBy
        })
      });

      if (res.ok) {
        toast.success('تم تحديث العملية بنجاح');
        setEditTx(null);
        onUpdate();
      } else {
        toast.error('فشل تحديث العملية');
      }
    } catch (error) {
      console.error('Update error:', error);
      toast.error('حدث خطأ');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (t: Transaction) => {
    setEditTx(t);
    setEditAmount(t.Amount.toString());
    setEditDescription(t.Description);
    setEditDate(t.Date);
    setEditAddedBy(t.Added_By || '');
    setEditType(t.Type);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'DEBIT', 'CREDIT', 'Balance', 'Description', 'Added By'];
    const rows = [
      ...transactionsWithBalance.map(t => {
        const displayedBalance = -t.runningBalance;
        const sign = displayedBalance < 0 ? '-' : (displayedBalance > 0 ? '+' : '');
        return [
          t.Date,
          t.Type === 'Deposit' ? formatNumber(t.Amount, 2) : '0',
          t.Type === 'Withdrawal' ? formatNumber(t.Amount, 2) : '0',
          `${sign}${formatNumber(Math.abs(displayedBalance), 2)}`,
          t.Description,
          t.Added_By || 'System'
        ];
      }),
      ['', '', '', '', '', ''], // spacer
      ['Account Total', '', '', `${-customer.Balance < 0 ? '-' : (-customer.Balance > 0 ? '+' : '')}${formatNumber(Math.abs(-customer.Balance), 2)}`, 'Grand Total Balance', '']
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `statement_${customer.Name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('تم تصدير ملف CSV بنجاح');
  };

  const exportToPDF = () => {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'pt',
      format: 'a4'
    });

    // Helper for Arabic text (simulated since standard fonts don't support glyphs well without embedding)
    // In a real environment, you'd doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal')
    // We'll use standard font but keep the structure
    
    // Header / Logo
    doc.setFontSize(28);
    doc.setTextColor(37, 99, 235); // Blue-600
    doc.text('FINANCE PRO', 40, 50);
    
    doc.setDrawColor(229, 231, 235);
    doc.line(40, 65, 555, 65);

    // Customer Info
    doc.setFontSize(16);
    doc.setTextColor(31, 41, 55);
    doc.text(`Customer Name: ${customer.Name}`, 40, 90);
    doc.setFontSize(12);
    doc.text(`Currency: ${customer.Currency}`, 40, 110);
    const summaryDisplayVal = -customer.Balance;
    const summarySign = summaryDisplayVal < 0 ? '-' : (summaryDisplayVal > 0 ? '+' : '');
    if (summaryDisplayVal < 0) {
      doc.setTextColor(225, 29, 72); // rose-600
    } else {
      doc.setTextColor(5, 150, 105); // emerald-600
    }
    doc.text(`Current Net Balance: ${summarySign}${formatNumber(Math.abs(summaryDisplayVal), 2)} ${customer.Currency}`, 40, 130);
    doc.setTextColor(31, 41, 55);
    doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 40, 150);

    // Table
    const tableData = [
      ...transactionsWithBalance.map(t => {
        const displayedBalance = -t.runningBalance;
        const sign = displayedBalance < 0 ? '-' : (displayedBalance > 0 ? '+' : '');
        return [
          t.Date,
          t.Type === 'Deposit' ? formatNumber(t.Amount, 2) : '-',
          t.Type === 'Withdrawal' ? formatNumber(t.Amount, 2) : '-',
          `${sign}${formatNumber(Math.abs(displayedBalance), 2)}`,
          t.Description
        ];
      }),
      [{ content: 'GRAND TOTAL', colSpan: 3, styles: { halign: 'right', fontStyle: 'bold', fillColor: [243, 244, 246] } }, 
       { content: `${summarySign}${formatNumber(Math.abs(summaryDisplayVal), 2)}`, styles: { fontStyle: 'bold', fillColor: [243, 244, 246], textColor: summaryDisplayVal < 0 ? [225, 29, 72] : [5, 150, 105] } },
       { content: 'Total Account Balance', styles: { fillColor: [243, 244, 246] } }]
    ];

    autoTable(doc, {
      startY: 170,
      head: [['Date', 'DEBIT', 'CREDIT', 'Balance', 'Description']],
      body: tableData,
      styles: { fontSize: 10, cellPadding: 8 },
      headStyles: { fillColor: [37, 99, 235], textColor: 255 },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      margin: { left: 40, right: 40 }
    });

    doc.save(`statement_${customer.Name}_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('تم تصدير ملف PDF بنجاح');
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="space-y-1">
            <h3 className="text-2xl font-black">{customer.Name}</h3>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Coins size={14} className="text-amber-500" />
              العملة الأساسية: {customer.Currency}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={exportToPDF}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all border border-gray-200"
          >
            <Printer size={18} />
            تصدير PDF
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center justify-center gap-2 bg-white text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-all border border-gray-200"
          >
            <Download size={18} />
            تصدير CSV
          </button>
          <button 
            onClick={handleDeleteAll}
            className="flex items-center justify-center gap-2 bg-rose-50 text-rose-600 px-6 py-3 rounded-xl font-bold hover:bg-rose-100 transition-all border border-rose-200"
          >
            <Trash2 size={18} />
            حذف الكل
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
          >
            <Plus size={20} />
            إضافة عملية جديدة
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-400 font-bold uppercase mb-1">الرصيد الإجمالي الحالي</p>
          <p className={`text-2xl font-black ${-customer.Balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            {-customer.Balance < 0 ? '-' : (-customer.Balance > 0 ? '+' : '')}{formatNumber(Math.abs(-customer.Balance))} {customer.Currency}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <FileText className="text-blue-600" size={20} />
          <h4 className="font-bold">كشف حساب العميل (Statement of Account)</h4>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-l border-gray-100">التاريخ (Date)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-l border-gray-100">DEBIT</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-l border-gray-100">CREDIT</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-l border-gray-100">الرصيد (Balance)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-l border-gray-100">البيان (Description)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider border-l border-gray-100">أضيف بواسطة (Added by)</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedTransactions.map((t) => (
                <tr key={t.ID} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-gray-500 border-l border-gray-100">{t.Date}</td>
                  <td className="px-6 py-4 font-bold text-emerald-600 border-l border-gray-100">
                    {t.Type === 'Deposit' ? formatNumber(t.Amount) : '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-rose-600 border-l border-gray-100">
                    {t.Type === 'Withdrawal' ? formatNumber(t.Amount) : '-'}
                  </td>
                  <td className="px-6 py-4 font-black border-l border-gray-100">
                    <span className={(-t.runningBalance) < 0 ? 'text-rose-700' : 'text-emerald-700'}>
                      {(-t.runningBalance) < 0 ? '-' : ((-t.runningBalance) > 0 ? '+' : '')}{formatNumber(Math.abs(-t.runningBalance))}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium border-l border-gray-100">{t.Description}</td>
                  <td className="px-6 py-4 text-xs border-l border-gray-100">
                    <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold">
                      {t.Added_By || 'النظام'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(t)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="تعديل"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteTransaction(t.ID)}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="حذف"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sortedTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-medium">
                    لا توجد عمليات مسجلة لهذا العميل حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <UserPlus className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-bold">إضافة عملية: {customer.Name}</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddTransaction} className="p-8 space-y-6">
              <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest mb-1">عملة العميل</p>
                  <p className="text-xl font-black text-amber-900">{customer.Currency}</p>
                </div>
                <Coins className="text-amber-400" size={32} />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block mr-1">التاريخ (Date)</label>
                <input 
                  type="date" 
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block mr-1">المبلغ (Amount)</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="any"
                    required
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-black text-2xl transition-all text-center"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setType('Deposit')}
                  className={`py-6 rounded-2xl font-black transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                    type === 'Deposit' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-inner' 
                      : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="text-xl uppercase">له (DEBIT)</span>
                  <span className="text-[10px] font-black opacity-60">Deposit (+ إضافة)</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setType('Withdrawal')}
                  className={`py-6 rounded-2xl font-black transition-all border-2 flex flex-col items-center justify-center gap-1 ${
                    type === 'Withdrawal' 
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-inner' 
                      : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  <span className="text-xl uppercase">عليه (CREDIT)</span>
                  <span className="text-[10px] font-black opacity-60">Withdrawal (- خصم)</span>
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block mr-1">البيان (Description)</label>
                <textarea 
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold min-h-[120px] transition-all"
                  placeholder="اكتب تفاصيل المعاملة هنا..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block mr-1">اسم المضيف (Added by)</label>
                <input 
                  type="text" 
                  required
                  value={addedBy}
                  onChange={(e) => setAddedBy(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"
                  placeholder="من قام بإضافة هذه العملية؟"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 disabled:opacity-50 active:scale-[0.98]"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'حفظ العملية الآن'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editTx && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <Pencil className="text-blue-600" size={24} />
                </div>
                <h3 className="text-xl font-bold">تعديل العملية</h3>
              </div>
              <button 
                onClick={() => setEditTx(null)}
                className="p-2 hover:bg-gray-200 rounded-xl transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleEditTxSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block mr-1">التاريخ</label>
                <input 
                  type="date" 
                  required
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block mr-1">المبلغ</label>
                <input 
                  type="number" 
                  step="any"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-black text-2xl transition-all text-center"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  type="button"
                  onClick={() => setEditType('Deposit')}
                  className={`py-4 rounded-2xl font-black transition-all border-2 ${
                    editType === 'Deposit' 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}
                >
                  له (DEBIT)
                </button>
                <button 
                  type="button"
                  onClick={() => setEditType('Withdrawal')}
                  className={`py-4 rounded-2xl font-black transition-all border-2 ${
                    editType === 'Withdrawal' 
                      ? 'bg-rose-50 border-rose-500 text-rose-700' 
                      : 'bg-gray-50 border-gray-100 text-gray-400'
                  }`}
                >
                  عليه (CREDIT)
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block mr-1">البيان</label>
                <textarea 
                  required
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold min-h-[100px] transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block mr-1">اسم المضيف</label>
                <input 
                  type="text" 
                  required
                  value={editAddedBy}
                  onChange={(e) => setEditAddedBy(e.target.value)}
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 font-bold transition-all"
                />
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200"
              >
                {isSubmitting ? 'جاري الحفظ...' : 'تحديث البيانات'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CustomersView({ accounts, transactions, onUpdate, requestConfirm }: { accounts: Account[], transactions: Transaction[], onUpdate: () => void, requestConfirm: (onConfirm: () => void, message?: string) => void }) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const customers = accounts.filter(acc => acc.Type === 'Customer');
  const selectedCustomer = accounts.find(acc => acc.ID === selectedCustomerId);

  if (selectedCustomerId && selectedCustomer) {
    return (
      <CustomerDetailView 
        customer={selectedCustomer} 
        transactions={transactions} 
        onBack={() => setSelectedCustomerId(null)}
        onUpdate={onUpdate}
        requestConfirm={requestConfirm}
      />
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Users className="text-blue-600" size={24} />
          <h3 className="text-xl font-bold">قائمة العملاء المسجلين</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.length > 0 ? (
            customers.map(customer => (
              <div 
                key={customer.ID} 
                onClick={() => setSelectedCustomerId(customer.ID)}
                className="relative p-6 bg-[#F8F9FA] rounded-2xl border border-gray-100 hover:border-blue-500 hover:shadow-xl transition-all group overflow-hidden cursor-pointer"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-12 -mt-12 opacity-50 group-hover:bg-blue-600/10 group-hover:scale-150 transition-all duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-1">
                      <p className="font-black text-[#1A1A1A] text-xl group-hover:text-blue-600 transition-colors uppercase">{customer.Name}</p>
                      <span className="inline-block text-[10px] bg-white text-gray-500 border border-gray-100 px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-sm">
                        {customer.Currency}
                      </span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                      <FileText size={24} />
                    </div>
                  </div>
                  
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm group-hover:scale-[1.02] transition-transform">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">صافي الرصيد الحالي</p>
                      <p className={`font-black text-xl ${customer.Balance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {formatNumber(customer.Balance)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center text-blue-600 font-bold text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    عرض كشف الحساب التفصيلي <ChevronRight size={16} className="rotate-180" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-center">
              <div className="inline-flex p-4 bg-gray-100 rounded-2xl text-gray-400 mb-4">
                <Users size={32} />
              </div>
              <p className="text-gray-500 font-bold text-lg">لا يوجد عملاء مضافون حالياً</p>
              <p className="text-gray-400 text-sm mt-1">يمكنك إضافة العملاء من خلال "إدارة الحسابات"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AccountsView({ accounts, currencies, onUpdate, requestConfirm }: { accounts: Account[], currencies: Currency[], onUpdate: () => void, requestConfirm: (onConfirm: () => void, message?: string) => void }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<Account['Type']>('Bank');
  const [currency, setCurrency] = useState('EGP');
  const [balance, setBalance] = useState('0');
  const [minBalance, setMinBalance] = useState('0');
  const [purchasePrice, setPurchasePrice] = useState('0');
  const [category, setCategory] = useState<'Business' | 'Personal'>('Personal');

  // Edit Account Details State
  const [editAccountId, setEditAccountId] = useState<string>('');
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<Account['Type']>('Bank');

  const filteredCurrencies = currencies.filter(c => 
    !c.Currency_Code.includes('Gold') && !c.Currency_Code.includes('GOLD')
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let finalCategory = category;
    if (type !== 'Bank') {
      finalCategory = 'Personal';
    }

    let finalName = name;
    let initialBalance = 0;

    // Add the account
    await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        Name: finalName, 
        Type: type, 
        Category: finalCategory,
        Currency: currency, 
        Balance: initialBalance,
        Minimum_Balance: 0,
        Purchase_Price: 0
      })
    });

    setName('');
    onUpdate();
    toast.success(`تم تسجيل '${finalName}' بنجاح`);
  };

  const handleUpdateAccountDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editAccountId) return;
    
    await fetch(`/api/accounts/${editAccountId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Name: editName, Type: editType, Category: editCategory })
    });
    
    setEditAccountId('');
    setEditName('');
    onUpdate();
    toast.success('تم تحديث بيانات الحساب بنجاح');
  };

  const [editCategory, setEditCategory] = useState<'Business' | 'Personal'>('Personal');
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (editAccountId) {
      const acc = accounts.find(a => a.ID.toString() === editAccountId);
      if (acc) {
        setEditName(acc.Name);
        setEditType(acc.Type);
        setEditCategory(acc.Category || 'Personal');
        setConfirmDelete(false);
      }
    }
  }, [editAccountId, accounts]);

  const handleDeleteAccount = async () => {
    if (!editAccountId || !confirmDelete) return;

    requestConfirm(async () => {
      try {
        const res = await fetch(`/api/accounts/${editAccountId}`, { method: 'DELETE' });
        if (res.ok) {
          toast.success('تم حذف الحساب وجميع سجلاته بنجاح');
          setEditAccountId('');
          setConfirmDelete(false);
          onUpdate();
        } else {
          const err = await res.json();
          toast.error(`فشل الحذف: ${err.error}`);
        }
      } catch (error) {
        console.error('Delete account error:', error);
        toast.error('حدث خطأ أثناء محاولة حذف الحساب');
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Add Account Form */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-8 flex items-center gap-2">
          <span className="bg-blue-100 p-2 rounded-lg text-blue-600">🏦</span>
          تسجيل أسماء الحسابات
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Row 1: Fixed for all types */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">اسم الحساب (مثلاً: بنك مصر أو سبائك)</label>
              <input 
                required
                value={name} 
                onChange={e => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">النوع</label>
              <select 
                value={type} 
                onChange={e => setType(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
              >
                <option value="Bank">Bank</option>
                <option value="Safe">Safe</option>
                <option value="Visa">Visa</option>
                <option value="Customer">Customer</option>
                <option value="Gold">Gold</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">العملة</label>
              <select 
                value={currency} 
                onChange={e => setCurrency(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
              >
                {filteredCurrencies.map(c => <option key={c.Currency_Code} value={c.Currency_Code}>{c.Currency_Code}</option>)}
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Row 2: Variable based on type */}
          {type === 'Bank' ? (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                🏢 تصنيف البنك
              </h4>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">هل الحساب بيزنس أم شخصي؟</label>
                <div className="flex gap-4">
                  {(['Business', 'Personal'] as const).map(cat => (
                    <label key={cat} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="category" 
                        checked={category === cat}
                        onChange={() => setCategory(cat)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-blue-50 text-blue-700 p-4 rounded-xl text-sm border border-blue-100">
              {type === 'Gold' 
                ? 'سيتم تتبع أوزان الذهب وعياراته من خلال قسم "إدخال العمليات" فقط.' 
                : `سيتم تسجيل الحساب كـ ${type} عام.`}
            </div>
          )}

          <div className="flex justify-end">
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md"
            >
              إضافة الحساب
            </button>
          </div>
        </form>
      </div>

      {/* Edit Account Name/Type Form */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
          <span className="bg-indigo-100 p-2 rounded-lg text-indigo-600">📝</span>
          تعديل اسم أو نوع حساب
        </h3>
        <form onSubmit={handleUpdateAccountDetails} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">اختر الحساب لتعديله</label>
              <select 
                required
                value={editAccountId} 
                onChange={e => setEditAccountId(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold"
              >
                <option value="">اختر حساباً...</option>
                {accounts.map(acc => (
                  <option key={acc.ID} value={acc.ID}>{acc.Name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">الاسم الجديد</label>
              <input 
                required
                value={editName} 
                onChange={e => setEditName(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">النوع الجديد</label>
              <select 
                value={editType} 
                onChange={e => setEditType(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="Bank">Bank (بنك)</option>
                <option value="Safe">Safe (خزينة)</option>
                <option value="Visa">Visa (فيزا)</option>
                <option value="Customer">Customer (عميل)</option>
                <option value="Gold">Gold (ذهب)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">التصنيف الجديد</label>
              <select 
                value={editCategory} 
                onChange={e => setEditCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              >
                <option value="Business">Business</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
          </div>

          {editAccountId && (
            <div className="flex flex-col md:flex-row items-center gap-6 pt-4 border-t border-gray-100">
              <div className="flex-1 w-full">
                <label className="flex items-center gap-3 cursor-pointer p-4 bg-rose-50 rounded-2xl border border-rose-100 group transition-all hover:bg-rose-100">
                  <input 
                    type="checkbox" 
                    checked={confirmDelete}
                    onChange={(e) => setConfirmDelete(e.target.checked)}
                    className="w-5 h-5 text-rose-600 rounded-lg"
                  />
                  <span className="text-sm font-bold text-rose-700">
                    هل أنت متأكد من حذف هذا الحساب وجميع سجلاته نهائياً؟
                  </span>
                </label>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto">
                <button 
                  type="submit" 
                  className="flex-1 md:flex-none bg-indigo-600 text-white px-10 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 transition-transform"
                >
                  حفظ التعديلات
                </button>
                <button 
                  type="button" 
                  onClick={handleDeleteAccount}
                  disabled={!confirmDelete}
                  className={`flex-1 md:flex-none px-10 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95 transition-transform ${confirmDelete ? 'bg-rose-600 text-white shadow-rose-100 hover:bg-rose-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                >
                  حذف الحساب
                </button>
              </div>
            </div>
          )}
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">اسم الحساب</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">النوع</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">العملة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">الرصيد</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">المعادل (ج.م)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {accounts.map(acc => {
              const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
              return (
                <tr key={acc.ID} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xs">
                        {acc.Name.charAt(0)}
                      </div>
                      <span className="font-semibold">{acc.Name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                      acc.Type === 'Bank' ? 'bg-blue-50 text-blue-600' :
                      acc.Type === 'Safe' ? 'bg-amber-50 text-amber-600' :
                      acc.Type === 'Gold' ? 'bg-yellow-50 text-yellow-700' :
                      acc.Type === 'Visa' ? 'bg-rose-50 text-rose-600' :
                      'bg-purple-50 text-purple-600'
                    }`}>
                      {acc.Type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-600">{acc.Currency}</td>
                  <td className="px-6 py-4 text-right font-bold">{formatNumber(acc.Balance)}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-400 group-hover:text-blue-600 transition-colors">
                    {formatNumber(acc.Balance * rate)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransactionsView({ 
  transactions, 
  accounts, 
  onUpdate,
  requestConfirm
}: { 
  transactions: Transaction[], 
  accounts: Account[], 
  onUpdate: () => void,
  requestConfirm: (onConfirm: () => void, message?: string) => void
}) {
  const nonCustomerAccounts = accounts.filter(a => a.Type !== 'Customer');
  const [accountId, setAccountId] = useState(nonCustomerAccounts[0]?.ID || '');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [goldWeight, setGoldWeight] = useState('');
  const [goldKarat, setGoldKarat] = useState('21');
  const [editTxId, setEditTxId] = useState<number | null>(null);

  const selectedAccount = accounts.find(a => a.ID === parseInt(accountId.toString()));
  const isGoldAccount = selectedAccount?.Type === 'Gold';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountId) return;
    
    const url = editTxId ? `/api/transactions/${editTxId}` : '/api/transactions';
    const method = editTxId ? 'PUT' : 'POST';

    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        Account_ID: parseInt(accountId.toString()), 
        Amount: parseFloat(amount), 
        Type: 'Deposit', 
        Description: desc,
        Date: date,
        Gold_Weight: isGoldAccount ? parseFloat(goldWeight) : 0,
        Gold_Karat: isGoldAccount ? parseInt(goldKarat) : null
      })
    });
    
    setAmount('');
    setDesc('');
    setGoldWeight('');
    setEditTxId(null);
    onUpdate();
    toast.success(editTxId ? 'تم تحديث العملية بنجاح' : `تم تسجيل مبلغ ${amount} في الحساب`);
  };

  const handleEdit = (t: Transaction) => {
    setEditTxId(t.ID);
    setAccountId(t.Account_ID.toString());
    setAmount(t.Amount.toString());
    setDesc(t.Description || '');
    setDate(t.Date);
    setGoldWeight(t.Gold_Weight?.toString() || '');
    setGoldKarat(t.Gold_Karat?.toString() || '21');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditTxId(null);
    setAmount('');
    setDesc('');
    setGoldWeight('');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleDelete = async (id: number) => {
    requestConfirm(async () => {
      try {
        const res = await fetch(`/api/transactions/${id}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
          toast.success('تم حذف العملية وتحديث الرصيد بنجاح');
          onUpdate();
        } else {
          const errorData = await res.json();
          toast.error(`فشل الحذف: ${errorData.error || 'خطأ غير معروف'}`);
        }
      } catch (error) {
        console.error('Delete Error:', error);
        toast.error('حدث خطأ أثناء محاولة الحذف');
      }
    }, 'هل أنت متأكد من حذف هذه العملية؟');
  };

  return (
    <div className="space-y-8">
      {/* New Transaction Form */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <h3 className="text-xl font-bold mb-6">
          {editTxId ? '✏️ تعديل العملية' : '💰 تسجيل أرصدة الحسابات'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">الحساب</label>
              <select 
                required
                value={accountId} 
                onChange={e => setAccountId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg outline-none"
              >
                <option value="">اختر الحساب</option>
                {accounts.filter(a => a.Type !== 'Customer').map(a => (
                  <option key={a.ID} value={a.ID}>
                    {getAccountLabel(a)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">المبلغ / الرصيد</label>
              <input 
                required
                type="number"
                step="0.01"
                value={amount} 
                onChange={e => setAmount(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">التاريخ</label>
              <input 
                type="date"
                required
                value={date} 
                onChange={e => setDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {isGoldAccount && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div>
                <label className="block text-xs font-bold text-amber-700 uppercase mb-1">الوزن (جرام)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  value={goldWeight} 
                  onChange={e => setGoldWeight(e.target.value)}
                  className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-700 uppercase mb-1">العيار</label>
                <select 
                  value={goldKarat} 
                  onChange={e => setGoldKarat(e.target.value)}
                  className="w-full px-4 py-2 border border-amber-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                >
                  <option value="24">24</option>
                  <option value="22">22</option>
                  <option value="21">21</option>
                  <option value="18">18</option>
                </select>
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">الوصف (اختياري)</label>
            <input 
              value={desc} 
              onChange={e => setDesc(e.target.value)}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="أضف وصفاً..."
            />
          </div>

          <div className="flex justify-end gap-3">
            {editTxId && (
              <button 
                type="button"
                onClick={handleCancelEdit}
                className="bg-gray-100 text-gray-600 px-8 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-all"
              >
                إلغاء التعديل
              </button>
            )}
            <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-blue-700 transition-all shadow-md">
              {editTxId ? 'تحديث العملية' : 'تسجيل الرصيد'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">التاريخ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">الحساب</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">الوصف</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">المبلغ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">العملة</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transactions.map(t => (
              <tr key={t.ID} className="hover:bg-gray-50 transition-colors group">
                <td className="px-6 py-4 text-sm text-gray-500">{t.Date}</td>
                <td className="px-6 py-4 font-semibold">
                  <div>{t.AccountName}</div>
                  {t.Gold_Weight ? (
                    <div className="text-[10px] text-amber-600 font-bold">
                      {t.Gold_Weight}g | عيار {t.Gold_Karat}
                    </div>
                  ) : null}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{t.Description || '-'}</td>
                <td className={`px-6 py-4 text-right font-bold ${t.Type === 'Deposit' ? (t.Amount >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-rose-600'}`}>
                  {t.Type === 'Deposit' ? (t.Amount >= 0 ? '+' : '') : '-'}{formatNumber(t.Amount)}
                </td>
                <td className={`px-6 py-4 text-right font-bold text-xs ${t.Type === 'Deposit' ? (t.Amount >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-rose-600'}`}>
                  {t.Currency}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(t)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="تعديل"
                    >
                      <Pencil size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(t.ID)}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="حذف"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsView({ currencies, onUpdate }: { currencies: Currency[], onUpdate: () => void }) {
  const [rates, setRates] = useState<Record<string, string>>({});
  const [selectedCurr, setSelectedCurr] = useState('');

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [selectedGoldKarat, setSelectedGoldKarat] = useState('GOLD');

  const filteredCurrencies = currencies.filter(c => 
    !c.Currency_Code.includes('Gold') && !c.Currency_Code.includes('GOLD')
  );

  useEffect(() => {
    const initialRates: Record<string, string> = {};
    currencies.forEach(c => {
      initialRates[c.Currency_Code] = c.Exchange_Rate_to_EGP.toString();
    });
    setRates(initialRates);
    if (filteredCurrencies.length > 0 && !selectedCurr) {
      setSelectedCurr(filteredCurrencies[0].Currency_Code);
    }
  }, [currencies]);

  const handleUpdate = async (code: string) => {
    const newRate = parseFloat(rates[code]);
    if (isNaN(newRate)) return;

    await fetch(`/api/currencies/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ Exchange_Rate_to_EGP: newRate })
    });
    onUpdate();
    toast.success(`تم تحديث سعر ${code} بنجاح`);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('كلمة المرور الجديدة وتأكيدها غير متطابقين');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success('تم تحديث كلمة المرور بنجاح!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.error || 'فشل تحديث كلمة المرور');
      }
    } catch (error) {
      console.error('Password update error:', error);
      toast.error('حدث خطأ أثناء محاولة تحديث كلمة المرور');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const selectedCurrencyData = currencies.find(c => c.Currency_Code === selectedCurr);
  const goldData = currencies.find(c => c.Currency_Code === 'GOLD');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Coins className="text-blue-600" />
            إدارة أسعار الصرف والذهب
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">تعديل يدوي للعملات</h4>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">اختر العملة</label>
              <select 
                value={selectedCurr}
                onChange={(e) => setSelectedCurr(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              >
                {filteredCurrencies.map(c => (
                  <option key={c.Currency_Code} value={c.Currency_Code}>{c.Currency_Code}</option>
                ))}
              </select>
            </div>

            {selectedCurrencyData && (
              <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-blue-600 uppercase tracking-widest">{selectedCurrencyData.Currency_Code}</span>
                  <span className="text-[10px] text-gray-400 font-medium">السعر الحالي: {formatNumber(selectedCurrencyData.Exchange_Rate_to_EGP, 2)} ج.م</span>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      step="0.01"
                      value={rates[selectedCurr] || ''} 
                      onChange={(e) => setRates({ ...rates, [selectedCurr]: e.target.value })}
                      className="w-full pl-3 pr-12 py-2 bg-white border border-gray-200 rounded-lg font-bold text-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">ج.م</span>
                  </div>
                  <button 
                    onClick={() => handleUpdate(selectedCurr)}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-bold shadow-sm"
                  >
                    تحديث
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <h4 className="text-sm font-bold text-gray-400 uppercase tracking-wider">تعديل يدوي للذهب</h4>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">اختر العيار</label>
              <select 
                value={selectedGoldKarat}
                onChange={(e) => setSelectedGoldKarat(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all font-bold"
              >
                <option value="GOLD">عيار 24 (Gold 24K)</option>
                <option value="GOLD21">عيار 21 (Gold 21K)</option>
              </select>
            </div>

            {currencies.find(c => c.Currency_Code === selectedGoldKarat) && (
              <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-amber-600 uppercase tracking-widest">
                    {selectedGoldKarat === 'GOLD' ? 'GOLD (24K)' : 'GOLD (21K)'}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    السعر الحالي: {formatNumber(currencies.find(c => c.Currency_Code === selectedGoldKarat)?.Exchange_Rate_to_EGP || 0, 2)} ج.م
                  </span>
                </div>
                
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input 
                      type="number" 
                      step="0.01"
                      value={rates[selectedGoldKarat] || ''} 
                      onChange={(e) => setRates({ ...rates, [selectedGoldKarat]: e.target.value })}
                      className="w-full pl-3 pr-12 py-2 bg-white border border-gray-200 rounded-lg font-bold text-lg focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">ج.م</span>
                  </div>
                  <button 
                    onClick={() => handleUpdate(selectedGoldKarat)}
                    className="bg-amber-500 text-white px-6 py-2 rounded-lg hover:bg-amber-600 transition-colors font-bold shadow-sm"
                  >
                    تحديث
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
        <h4 className="text-blue-800 font-bold mb-2 flex items-center gap-2">
          <TrendingUp size={18} />
          تنبيه
        </h4>
        <p className="text-sm text-blue-700 leading-relaxed">
          تعديل أسعار الصرف سيؤثر فوراً على حساب "إجمالي الأصول" في لوحة التحكم وعلى "المعادل بالجنيه" في جدول الحسابات. 
          بالنسبة للذهب (GOLD)، يتم التعامل مع الرصيد كجرامات ويُضرب في السعر المحدد هنا.
        </p>
      </div>

      {/* Security Settings Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Settings className="text-rose-600" />
          <h3 className="text-lg font-bold">إعدادات الأمان</h3>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6 max-w-md">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">كلمة المرور الحالية</label>
              <input 
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                placeholder="••••••••"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">كلمة المرور الجديدة</label>
                <input 
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">تأكيد كلمة المرور</label>
                <input 
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-rose-500 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <button 
            type="submit"
            disabled={isUpdatingPassword}
            className="w-full bg-rose-600 text-white px-6 py-3 rounded-xl hover:bg-rose-700 disabled:opacity-50 transition-all font-bold shadow-sm flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {isUpdatingPassword ? 'جاري التحديث...' : 'تحديث إعدادات الأمان'}
          </button>
        </form>
      </div>
    </div>
  );
}

function TransactionHistoryView({ 
  transactions, 
  accounts, 
  currencies, 
  onUpdate,
  requestConfirm
}: { 
  transactions: Transaction[], 
  accounts: Account[], 
  currencies: Currency[], 
  onUpdate: () => void,
  requestConfirm: (onConfirm: () => void, message?: string) => void
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedAccountNames, setSelectedAccountNames] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [localTransactions, setLocalTransactions] = useState<Transaction[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalTransactions(transactions);
  }, [transactions]);

  const bidi = bidiFactory();
  const processArabic = (text: string) => {
    if (!text) return '';
    const reshaped = arabicReshaper.convertArabic(text);
    const embeddingLevels = bidi.getEmbeddingLevels(reshaped);
    const flips = bidi.getReorderSegments(reshaped, embeddingLevels);
    let chars = reshaped.split('');
    flips.forEach(([start, end]) => {
      const segment = chars.slice(start, end + 1).reverse();
      for (let i = 0; i <= end - start; i++) {
        chars[start + i] = segment[i];
      }
    });
    return chars.join('');
  };

  const handleCellChange = (id: number, field: keyof Transaction, value: any) => {
    setLocalTransactions(prev => prev.map(t => t.ID === id ? { ...t, [field]: value } : t));
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  const handleDelete = async (id: number) => {
    requestConfirm(async () => {
      try {
        const res = await fetch(`/api/transactions/${id}`, { 
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (res.ok) {
          toast.success('تم حذف العملية وتحديث الرصيد بنجاح');
          // Force a data refresh
          onUpdate();
        } else {
          const errorData = await res.json();
          toast.error(`فشل الحذف: ${errorData.error || 'خطأ غير معروف'}`);
        }
      } catch (error) {
        console.error('Critical Delete Error:', error);
        toast.error('حدث خطأ فني أثناء محاولة الحذف');
      }
    });
  };

  const handleCommit = async () => {
    // If there are deletions, confirm once for all
    if (selectedIds.size > 0) {
      requestConfirm(async () => {
        setIsSaving(true);
        try {
          // 1. Handle Deletions
          for (const id of selectedIds) {
            await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
          }

          // 2. Handle Updates (only for those not deleted)
          const updatedTxs = localTransactions.filter(t => !selectedIds.has(t.ID));
          for (const localTx of updatedTxs) {
            const originalTx = transactions.find(t => t.ID === localTx.ID);
            if (originalTx && (
              originalTx.Date !== localTx.Date ||
              originalTx.Amount !== localTx.Amount ||
              originalTx.Description !== localTx.Description ||
              originalTx.Account_ID !== localTx.Account_ID ||
              originalTx.Gold_Weight !== localTx.Gold_Weight ||
              originalTx.Gold_Karat !== localTx.Gold_Karat
            )) {
              await fetch(`/api/transactions/${localTx.ID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localTx)
              });
            }
          }

          toast.success('تم حفظ التغييرات وتحديث الأرصدة بنجاح');
          setSelectedIds(new Set());
          onUpdate();
        } catch (error) {
          console.error('Error committing changes:', error);
          toast.error('حدث خطأ أثناء حفظ التغييرات');
        } finally {
          setIsSaving(false);
        }
      }, `هل أنت متأكد من رغبتك في حذف ${selectedIds.size} عملية (عمليات) مختارة وحفظ تعديلات الباقي؟`);
    } else {
      // No deletions, just updates
      setIsSaving(true);
      try {
        // 2. Handle Updates
        for (const localTx of localTransactions) {
          const originalTx = transactions.find(t => t.ID === localTx.ID);
          if (originalTx && (
            originalTx.Date !== localTx.Date ||
            originalTx.Amount !== localTx.Amount ||
            originalTx.Description !== localTx.Description ||
            originalTx.Account_ID !== localTx.Account_ID ||
            originalTx.Gold_Weight !== localTx.Gold_Weight ||
            originalTx.Gold_Karat !== localTx.Gold_Karat
          )) {
            await fetch(`/api/transactions/${localTx.ID}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(localTx)
            });
          }
        }

        toast.success('تم حفظ التغييرات وتحديث الأرصدة بنجاح');
        onUpdate();
      } catch (error) {
        console.error('Error committing changes:', error);
        toast.error('حدث خطأ أثناء حفظ التغييرات');
      } finally {
        setIsSaving(false);
      }
    }
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('2026-01-01');
    setEndDate(new Date().toISOString().split('T')[0]);
    setSelectedTypes([]);
    setSelectedAccountNames([]);
    toast.info('تم إعادة ضبط الفلاتر');
  };

  const filteredTransactions = localTransactions.filter(t => {
    const acc = accounts.find(a => a.ID === t.Account_ID);
    const type = (acc?.Type || '').trim();
    const category = (acc?.Category || '').trim();
    const accountName = (t.AccountName || '').trim();
    
    let displayType = type;
    if (type === 'Bank') {
      displayType = `Bank (${category})`;
    }

    const matchesType = selectedTypes.length === 0 || 
                        selectedTypes.includes('All') || 
                        selectedTypes.includes(displayType);

    const matchesAccount = selectedAccountNames.length === 0 ||
                           selectedAccountNames.includes(accountName);

    const matchesSearch = (t.Description || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                         accountName.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Standardize date format for comparison
    const standardizeDate = (d: string) => {
      if (!d) return '';
      // If date is in DD/MM/YYYY format, convert to YYYY-MM-DD
      if (d.includes('/')) {
        const parts = d.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        }
      }
      return d;
    };

    const txDate = standardizeDate(t.Date);
    const sDate = standardizeDate(startDate);
    const eDate = standardizeDate(endDate);

    const matchesDate = txDate >= sDate && txDate <= eDate;
    
    return matchesSearch && matchesDate && matchesType && matchesAccount;
  });

  const availableAccounts = accounts.filter(acc => {
    if (selectedTypes.length === 0 || selectedTypes.includes('All')) return true;
    let displayType: string = acc.Type;
    if (acc.Type === 'Bank') displayType = `Bank (${acc.Category})`;
    return selectedTypes.includes(displayType);
  });

  const downloadCSV = () => {
    const headers = ['Date', 'Account Name', 'Type', 'Description', 'EGP', 'USD', 'GBP', 'SAR', 'EUR', 'AED'];
    const totals: Record<string, number> = { EGP: 0, USD: 0, GBP: 0, SAR: 0, EUR: 0, AED: 0 };

    const toEnglishName = (name: string) => {
      const cleaned = name.replace(/[\u0600-\u06FF]/g, '').trim();
      return cleaned || name;
    };

    // Group transactions by account
    const accountSummary: Record<number, { name: string, type: string, currency: string, total: number }> = {};
    
    const isFilterAll = selectedTypes.length === 0 && selectedAccountNames.length === 0;
    
    // If "All" is selected, pre-populate summary with all customers who have a balance
    if (isFilterAll) {
      accounts.filter(a => a.Type === 'Customer' && Math.abs(a.Balance) > 0.01).forEach(acc => {
        accountSummary[acc.ID] = {
          name: toEnglishName(acc.Name),
          type: 'Customer',
          currency: acc.Currency,
          total: acc.Balance
        };
      });
    }

    filteredTransactions.forEach(t => {
      const acc = accounts.find(a => a.ID === t.Account_ID);
      if (!acc) return;
      
      if (!accountSummary[acc.ID]) {
        let typeDisplay: string = acc.Type;
        if (acc.Type === 'Bank') typeDisplay = `Bank (${acc.Category})`;
        
        let accountNameDisplay = toEnglishName(t.AccountName || acc.Name);
        if (acc.Type === 'Gold' && t.Gold_Weight) {
          const karat = t.Gold_Karat || '??';
          accountNameDisplay = `${accountNameDisplay} (${t.Gold_Weight}g - ${karat}K)`;
        }

        accountSummary[acc.ID] = {
          name: accountNameDisplay,
          type: typeDisplay,
          currency: acc.Currency,
          total: acc.Type === 'Customer' ? acc.Balance : 0
        };
      }

      // Non-customer logic: sum up transactions in the filtered range
      // For Customers, we already set the total to acc.Balance (global) and skip accumulation
      if (acc.Type !== 'Customer') {
        let amount = t.Type === 'Deposit' ? t.Amount : -t.Amount;
        accountSummary[acc.ID].total += amount;
      }
    });

    const rows = Object.values(accountSummary).map(summary => {
      const { name, type, currency, total } = summary;
      if (totals[currency] !== undefined) {
        totals[currency] += total;
      }

      // Convert to absolute value (remove signs) and round to nearest integer
      const absTotal = Math.round(Math.abs(total));
      const formattedTotal = formatNumber(absTotal, 0);

      return [
        endDate, // Use report end date as placeholder for Date column
        name,
        type,
        'Grouped Summary',
        currency === 'EGP' ? formattedTotal : '0',
        currency === 'USD' ? formattedTotal : '0',
        currency === 'GBP' ? formattedTotal : '0',
        currency === 'SAR' ? formattedTotal : '0',
        currency === 'EUR' ? formattedTotal : '0',
        currency === 'AED' ? formattedTotal : '0'
      ];
    });

    const totalsRow = [
      'GRAND TOTAL',
      '',
      '',
      '',
      formatNumber(Math.round(Math.abs(totals.EGP)), 0),
      formatNumber(Math.round(Math.abs(totals.USD)), 0),
      formatNumber(Math.round(Math.abs(totals.GBP)), 0),
      formatNumber(Math.round(Math.abs(totals.SAR)), 0),
      formatNumber(Math.round(Math.abs(totals.EUR)), 0),
      formatNumber(Math.round(Math.abs(totals.AED)), 0)
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      totalsRow.map(cell => `"${cell}"`).join(',')
    ].join('\n');

    const blob = new Blob([`\ufeff${csvContent}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Financial_Report_${startDate}_to_${endDate}.csv`;
    link.click();
  };

  const downloadPDF = async () => {
    toast.info('Generating PDF report...');
    const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Helper to strip Arabic characters for English report
    const toEnglishName = (name: string) => {
      const cleaned = name.replace(/[\u0600-\u06FF]/g, '').trim();
      return cleaned || name; // Fallback to original if stripping results in empty
    };

    // 1. Professional Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(44, 62, 80);
    const reportTitle = selectedAccountNames.length === 1 
      ? `ACTIVITY REPORT FOR: ${toEnglishName(selectedAccountNames[0]).toUpperCase()}`
      : 'FINANCIAL ACTIVITY REPORT';
    doc.text(reportTitle, pageWidth / 2, 20, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(127, 140, 141);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}`, pageWidth / 2, 28, { align: 'center' });

    doc.setFontSize(11);
    doc.setTextColor(52, 73, 94);
    doc.text(`Period: From ${startDate} To ${endDate}`, pageWidth / 2, 33, { align: 'center' });

    // Horizontal Line
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.5);
    doc.line(15, 35, pageWidth - 15, 35);

    // 2. Table Structure
    const headers = [['Account Name', 'Type', 'EGP', 'USD', 'GBP', 'SAR', 'EUR', 'AED']];
    const totals: Record<string, number> = { EGP: 0, USD: 0, GBP: 0, SAR: 0, EUR: 0, AED: 0 };

    // Group transactions by account
    const accountSummary: Record<number, { name: string, type: string, currency: string, total: number }> = {};
    
    const isFilterAll = selectedTypes.length === 0 && selectedAccountNames.length === 0;

    // If "All" is selected, include all customers with balance to see full debts
    if (isFilterAll) {
      accounts.filter(a => a.Type === 'Customer' && Math.abs(a.Balance) > 0.01).forEach(acc => {
        accountSummary[acc.ID] = {
          name: toEnglishName(acc.Name),
          type: 'Customer',
          currency: acc.Currency,
          total: acc.Balance
        };
      });
    }

    filteredTransactions.forEach(t => {
      const acc = accounts.find(a => a.ID === t.Account_ID);
      if (!acc) return;
      
      if (!accountSummary[acc.ID]) {
        let typeDisplay: string = acc.Type;
        if (acc.Type === 'Bank') typeDisplay = `Bank (${acc.Category})`;
        
        let accountNameDisplay = toEnglishName(t.AccountName || acc.Name);
        if (acc.Type === 'Gold' && t.Gold_Weight) {
          const karat = t.Gold_Karat || '??';
          accountNameDisplay = `${accountNameDisplay} (${t.Gold_Weight}g - ${karat}K)`;
        }

        accountSummary[acc.ID] = {
          name: accountNameDisplay,
          type: typeDisplay,
          currency: acc.Currency,
          total: acc.Type === 'Customer' ? acc.Balance : 0
        };
      }

      if (acc.Type !== 'Customer') {
        let amount = t.Type === 'Deposit' ? t.Amount : -t.Amount;
        accountSummary[acc.ID].total += amount;
      }
    });

    const rows = Object.values(accountSummary).map(summary => {
      const { name, type, currency, total } = summary;
      if (totals[currency] !== undefined) {
        totals[currency] += total;
      }

      // Convert to absolute value (remove signs) and round to nearest integer
      const absTotal = Math.round(Math.abs(total));
      const formattedTotal = formatNumber(absTotal, 0);

      const row: any = [
        name,
        type,
        currency === 'EGP' ? formattedTotal : '0',
        currency === 'USD' ? formattedTotal : '0',
        currency === 'GBP' ? formattedTotal : '0',
        currency === 'SAR' ? formattedTotal : '0',
        currency === 'EUR' ? formattedTotal : '0',
        currency === 'AED' ? formattedTotal : '0'
      ];
      // Attach metadata for formatting in didParseCell
      row.isDebt = summary.type === 'Customer' && total < 0;
      return row;
    });

    // 5. Totals Row
    const totalsRow: any = [
      'GRAND TOTAL',
      '',
      formatNumber(Math.round(Math.abs(totals.EGP)), 0),
      formatNumber(Math.round(Math.abs(totals.USD)), 0),
      formatNumber(Math.round(Math.abs(totals.GBP)), 0),
      formatNumber(Math.round(Math.abs(totals.SAR)), 0),
      formatNumber(Math.round(Math.abs(totals.EUR)), 0),
      formatNumber(Math.round(Math.abs(totals.AED)), 0)
    ];
    totalsRow.isTotalsRow = true;
    totalsRow.currencyTotals = totals;

    autoTable(doc, {
      head: headers,
      body: [...rows, totalsRow],
      startY: 45,
      theme: 'striped',
      margin: { left: 15, right: 15 },
      styles: { 
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: 2.5,
        valign: 'middle'
      },
      headStyles: { 
        fillColor: [44, 62, 80], 
        textColor: 255,
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'left', cellWidth: 80 }, // Account Name
        1: { halign: 'left', cellWidth: 40 }, // Type
        2: { halign: 'right', cellWidth: 26 }, // EGP
        3: { halign: 'right', cellWidth: 26 }, // USD
        4: { halign: 'right', cellWidth: 26 }, // GBP
        5: { halign: 'right', cellWidth: 26 }, // SAR
        6: { halign: 'right', cellWidth: 26 }, // EUR
        7: { halign: 'right', cellWidth: 26 }  // AED
      },
      didParseCell: (data) => {
        // Adjust font size for long Account Names (especially Gold with details)
        if (data.column.index === 0 && data.section === 'body') {
          const text = data.cell.text[0];
          if (text.length > 25) {
            data.cell.styles.fontSize = 7; 
          }
        }

        // Apply right alignment to currency headers specifically
        if (data.section === 'head' && data.column.index >= 2) {
          data.cell.styles.halign = 'right';
        }
        
        // Add right padding and conditional formatting to currency columns
        if (data.column.index >= 2) {
          data.cell.styles.cellPadding = { right: 4, left: 2, top: 2.5, bottom: 2.5 };
          
          if (data.section === 'body') {
            const rowRaw: any = data.row.raw;
            if (rowRaw && rowRaw.isDebt) {
              data.cell.styles.textColor = [225, 29, 72]; // Red for Customer Debts
              data.cell.styles.fontStyle = 'bold';
            } else {
              const cellValue = (data.cell.text[0] || '').replace(/,/g, '');
              const numericValue = parseFloat(cellValue);
              
              if (cellValue === '0' || numericValue === 0) {
                data.cell.styles.textColor = [211, 211, 211]; 
                data.cell.styles.fontStyle = 'normal';
              } else {
                data.cell.styles.textColor = [0, 0, 0]; 
                data.cell.styles.fontStyle = 'bold';
              }
            }
          }
        }

        // Bold the Grand Total row
        const rowRaw: any = data.row.raw;
        if (rowRaw && rowRaw.isTotalsRow) {
          data.cell.styles.fillColor = [236, 240, 241];
          if (data.column.index === 0) {
            data.cell.styles.fontStyle = 'bold';
            data.cell.styles.textColor = [44, 62, 80];
          }
          // Color negative totals in red
          if (data.column.index >= 2) {
            const currCols = ['EGP', 'USD', 'GBP', 'SAR', 'EUR', 'AED'];
            const currCode = currCols[data.column.index - 2];
            if (rowRaw.currencyTotals[currCode] < 0) {
              data.cell.styles.textColor = [225, 29, 72]; // Red
            }
          }
        }
      }
    });

    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(149, 165, 166);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }

    doc.save(`Financial_Report_${startDate}_to_${endDate}.pdf`);
    toast.success('Report downloaded successfully');
  };

  return (
    <div className="space-y-6">
      {/* Filters & Search */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-gray-400 uppercase">فلترة حسب نوع الحساب</label>
            <div className="flex flex-wrap gap-2">
              {['All', 'Bank (Business)', 'Bank (Personal)', 'Safe', 'Customer', 'Visa', 'Gold'].map(type => (
                <button
                  key={type}
                  onClick={() => {
                    if (type === 'All') {
                      setSelectedTypes([]);
                      setSelectedAccountNames([]);
                    } else {
                      setSelectedTypes(prev => {
                        const newTypes = prev.includes(type) ? prev.filter(t => t !== type) : [...prev.filter(t => t !== 'All'), type];
                        return newTypes;
                      });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                    (type === 'All' && selectedTypes.length === 0) || selectedTypes.includes(type)
                    ? 'bg-blue-600 border-blue-600 text-white shadow-md'
                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300'
                  }`}
                >
                  {type === 'All' ? 'الكل' : type}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase">اختر حسابات معينة</label>
            <select
              multiple
              value={selectedAccountNames}
              onChange={(e) => {
                const values = Array.from(e.target.selectedOptions, (option: HTMLOptionElement) => option.value);
                setSelectedAccountNames(values);
              }}
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm min-h-[100px]"
            >
              {availableAccounts.map(acc => (
                <option key={acc.ID} value={acc.Name}>{acc.Name}</option>
              ))}
            </select>
            <p className="text-[10px] text-gray-400">اضغط Ctrl (أو Cmd) للاختيار المتعدد</p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase block mb-1">الفترة الزمنية</label>
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400">من:</span>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm min-w-[160px]"
                />
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400">إلى:</span>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-sm min-w-[160px]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-400 uppercase">بحث بالبيان أو الحساب</label>
            <button 
              onClick={handleResetFilters}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              إعادة ضبط الفلاتر (Reset Filters)
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="اكتب للبحث..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-gray-100">
          <button 
            onClick={downloadCSV}
            className="bg-emerald-600 text-white px-6 py-2 rounded-xl hover:bg-emerald-700 transition-colors font-bold shadow-sm flex items-center gap-2"
          >
            <TrendingUp size={18} className="rotate-90" />
            تحميل CSV
          </button>

          <button 
            onClick={downloadPDF}
            className="bg-rose-600 text-white px-6 py-2 rounded-xl hover:bg-rose-700 transition-colors font-bold shadow-sm flex items-center gap-2"
          >
            <FileText size={18} />
            تحميل PDF
          </button>
          
          <div className="flex-1" />

          <button 
            onClick={handleCommit}
            disabled={isSaving}
            className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors font-bold shadow-sm flex items-center gap-2"
          >
            <Save size={18} />
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات (Commit)'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider w-12">
                <input 
                  type="checkbox" 
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(new Set(filteredTransactions.map(t => t.ID)));
                    else setSelectedIds(new Set());
                  }}
                  checked={selectedIds.size === filteredTransactions.length && filteredTransactions.length > 0}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
              </th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">التاريخ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">الحساب</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">المبلغ</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">الوزن (جرام)</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">العيار</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">البيان</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-center">حذف</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredTransactions.map(t => (
              <tr key={t.ID} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(t.ID) ? 'bg-rose-50/50' : ''}`}>
                <td className="px-6 py-4">
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(t.ID)}
                    onChange={() => toggleSelect(t.ID)}
                    className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="date"
                    value={t.Date}
                    onChange={(e) => handleCellChange(t.ID, 'Date', e.target.value)}
                    className="bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-500 w-full"
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={t.Account_ID}
                    onChange={(e) => handleCellChange(t.ID, 'Account_ID', parseInt(e.target.value))}
                    className="bg-transparent border-none p-0 focus:ring-0 font-semibold w-full"
                  >
                    {accounts.map(acc => (
                      <option key={acc.ID} value={acc.ID}>
                        {getAccountLabel(acc)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number"
                    step="1"
                    value={Math.round(t.Amount)}
                    onChange={(e) => handleCellChange(t.ID, 'Amount', parseFloat(e.target.value))}
                    className={`bg-transparent border-none p-0 focus:ring-0 font-bold w-full ${t.Type === 'Deposit' ? (t.Amount >= 0 ? 'text-emerald-600' : 'text-rose-600') : 'text-rose-600'}`}
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number"
                    step="0.01"
                    value={t.Gold_Weight || 0}
                    onChange={(e) => handleCellChange(t.ID, 'Gold_Weight', parseFloat(e.target.value))}
                    className="bg-transparent border-none p-0 focus:ring-0 text-sm text-amber-600 font-bold w-full"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="number"
                    value={t.Gold_Karat || ''}
                    onChange={(e) => handleCellChange(t.ID, 'Gold_Karat', parseInt(e.target.value))}
                    className="bg-transparent border-none p-0 focus:ring-0 text-sm font-bold w-full"
                    placeholder="---"
                  />
                </td>
                <td className="px-6 py-4">
                  <input 
                    type="text"
                    value={t.Description || ''}
                    onChange={(e) => handleCellChange(t.ID, 'Description', e.target.value)}
                    className="bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-600 w-full"
                    placeholder="أضف بياناً..."
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  <button 
                    key={`del-${t.ID}`}
                    onClick={() => handleDelete(t.ID)}
                    className="text-rose-600 hover:bg-rose-50 p-2 rounded-lg transition-colors"
                    title="حذف العملية فوراً"
                  >
                    <X size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredTransactions.length === 0 && (
          <div className="p-12 text-center text-gray-400 space-y-2">
            <p>لا توجد عمليات تطابق البحث</p>
            <p className="text-xs">No transactions found for this filter. Total transactions in DB: {transactions.length}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReportsView({ currencies }: { currencies: Currency[] }) {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());
  const [reportAccounts, setReportAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      // Calculate the first day of the next month as the exclusive end date
      const nextMonth = month === 12 ? 1 : month + 1;
      const nextYear = month === 12 ? year + 1 : year;
      const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
      
      const res = await fetch(`/api/reports/balances?date=${dateStr}`);
      const data = await res.json();
      setReportAccounts(data);
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('فشل تحميل التقرير');
    } finally {
      setLoading(false);
    }
  };

  const financialStatus = useMemo(() => {
    let banks = 0;
    let visa = 0;
    let safe = 0;
    let gold = 0;
    let customers = 0;

    reportAccounts.forEach(acc => {
      const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
      const value = acc.Balance * rate;
      if (acc.Type === 'Bank') banks += value;
      else if (acc.Type === 'Visa') visa += value;
      else if (acc.Type === 'Safe') safe += value;
      else if (acc.Type === 'Gold') gold += value;
      else if (acc.Type === 'Customer') customers += Math.abs(value);
    });

    return {
      banks: Math.round(banks),
      visa: Math.round(visa),
      safe: Math.round(safe),
      gold: Math.round(gold),
      customers: Math.round(customers),
      grandTotal: Math.round(banks + visa + safe + gold + customers)
    };
  }, [reportAccounts, currencies]);

  useEffect(() => {
    fetchReport();
  }, [month, year]);

  const totalEGP = reportAccounts.reduce((sum, acc) => {
    const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
    return sum + (acc.Balance * rate);
  }, 0);

  return (
    <div className="space-y-8" dir="rtl">
      {/* Header & Date Selector */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-2xl">
              <TrendingUp className="text-blue-600" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black">تقارير الفترات الزمنية</h3>
              <p className="text-sm text-gray-400 font-bold">عرض الأرصدة والوضع المالي في تاريخ معين</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase mr-1">الشهر</label>
              <select 
                value={month} 
                onChange={(e) => setMonth(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Intl.DateTimeFormat('ar-EG', { month: 'long' }).format(new Date(2000, i, 1))}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase mr-1">السنة</label>
              <select 
                value={year} 
                onChange={(e) => setYear(parseInt(e.target.value))}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold text-center"
              >
                {[2024, 2025, 2026, 2027].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={fetchReport}
              className="bg-blue-600 text-white px-8 py-2.5 rounded-xl hover:bg-blue-700 transition-all font-bold shadow-lg shadow-blue-100 active:scale-95"
            >
              تحديث التقرير
            </button>
          </div>
        </div>
      </div>

      {/* Financial Status Report Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-2 px-2">
          <div className="w-2 h-8 bg-blue-600 rounded-full" />
          <h3 className="text-2xl font-black text-gray-900">تقرير حالة المركز المالي (Financial Status Report)</h3>
        </div>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex items-center justify-between">
            <h4 className="text-lg font-black text-gray-800 flex items-center gap-2">
              <LayoutDashboard size={20} className="text-blue-600" />
              إجماليات المركز المالي (Summary Metrics)
            </h4>
            <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">EGP Equivalent</span>
          </div>

          <div className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <SummaryItem label="إجمالي البنوك (Total Banks)" value={financialStatus.banks} icon={<Banknote size={18} />} color="blue" />
              <SummaryItem label="إجمالي الخزنة (Total Safe)" value={financialStatus.safe} icon={<Wallet size={18} />} color="emerald" />
              <SummaryItem label="إجمالي الفيزا (Total Visa)" value={financialStatus.visa} icon={<TrendingUp size={18} />} color="indigo" />
              <SummaryItem label="إجمالي الذهب (Total Gold)" value={financialStatus.gold} icon={<Coins size={18} />} color="amber" />
              <SummaryItem label="إجمالي العملاء (Total Customers)" value={financialStatus.customers} icon={<Users size={18} />} color="rose" />
            </div>

            <div className="mt-8 pt-8 border-t border-dashed border-gray-200 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center md:text-right">
                <p className="text-sm font-bold text-gray-400 uppercase tracking-[0.2em]">الإجمالي العام (Grand Total)</p>
                <p className="text-xs text-gray-400 font-medium italic">مجموع السيولة والمديونيات بالمعادل المحلي</p>
              </div>
              <div className="bg-blue-600 text-white px-10 py-5 rounded-[2rem] shadow-xl shadow-blue-200 flex items-center gap-4 group transition-transform hover:scale-[1.02]">
                <div className="text-left">
                  <span className="block text-[10px] font-black opacity-60 uppercase tracking-widest mb-0.5">Final Net Value</span>
                  <span className="text-4xl font-black">{formatNumber(financialStatus.grandTotal, 0)}</span>
                </div>
                <div className="h-10 w-px bg-white/20 mx-2" />
                <span className="text-xl font-black opacity-80">EGP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">إجمالي الثروة (صافي)</p>
            <p className="text-3xl font-black text-gray-800">
              {formatNumber(totalEGP, 0)} <span className="text-sm font-bold text-gray-400">ج.م</span>
            </p>
          </div>
          <div className="bg-blue-50 p-4 rounded-2xl text-blue-600">
            <Coins size={32} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase mb-1">عدد الحسابات النشطة</p>
            <p className="text-3xl font-black text-gray-800">
              {reportAccounts.filter(a => a.Balance !== 0).length}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-2xl text-gray-400">
            <Users size={32} />
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
          <FileText className="text-blue-600" size={20} />
          <h4 className="font-bold">تفاصيل أرصدة الحسابات</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">الحساب</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">النوع</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">العملة</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">الرصيد التاريخي</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">المعادل (ج.م)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reportAccounts.map(acc => {
                const rate = currencies.find(c => c.Currency_Code === acc.Currency)?.Exchange_Rate_to_EGP || 1;
                return (
                  <tr key={acc.ID} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800">{acc.Name}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        acc.Type === 'Bank' ? 'bg-blue-100 text-blue-700' :
                        acc.Type === 'Safe' ? 'bg-emerald-100 text-emerald-700' :
                        acc.Type === 'Gold' ? 'bg-amber-100 text-amber-700' :
                        acc.Type === 'Visa' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {acc.Type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-500">{acc.Currency}</td>
                    <td className="px-6 py-4 text-right font-black text-gray-900 tracking-tight">
                      {formatNumber(acc.Balance, acc.Type === 'Gold' ? 3 : 0)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-blue-600 tracking-tight">
                      {formatNumber(acc.Balance * rate, 0)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryItem({ label, value, icon, color }: { label: string, value: number, icon: React.ReactNode, color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    indigo: 'text-indigo-600 bg-indigo-50',
    amber: 'text-amber-600 bg-amber-50',
    rose: 'text-rose-600 bg-rose-50'
  };

  return (
    <div className="flex items-center gap-4 group">
      <div className={`p-4 rounded-2xl transition-transform group-hover:scale-110 duration-300 ${colorMap[color]}`}>
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">
          {formatNumber(value, 0)} <span className="text-xs font-bold text-gray-300">EGP</span>
        </p>
      </div>
    </div>
  );
}




