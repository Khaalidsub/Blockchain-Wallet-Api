export interface Transaction<T> {
  transactionId?: String;
  sender: String;
  recipient: String;
  data: T;
}

export interface HashBlock {
  index: number;
  timestamp?: number;
  transactions: Transaction<number>[];
  nonce?: number;
  hash?: String;
  previousBlockHash?: String;
}

export enum TransactionType {
  topup,
  register,
  mine,
  certificate,
}

export interface data {}
