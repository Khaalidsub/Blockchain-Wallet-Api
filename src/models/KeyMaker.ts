import { ProviderScope, Scope } from "@tsed/common";
import {
  generateKeyPairSync,
  KeyObject,
  verify,
  constants,
  sign,
} from "crypto";
import { PaymentTransaction } from "./PaymentTransaction";
@Scope(ProviderScope.SINGLETON)
export class KeyMaker {
  public publicKey: KeyObject;
  public currentNodePublicKey: KeyObject;
  public nodePublicKeys: KeyObject[];
  private currentNodePrivateKey: KeyObject;
  constructor() {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    // this.nodePublicKeys.push(publicKey);
    this.currentNodePublicKey = publicKey;
    this.currentNodePrivateKey = privateKey;
  }

  generateKeyPair() {
    const { publicKey, privateKey } = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    });
    this.publicKey = publicKey;

    return privateKey;
  }
  addNodeKeys(keys: KeyObject[]) {
    keys.forEach((key) => {
      if (!this.nodePublicKeys.indexOf(key)) {
        this.nodePublicKeys.push(key);
      }
    });
  }

  verifySignature(data: PaymentTransaction, signature: string) {
    return verify(
      "sha256",
      Buffer.from(data),
      { key: this.publicKey, padding: constants.RSA_PKCS1_PSS_PADDING },
      Buffer.from(signature, "hex")
    );
  }
  signNodeData(data: PaymentTransaction) {
    return sign("sha256", Buffer.from(data), {
      key: this.currentNodePrivateKey,
      padding: constants.RSA_PKCS1_PSS_PADDING,
    }).toString("hex");
  }
}
