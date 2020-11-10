import { BodyParams, Controller, Get, Inject, Post } from "@tsed/common";
import axios, { AxiosResponse } from "axios";
import { KeyObject } from "crypto";
import { BlockChain } from "../models/BlockChain";
import { KeyMaker } from "../models/KeyMaker";
import { postBroadcast } from "../utils";

@Controller("/keymaker")
export class KeyMakerController {
  constructor(
    @Inject() public keyMaker: KeyMaker,
    @Inject() public block: BlockChain
  ) {}
  //create new keys <.<
  @Get("/generate")
  generateKeys() {
    return this.keyMaker.generateKeyPair();
  }

  // throw the keys to your fellow friends
  @Post("/key/broadcast")
  async broadcastKey(@BodyParams("key") key: KeyObject) {
    const requestPromise: Promise<AxiosResponse<any>>[] = postBroadcast<
      KeyObject
    >("keymaker/recieve-key", this.block, key);

    await axios.all(requestPromise);
    return { note: "all nodes recieved the public key" };
  }

  // get the new keys from your friends
  @Post("/recieve-key")
  getKey(@BodyParams("key") publicKey: KeyObject) {
    if (this.keyMaker.publicKey !== publicKey) {
      this.keyMaker.publicKey = publicKey;
    }
  }
  //!wait who is you throwing at now?
  @Post("/node-key/broadcast")
  async broadcastNodeKey() {
    const requestPromise: Promise<AxiosResponse<any>>[] = postBroadcast<
      KeyObject
    >(
      "keymaker/node-recieve-key",
      this.block,
      this.keyMaker.currentNodePublicKey
    );
    await axios.all(requestPromise);
  }

  @Post("/node-recieve-key")
  getNodeKey(@BodyParams() key: KeyObject) {
    const result = this.keyMaker.nodePublicKeys.indexOf(key) == -1;
    if (result) {
      this.keyMaker.nodePublicKeys.push(key);
    }
  }
  @Post("/node-recieve-key-bulk")
  getNodeKeyBulk(@BodyParams() keys: KeyObject[]) {
    keys.forEach((key) => {
      const result = this.keyMaker.nodePublicKeys.indexOf(key) == -1;
      if (result) {
        this.keyMaker.nodePublicKeys.push(key);
      }
    });
  }
}
