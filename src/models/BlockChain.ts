import { HashBlock, Transaction } from "../interfaces";

import { PaymentTransaction } from "./PaymentTransaction";
import { sha256 } from "sha.js";
import { ProviderScope, Scope } from "@tsed/common";
const currentNodeUrls = `${process.argv[3]}/rest`;
@Scope(ProviderScope.SINGLETON)
export class BlockChain {
  public chain: HashBlock[];
  public networkNodes: String[];
  public pendingPaymentTransactions: PaymentTransaction[];
  public currentNodeUrl = currentNodeUrls;
  //   public pendingCourseTransactions: CourseTransaction[];
  constructor() {
    this.chain = [];
    this.networkNodes = [];
    this.pendingPaymentTransactions = [];
    this.createNewBlock(100, "0", "0");
  }

  createNewBlock(
    nonce: number,
    previousBlockHash: String,
    hash: String
  ): HashBlock {
    const newBlock = {
      index: this.chain.length + 1,
      timestamp: Date.now(),
      transactions: [...this.pendingPaymentTransactions],
      nonce: nonce,
      hash: hash,
      previousBlockHash: previousBlockHash,
    };

    // this.pendingCourseTransactions = [];
    this.pendingPaymentTransactions = [];
    this.chain.push(newBlock);

    return newBlock;
  }

  getLastBlock() {
    return this.chain[this.chain.length - 1];
  }

  addTransactionToPendingTransaction(transaction: PaymentTransaction) {
    this.pendingPaymentTransactions.push(transaction);
    return this.getLastBlock()["index"] + 1;
  }
  hashBlock(
    previousBlockHash: String,
    currentBlockData: HashBlock,
    nonce: number
  ) {
    const dataAsString =
      previousBlockHash + nonce.toString() + JSON.stringify(currentBlockData);
    const hash = new sha256().update(dataAsString).digest("hex");

    return hash;
  }

  proofOfWork(previousBlockHash: String, currentBlockData: HashBlock) {
    let nonce = 0;
    let hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    while (hash.substring(0, 4) !== "0000") {
      nonce++;
      hash = this.hashBlock(previousBlockHash, currentBlockData, nonce);
    }

    return nonce;
  }

  chainIsValid(blockchain: HashBlock[]) {
    let validChain = true;

    for (var i = 1; i < blockchain.length; i++) {
      const currentBlock = blockchain[i];
      const prevBlock = blockchain[i - 1];
      const blockHash = this.hashBlock(
        prevBlock["hash"] as String,
        {
          transactions: currentBlock["transactions"],
          index: currentBlock["index"],
        },
        currentBlock["nonce"] as number
      );
      if (blockHash.substring(0, 4) !== "0000") validChain = false;
      if (currentBlock["previousBlockHash"] !== prevBlock["hash"])
        validChain = false;
    }

    const genesisBlock = blockchain[0];
    const correctNonce = genesisBlock["nonce"] === 100;
    const correctPreviousBlockHash = genesisBlock["previousBlockHash"] === "0";
    const correctHash = genesisBlock["hash"] === "0";
    const correctTransactions = genesisBlock["transactions"].length === 0;

    if (
      !correctNonce ||
      !correctPreviousBlockHash ||
      !correctHash ||
      !correctTransactions
    )
      validChain = false;

    return validChain;
  }

  getBlock(blockHash: String) {
    let correctBlock = null;
    this.chain.forEach((block) => {
      if (block.hash === blockHash) correctBlock = block;
    });
    return correctBlock;
  }
  getTransaction(transactionId: String) {
    let correctTransaction = null;
    let correctBlock = null;

    this.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        if (transaction.transactionId === transactionId) {
          correctTransaction = transaction;
          correctBlock = block;
        }
      });
    });

    return {
      transaction: correctTransaction,
      block: correctBlock,
    };
  }

  getAddressData(address: String) {
    const addressTransactions: Transaction<number>[] = [];
    this.chain.forEach((block) => {
      block.transactions.forEach((transaction) => {
        if (
          transaction.sender === address ||
          transaction.recipient === address
        ) {
          addressTransactions.push(transaction);
        }
      });
    });

    let balance = 0;
    addressTransactions.forEach((transaction) => {
      if (transaction.recipient === address) balance += transaction.data;
      else if (transaction.sender === address) balance -= transaction.data;
    });

    return {
      addressTransactions: addressTransactions,
      addressBalance: balance,
    };
  }
}
