import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';
import cors from 'cors';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database('finance_manager.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS Currencies (
    Currency_Code TEXT PRIMARY KEY,
    Exchange_Rate_to_EGP REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS Accounts (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Type TEXT CHECK(Type IN ('Bank', 'Safe', 'Customer', 'Gold', 'Visa')) NOT NULL,
    Category TEXT CHECK(Category IN ('Business', 'Personal')) DEFAULT 'Personal',
    Currency TEXT NOT NULL,
    Balance REAL DEFAULT 0,
    Minimum_Balance REAL DEFAULT 0,
    Purchase_Price REAL DEFAULT 0,
    FOREIGN KEY (Currency) REFERENCES Currencies(Currency_Code)
  );

  CREATE TABLE IF NOT EXISTS Transactions (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Date TEXT NOT NULL,
    Account_ID INTEGER NOT NULL,
    Amount REAL NOT NULL,
    Type TEXT CHECK(Type IN ('Deposit', 'Withdrawal')) NOT NULL,
    Description TEXT,
    Gold_Weight REAL DEFAULT 0,
    Gold_Karat INTEGER,
    FOREIGN KEY (Account_ID) REFERENCES Accounts(ID)
  );

  CREATE TABLE IF NOT EXISTS Settings (
    Key TEXT PRIMARY KEY,
    Value TEXT
  );

  INSERT OR IGNORE INTO Settings (Key, Value) VALUES ('password', 'Ahmed2026');
`);

// Migration: Add Category column if it doesn't exist
try {
  db.exec("ALTER TABLE Accounts ADD COLUMN Category TEXT CHECK(Category IN ('Business', 'Personal')) DEFAULT 'Personal'");
} catch (e) {
  // Column might already exist
}

// Migration: Update Accounts table CHECK constraint to include 'Visa'
try {
  const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='Accounts'").get() as { sql: string };
  if (tableInfo && !tableInfo.sql.includes("'Visa'")) {
    console.log("Migrating Accounts table to update CHECK constraint...");
    db.transaction(() => {
      db.exec("ALTER TABLE Accounts RENAME TO Accounts_old");
      db.exec(`
        CREATE TABLE Accounts (
          ID INTEGER PRIMARY KEY AUTOINCREMENT,
          Name TEXT NOT NULL,
          Type TEXT CHECK(Type IN ('Bank', 'Safe', 'Customer', 'Gold', 'Visa')) NOT NULL,
          Currency TEXT NOT NULL,
          Balance REAL DEFAULT 0,
          Minimum_Balance REAL DEFAULT 0,
          Purchase_Price REAL DEFAULT 0,
          FOREIGN KEY (Currency) REFERENCES Currencies(Currency_Code)
        )
      `);
      db.exec("INSERT INTO Accounts (ID, Name, Type, Currency, Balance, Minimum_Balance, Purchase_Price) SELECT ID, Name, Type, Currency, Balance, Minimum_Balance, Purchase_Price FROM Accounts_old");
      db.exec("DROP TABLE Accounts_old");
    })();
    console.log("Migration completed successfully.");
  }
} catch (e) {
  console.error("Migration failed:", e);
}

// Migration: Add missing columns if they don't exist
try {
  db.exec("ALTER TABLE Accounts ADD COLUMN Minimum_Balance REAL DEFAULT 0");
} catch (e) {
  // Column might already exist
}
try {
  db.exec("ALTER TABLE Accounts ADD COLUMN Purchase_Price REAL DEFAULT 0");
} catch (e) {
  // Column might already exist
}

try {
  db.exec("ALTER TABLE Transactions ADD COLUMN Gold_Weight REAL DEFAULT 0");
} catch (e) {}
try {
  db.exec("ALTER TABLE Transactions ADD COLUMN Gold_Karat INTEGER");
} catch (e) {}
try {
  db.exec("ALTER TABLE Transactions ADD COLUMN Added_By TEXT");
} catch (e) {}

// Seed Currencies if empty
const currencyCount = db.prepare('SELECT COUNT(*) as count FROM Currencies').get() as { count: number };
if (currencyCount.count === 0) {
  const insertCurrency = db.prepare('INSERT INTO Currencies (Currency_Code, Exchange_Rate_to_EGP) VALUES (?, ?)');
  const initialCurrencies = [
    ['EGP', 1.0],
    ['USD', 48.0],
    ['GBP', 60.0],
    ['SAR', 12.8],
    ['EUR', 52.0],
    ['AED', 13.1],
    ['GOLD', 3100.0],
    ['GOLD21', 2712.5]
  ];
  for (const [code, rate] of initialCurrencies) {
    insertCurrency.run(code, rate);
  }
}

// Ensure GOLD21 exists if already seeded
db.prepare('INSERT OR IGNORE INTO Currencies (Currency_Code, Exchange_Rate_to_EGP) VALUES (?, ?)').run('GOLD21', 2712.5);

import PDFDocument from 'pdfkit';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // PDF Export Route
  app.get('/api/reports/pdf', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ error: 'Date is required' });

    try {
      const accounts = db.prepare('SELECT * FROM Accounts').all() as any[];
      const currencies = db.prepare('SELECT * FROM Currencies').all() as any[];
      
      const reportBalances = accounts.map(account => {
        const futureTransactions = db.prepare(`
          SELECT SUM(CASE WHEN Type = 'Deposit' THEN Amount ELSE -Amount END) as net_change
          FROM Transactions
          WHERE Account_ID = ? AND Date > ?
        `).get(account.ID, date) as { net_change: number | null };

        const netChangeAfterDate = futureTransactions.net_change || 0;
        return {
          ...account,
          Balance: account.Balance - netChangeAfterDate
        };
      });

      const doc = new PDFDocument({ margin: 50 });
      let filename = `Finance_Report_${date}.pdf`;
      
      res.setHeader('Content-disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);

      // Header
      doc.fontSize(20).text('Financial Status Report', { align: 'center' });
      doc.fontSize(10).text(`Report Date: ${date}`, { align: 'center' });
      doc.moveDown();
      doc.text('------------------------------------------------------------', { align: 'center' });
      doc.moveDown();

      // Summary Section
      doc.fontSize(14).text('Summary Metrics (EGP Equivalent)', { underline: true });
      doc.moveDown(0.5);

      const totalSafe = reportBalances
        .filter(a => a.Type === 'Safe')
        .reduce((sum, a) => {
          const rate = currencies.find(c => c.Currency_Code === a.Currency)?.Exchange_Rate_to_EGP || 1;
          return sum + (a.Balance * rate);
        }, 0);

      const totalCustomer = reportBalances
        .filter(a => a.Type === 'Customer')
        .reduce((sum, a) => {
          const rate = currencies.find(c => c.Currency_Code === a.Currency)?.Exchange_Rate_to_EGP || 1;
          return sum + (a.Balance * rate);
        }, 0);

      doc.fontSize(12).text(`Safe Balance: ${totalSafe.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP`);
      doc.text(`Customer Receivables: ${totalCustomer.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} EGP`);
      doc.moveDown();

      // Accounts Table
      doc.fontSize(14).text('Account Details', { underline: true });
      doc.moveDown(0.5);

      // Table Header
      const tableTop = doc.y;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Account Name', 50, tableTop);
      doc.text('Type', 200, tableTop);
      doc.text('Currency', 300, tableTop);
      doc.text('Balance', 400, tableTop, { align: 'right', width: 100 });
      
      doc.moveDown();
      doc.font('Helvetica');
      doc.text('-------------------------------------------------------------------------------------------------------');
      doc.moveDown(0.5);

      reportBalances.forEach(acc => {
        if (doc.y > 700) doc.addPage();
        const y = doc.y;
        doc.text(acc.Name, 50, y);
        doc.text(acc.Type, 200, y);
        doc.text(acc.Currency, 300, y);
        doc.text(acc.Balance.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }), 400, y, { align: 'right', width: 100 });
        doc.moveDown(0.5);
      });

      doc.end();
    } catch (error: any) {
      console.error('PDF Generation Error:', error);
      res.status(500).json({ error: 'Failed to generate PDF' });
    }
  });

  // Auth Routes
  app.post('/api/login', (req, res) => {
    const { password } = req.body;
    const storedPassword = db.prepare('SELECT Value FROM Settings WHERE Key = ?').get('password') as { Value: string };
    if (storedPassword && password === storedPassword.Value) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'كلمة المرور غير صحيحة' });
    }
  });

  app.post('/api/settings/change-password', (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const storedPassword = db.prepare('SELECT Value FROM Settings WHERE Key = ?').get('password') as { Value: string };
    
    if (!storedPassword || currentPassword !== storedPassword.Value) {
      return res.status(400).json({ success: false, error: 'كلمة المرور الحالية غير صحيحة' });
    }

    db.prepare('UPDATE Settings SET Value = ? WHERE Key = ?').run(newPassword, 'password');
    res.json({ success: true, message: 'تم تحديث كلمة المرور بنجاح' });
  });

  // API Routes
  app.get('/api/accounts', (req, res) => {
    const accounts = db.prepare('SELECT * FROM Accounts').all();
    res.json(accounts);
  });

  app.post('/api/accounts', (req, res) => {
    const { Name, Type, Category, Currency, Balance, Minimum_Balance, Purchase_Price } = req.body;
    const info = db.prepare('INSERT INTO Accounts (Name, Type, Category, Currency, Balance, Minimum_Balance, Purchase_Price) VALUES (?, ?, ?, ?, ?, ?, ?)').run(Name, Type, Category || 'Personal', Currency, Balance || 0, Minimum_Balance || 0, Purchase_Price || 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.patch('/api/accounts/:id/balance', (req, res) => {
    const { id } = req.params;
    const { Balance } = req.body;
    db.prepare('UPDATE Accounts SET Balance = ? WHERE ID = ?').run(Balance, id);
    res.json({ success: true });
  });

  app.patch('/api/accounts/:id', (req, res) => {
    const { id } = req.params;
    const { Name, Type, Category } = req.body;
    db.prepare('UPDATE Accounts SET Name = ?, Type = ?, Category = ? WHERE ID = ?').run(Name, Type, Category, id);
    res.json({ success: true });
  });

  app.get('/api/transactions', (req, res) => {
    const transactions = db.prepare(`
      SELECT t.*, a.Name as AccountName, a.Currency 
      FROM Transactions t 
      JOIN Accounts a ON t.Account_ID = a.ID 
      ORDER BY Date DESC
    `).all();
    res.json(transactions);
  });

  app.post('/api/transactions', (req, res) => {
    const { Date, Account_ID, Amount, Type, Description, Gold_Weight, Gold_Karat, Added_By } = req.body;
    
    const transaction = db.transaction(() => {
      const account = db.prepare('SELECT Type FROM Accounts WHERE ID = ?').get(Account_ID) as { Type: string };
      // Insert transaction
      db.prepare('INSERT INTO Transactions (Date, Account_ID, Amount, Type, Description, Gold_Weight, Gold_Karat, Added_By) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(Date, Account_ID, Amount, Type, Description, Gold_Weight || 0, Gold_Karat || null, Added_By || null);
      
      // Update account balance
      // For Customers: positive balance means "they owe us" (Withdrawal adds)
      // For Banks/Cash: positive balance means "we have money" (Deposit adds)
      let adjustment = 0;
      if (account.Type === 'Customer') {
        adjustment = Type === 'Withdrawal' ? Amount : -Amount;
      } else {
        adjustment = Type === 'Deposit' ? Amount : -Amount;
      }
      db.prepare('UPDATE Accounts SET Balance = Balance + ? WHERE ID = ?').run(adjustment, Account_ID);
    });

    transaction();
    res.json({ success: true });
  });

  app.put('/api/transactions/:id', (req, res) => {
    const { id } = req.params;
    const { Date, Account_ID, Amount, Type, Description, Added_By } = req.body;
    
    const updateTx = db.transaction(() => {
      const oldTx = db.prepare('SELECT t.*, a.Type as AccountType FROM Transactions t JOIN Accounts a ON t.Account_ID = a.ID WHERE t.ID = ?').get(id) as any;
      if (!oldTx) throw new Error('Transaction not found');

      const account = db.prepare('SELECT Type FROM Accounts WHERE ID = ?').get(Account_ID) as { Type: string };

      // 1. Reverse the old transaction's effect on the account balance
      let reverseAdjustment = 0;
      if (oldTx.AccountType === 'Customer') {
        reverseAdjustment = oldTx.Type === 'Withdrawal' ? -oldTx.Amount : oldTx.Amount;
      } else {
        reverseAdjustment = oldTx.Type === 'Deposit' ? -oldTx.Amount : oldTx.Amount;
      }
      db.prepare('UPDATE Accounts SET Balance = Balance + ? WHERE ID = ?').run(reverseAdjustment, oldTx.Account_ID);

      // 2. Apply the new transaction's effect on the account balance
      let newAdjustment = 0;
      if (account.Type === 'Customer') {
        newAdjustment = Type === 'Withdrawal' ? Amount : -Amount;
      } else {
        newAdjustment = Type === 'Deposit' ? Amount : -Amount;
      }
      db.prepare('UPDATE Accounts SET Balance = Balance + ? WHERE ID = ?').run(newAdjustment, Account_ID);

      // 3. Update the transaction record
      db.prepare(`
        UPDATE Transactions 
        SET Date = ?, Account_ID = ?, Amount = ?, Type = ?, Description = ?, Added_By = ? 
        WHERE ID = ?
      `).run(Date, Account_ID, Amount, Type, Description, Added_By || null, id);
    });

    try {
      updateTx();
      res.json({ success: true });
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  });

  app.get('/api/reports/balances', (req, res) => {
    const { date } = req.query; // Expected format: YYYY-MM-DD (exclusive end date)
    if (!date) return res.status(400).json({ error: 'Date is required' });

    const accounts = db.prepare('SELECT * FROM Accounts').all() as any[];
    const reportBalances = accounts.map(account => {
      // Current balance - sum of transactions AFTER the target date
      const typeFactor = account.Type === 'Customer' ? 'Withdrawal' : 'Deposit';
      const futureTransactions = db.prepare(`
        SELECT SUM(CASE WHEN Type = ? THEN Amount ELSE -Amount END) as net_change
        FROM Transactions
        WHERE Account_ID = ? AND Date >= ?
      `).get(typeFactor, account.ID, date) as { net_change: number | null };

      const netChangeAfterDate = futureTransactions.net_change || 0;
      return {
        ...account,
        Balance: account.Balance - netChangeAfterDate
      };
    });

    res.json(reportBalances);
  });

  app.get('/api/currencies', (req, res) => {
    const currencies = db.prepare('SELECT * FROM Currencies').all();
    const lastUpdated = db.prepare('SELECT Value FROM Settings WHERE Key = ?').get('Last_Updated') as { Value: string } | undefined;
    res.json({ currencies, lastUpdated: lastUpdated?.Value });
  });

  app.put('/api/currencies/:code', (req, res) => {
    const { code } = req.params;
    const { Exchange_Rate_to_EGP } = req.body;
    db.prepare('INSERT OR REPLACE INTO Currencies (Currency_Code, Exchange_Rate_to_EGP) VALUES (?, ?)').run(code, Exchange_Rate_to_EGP);
    res.json({ success: true });
  });

  app.delete('/api/transactions/:id', (req, res) => {
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid transaction ID' });
    }
    
    try {
      const deleteTx = db.transaction(() => {
        const tx = db.prepare('SELECT t.*, a.Type as AccountType FROM Transactions t JOIN Accounts a ON t.Account_ID = a.ID WHERE t.ID = ?').get(id) as any;
        if (!tx) {
          throw new Error('Transaction not found');
        }

        // Reverse balance impact
        let adjustment = 0;
        if (tx.AccountType === 'Customer') {
          adjustment = tx.Type === 'Withdrawal' ? -tx.Amount : tx.Amount;
        } else {
          adjustment = tx.Type === 'Deposit' ? -tx.Amount : tx.Amount;
        }
        db.prepare('UPDATE Accounts SET Balance = Balance + ? WHERE ID = ?').run(adjustment, tx.Account_ID);

        // Delete the transaction
        const result = db.prepare('DELETE FROM Transactions WHERE ID = ?').run(id);
        if (result.changes === 0) {
          throw new Error('Failed to delete transaction');
        }
      });

      deleteTx();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete transaction error:', error);
      res.status(error.message === 'Transaction not found' ? 404 : 500).json({ 
        error: error.message || 'Internal server error' 
      });
    }
  });

  app.delete('/api/accounts/:id/transactions', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid account ID' });

    try {
      const clearTransactions = db.transaction(() => {
        db.prepare('DELETE FROM Transactions WHERE Account_ID = ?').run(id);
        db.prepare('UPDATE Accounts SET Balance = 0 WHERE ID = ?').run(id);
      });

      clearTransactions();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Clear transactions error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.delete('/api/accounts/:id', (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid account ID' });

    try {
      const deleteAccount = db.transaction(() => {
        // Cascade delete transactions first
        db.prepare('DELETE FROM Transactions WHERE Account_ID = ?').run(id);
        // Delete account
        const result = db.prepare('DELETE FROM Accounts WHERE ID = ?').run(id);
        if (result.changes === 0) throw new Error('Account not found');
      });

      deleteAccount();
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('Closing database connection...');
    db.close();
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  });
}

startServer();
