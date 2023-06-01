import { generationHash } from '@/consts/blockchainProperty';
import { nodeList } from '@/consts/nodeList';
import { sha256 } from 'js-sha256';
import { Account, PublicAccount, Transaction } from 'symbol-sdk';

export class ApostilleAccount {
  public readonly account: Account;
  public readonly owner: PublicAccount;
  public readonly apiEndpoint = nodeList[0];
  public readonly generationHash = generationHash;

  private constructor(fileName: string, owner: PublicAccount) {
    const now = new Date();
    const seed = `${fileName}-${owner.publicKey}-${now.toString()}`;
    const hash = sha256.update(seed).hex();
    const privateKey = this.fixPrivateKey(hash);
    const account = Account.createFromPrivateKey(privateKey, 152);

    this.account = account;
    this.owner = owner;
  }

  public static create(fileName: string, publicKey: string): ApostilleAccount {
    const account = PublicAccount.createFromPublicKey(publicKey, 152);
    return new ApostilleAccount(fileName, account);
  }

  public sign(tx: Transaction) {
    return this.account.sign(tx, this.generationHash);
  }

  public getSignedHash(payload: ArrayBuffer) {
    const hash = sha256.update(payload).hex();
    return this.account.signData(hash);
  }

  private fixPrivateKey(privateKey: string) {
    return `0000000000000000000000000000000000000000000000000000000000000000${privateKey.replace(
      /^00/,
      ''
    )}`.slice(-64);
  }
}
