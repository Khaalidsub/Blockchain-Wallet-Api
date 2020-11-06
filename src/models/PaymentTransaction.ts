import { Transaction, TransactionType } from "../interfaces";

export class PaymentTransaction implements Transaction<number> {
  constructor(
    public sender: String,
    public recipient: String,
    public transactionType: TransactionType,
    public data: number,
    public transactionId?: String
  ) {}
}
