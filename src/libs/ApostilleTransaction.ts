import {
  Account,
  AccountMetadataTransaction,
  AggregateTransaction,
  Convert,
  Deadline,
  InnerTransaction,
  MultisigAccountModificationTransaction,
  PlainMessage,
  Transaction,
  TransferTransaction,
} from 'symbol-sdk';
import { ApostilleAccount } from './ApostilleAccount';
import { epochAdjustment } from '@/consts/blockchainProperty';
import { ApostilleOption } from './ApostilleOption';
import { MetadataKey, MetadataKeyHelper } from './MetadataKey';

export class ApostilleTransaction {
  public readonly multisigAccount: Account;
  private constructor(
    public readonly apostilleAccount: ApostilleAccount,
    private readonly txMsg: string,
    private readonly fileName: string,
    private readonly option?: ApostilleOption
  ) {
    this.multisigAccount = Account.generateNewAccount(152);
  }

  public static create(
    blob: ArrayBuffer,
    fileName: string,
    owner: string,
    option?: ApostilleOption
  ) {
    const apostilleAccount = ApostilleAccount.create(fileName, owner);
    const signedHash = apostilleAccount.getSignedHash(blob);
    const hashFuncId = '83';
    const txMsg = `fe4e5459${hashFuncId}${signedHash}`; // fe4e5459 : checkSum , 83 : sha256 , {signedHash} : signedHash
    return new ApostilleTransaction(apostilleAccount, txMsg, fileName, option);
  }

  private createCoreTransaction() {
    return TransferTransaction.create(
      Deadline.create(epochAdjustment),
      this.apostilleAccount.account.address,
      [],
      PlainMessage.create(this.txMsg),
      152
    ).toAggregate(this.apostilleAccount.owner);
  }

  private createOwnerTransaction() {
    return MultisigAccountModificationTransaction.create(
      Deadline.create(epochAdjustment),
      2,
      2,
      [this.apostilleAccount.owner.address, this.multisigAccount.address],
      [],
      152
    ).toAggregate(this.apostilleAccount.account.publicAccount);
  }

  private createMetadataTransaction(key: string, value: string) {
    const metadataValue = Convert.utf8ToUint8(value);
    return AccountMetadataTransaction.create(
      Deadline.create(epochAdjustment),
      this.apostilleAccount.account.address,
      MetadataKeyHelper.keyToKeyId(key),
      metadataValue.length,
      metadataValue,
      152
    ).toAggregate(this.apostilleAccount.account.publicAccount);
  }

  private createOptionTransactions(): InnerTransaction[] {
    const txs: Transaction[] = [];

    const fileNameMetadataTransaction = this.createMetadataTransaction('filename', this.fileName);
    txs.push(fileNameMetadataTransaction);

    if (this.option) {
      if (this.option.metadata) {
        Object.entries(this.option.metadata).forEach(([key, value]) => {
          console.log({ key, value });
        });

        if (this.option.metadata.description) {
          const descriptionMetadataTransaction = this.createMetadataTransaction(
            'description',
            this.option.metadata.description
          );
          txs.push(descriptionMetadataTransaction);
        }
        if (this.option.metadata.title) {
          const titleMetadataTransaction = this.createMetadataTransaction(
            'title',
            this.option.metadata.title
          );
          txs.push(titleMetadataTransaction);
        }
      }
      if (this.option.isOwner) {
        const multisigTx = this.createOwnerTransaction();
        txs.push(multisigTx);
      }
    }

    return txs;
  }

  public createTransaction() {
    const coreTx = this.createCoreTransaction();
    const optionTxs = this.createOptionTransactions();

    const innerTxs = [coreTx, ...optionTxs];
    console.log({ innerTxs });
    const aggTx = AggregateTransaction.createComplete(
      Deadline.create(epochAdjustment),
      innerTxs,
      152,
      []
    ).setMaxFeeForAggregate(100, 2);

    return aggTx;
  }
}
