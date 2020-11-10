import {
  BodyParams,
  Controller,
  Get,
  Inject,
  PathParams,
  Post,
} from "@tsed/common";
import { BlockChain } from "../models/BlockChain";
import { v1 as uuid } from "uuid";
import { PaymentTransaction } from "../models/PaymentTransaction";
import axios, { AxiosResponse } from "axios";
import { HashBlock, TransactionType } from "../interfaces";
import { postBroadcast } from "../utils";
import { KeyMaker } from "../models/KeyMaker";

@Controller("/")
export class BlockChainController {
  private nodeAddress = uuid().split("-").join("");
  constructor(
    @Inject() public block: BlockChain,
    @Inject() public keyMaker: KeyMaker
  ) {}

  @Get("/blockchain")
  async getChain() {
    return this.block;
  }

  @Get("/mine")
  async mine() {
    const lastBlock = this.block.getLastBlock();
    const previousBlockHash = lastBlock["hash"] as String;
    const currentBlockData = {
      transactions: this.block.pendingPaymentTransactions,
      index: lastBlock["index"] + 1,
    };
    const nonce = this.block.proofOfWork(previousBlockHash, currentBlockData);
    const blockHash = this.block.hashBlock(
      previousBlockHash,
      currentBlockData,
      nonce
    );
    const newBlock = this.block.createNewBlock(
      nonce,
      previousBlockHash,
      blockHash
    );
    try {
      const requestPromises: Promise<AxiosResponse<any>>[] = postBroadcast<
        HashBlock
      >("recieve-new-block", this.block, newBlock);

      await axios.all(requestPromises);
      // const transaction: PaymentTransaction = {
      //   transactionType: TransactionType.mine,
      //   data: 12.5,
      //   sender: "00",
      //   recipient: this.nodeAddress,
      // };
      // await axios.post(`${this.block.currentNodeUrl}/transaction/broadcast`, {
      //   transaction,
      //   signature: this.keyMaker.signNodeData(transaction),
      // });

      return {
        note: "New block mined & broadcast successfully",
        block: newBlock,
      };
    } catch (error) {
      console.error(error);
    }
  }

  @Post("/recieve-new-block")
  recieveNewBlock(@BodyParams("newBlock") newBlock: HashBlock) {
    const lastBlock = this.block.getLastBlock();
    const correctHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock["index"] + 1 === newBlock["index"];

    if (correctHash && correctIndex) {
      this.block.chain.push(newBlock);
      this.block.pendingPaymentTransactions = [];
      return {
        note: "New block received and accepted.",
        newBlock: newBlock,
      };
    } else {
      return {
        note: "New block rejected.",
        newBlock: newBlock,
      };
    }
  }

  @Get("/consensus")
  async consensus() {
    const requestPromises: Promise<AxiosResponse<BlockChain>>[] = [];
    this.block.networkNodes.forEach((networkNodeUrl) => {
      requestPromises.push(axios.get(`${networkNodeUrl}/blockchain`));
    });

    const blockchains = await axios.all(requestPromises);
    const currentChainLength = this.block.chain.length;
    let maxChainLength = currentChainLength;
    let newLongestChain: HashBlock[] = [];
    let newPendingTransactions: PaymentTransaction[] = [];

    blockchains.forEach((blockchain) => {
      if (blockchain.data.chain.length > maxChainLength) {
        maxChainLength = blockchain.data.chain.length;
        newLongestChain = blockchain.data.chain;
        newPendingTransactions = blockchain.data.pendingPaymentTransactions;
      }
    });

    if (
      !newLongestChain ||
      (newLongestChain && !this.block.chainIsValid(newLongestChain))
    ) {
      return {
        note: "Current chain has not been replaced.",
        chain: this.block.chain,
      };
    } else {
      this.block.chain = newLongestChain;
      this.block.pendingPaymentTransactions = newPendingTransactions;
      return {
        note: "This chain has been replaced.",
        chain: this.block.chain,
      };
    }
  }

  @Get("/block/:blockHash")
  getBlockByHash(@PathParams("blockHash") hash: String) {
    const correctBlock = this.block.getBlock(hash);
    return { block: correctBlock };
  }
}
