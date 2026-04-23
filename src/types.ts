export type AccountType = 'Bank' | 'Safe' | 'Customer' | 'Gold' | 'Visa';
export type TransactionType = 'Deposit' | 'Withdrawal';

export interface Account {
  ID: number;
  Name: string;
  Type: AccountType;
  Category: 'Business' | 'Personal';
  Currency: string;
  Balance: number;
  Minimum_Balance: number;
  Purchase_Price: number;
}

export interface Transaction {
  ID: number;
  Date: string;
  Account_ID: number;
  AccountName?: string;
  Currency?: string;
  Amount: number;
  Type: TransactionType;
  Description: string;
  Gold_Weight?: number;
  Gold_Karat?: number;
  Added_By?: string;
}

export interface Currency {
  Currency_Code: string;
  Exchange_Rate_to_EGP: number;
}
