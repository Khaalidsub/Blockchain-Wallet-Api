import {
  BodyParams,
  Controller,
  Get,
  Inject,
  PathParams,
  Post,
} from "@tsed/common";
import axios, { AxiosResponse } from "axios";
import { v1 as uuid } from "uuid";
import { BlockChain } from "../models/BlockChain";
import { KeyMaker } from "../models/KeyMaker";
import { PaymentTransaction } from "../models/PaymentTransaction";
import { postBroadcast } from "../utils";

@Controller("/payment-transaction")
export class PaymentTransactionController {
  constructor(
    @Inject() public block: BlockChain,
    @Inject() public keyMaker: KeyMaker
  ) {}
  @Post("/transaction")
  addTransaction(
    @BodyParams() transaction: PaymentTransaction,
    @BodyParams() signature: string
  ) {
    const result = this.keyMaker.verifySignature(transaction, signature);
    if (result) {
      const blockIndex = this.block.addTransactionToPendingTransaction(
        transaction
      );
      return { note: `Transaction will be added in block ${blockIndex}.` };
    }
    return {
      note: `${transaction.transactionId} has some problems,hence it will not be added!`,
    };
  }

  @Post("/transaction/broadcast")
  async broadCastTransaction(
    @BodyParams("transaction") transaction: PaymentTransaction,
    @BodyParams("signature") signature: string
  ) {
    const newTransaction = { ...transaction, transactionId: uuid() };

    const result = this.keyMaker.verifySignature(transaction, signature);
    if (result) {
      this.block.addTransactionToPendingTransaction(newTransaction);

      const requestPromises: Promise<AxiosResponse<any>>[] = postBroadcast<
        PaymentTransaction
      >("transaction", this.block, transaction);

      await axios.all(requestPromises);

      return { note: "Transaction created and broadcast successfully." };
    }
    return {
      note: `${transaction.transactionId} has some problems,hence it will not be added!`,
    };
  }
  @Get("/transaction/:transactionId")
  getTransaction(@PathParams("transactionId") id: String) {
    const transaction = this.block.getTransaction(id);
    return { transaction: transaction.transaction, block: transaction.block };
  }

  @Get("/address/:address")
  getAddress(@PathParams("address") address: String) {
    const addressData = this.block.getAddressData(address);
    return { addressData: addressData };
  }
}
