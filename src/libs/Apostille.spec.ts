import {
  Account,
  TransactionType,
  NetworkType,
  AccountMetadataTransaction,
  Convert,
  TransferTransaction,
  MultisigAccountModificationTransaction,
} from 'symbol-sdk';
import { ApostilleTransaction } from './ApostilleTransaction';
import { MetadataKeyHelper } from './MetadataKey';

const account = Account.generateNewAccount(NetworkType.TEST_NET);

describe('apostille transaction', () => {
  describe('オプション無し', () => {
    const data = new ArrayBuffer(10);
    const fileName = 'test.txt';
    const apostilleTransaction = ApostilleTransaction.create(data, fileName, account.publicKey);

    const tx = apostilleTransaction.createTransaction();

    test('トランザクションのTransactionType', () => {
      expect(tx.type).toEqual(TransactionType.AGGREGATE_COMPLETE);
    });

    test('インナートランザクションの数', () => {
      expect(tx.innerTransactions.length).toEqual(1);
    });

    test('インナートランザクションのTransactionType', () => {
      expect(tx.innerTransactions[0].type).toEqual(TransactionType.TRANSFER);
    });

    test('Messageがchecksumから始まる', () => {
      const coreTx = tx.innerTransactions[0] as TransferTransaction;
      expect(coreTx.message.payload).toMatch(/^fe4e5459/);
    });
  });
  describe('オプション有り (オーナーではない)', () => {
    const data = new ArrayBuffer(10);
    const fileName = 'test.txt';
    const metadata = {
      filename: fileName,
      title: 'test-title',
      description: 'test-description',
    };
    const apostilleTransaction = ApostilleTransaction.create(data, fileName, account.publicKey, {
      metadata,
    });

    const tx = apostilleTransaction.createTransaction();

    test('インナートランザクションの数', () => {
      const metadataCount = Object.keys(metadata).length;
      expect(tx.innerTransactions.length).toEqual(1 + metadataCount); // coreTx + metadataTx
    });

    test('インナートランザクションのTransactionType', () => {
      expect(tx.innerTransactions[0].type).toEqual(TransactionType.TRANSFER);

      // 残りは全部 MetaData
      for (let i = 1; i < tx.innerTransactions.length; i++) {
        expect(tx.innerTransactions[i].type).toEqual(TransactionType.ACCOUNT_METADATA);
      }
    });

    test('メタデータトランザクションのvalue', () => {
      for (let i = 1; i < tx.innerTransactions.length; i++) {
        const metadataTx = tx.innerTransactions[i] as AccountMetadataTransaction;
        const value = Convert.uint8ToUtf8(metadataTx.value);
        expect(value).toEqual(Object.values(metadata)[i - 1]);
      }
    });

    test('メタデータトランザクションのkey', () => {
      const metadataKeys = ['Filename', 'Title', 'Description'];

      for (let i = 1; i < tx.innerTransactions.length; i++) {
        const metadataTx = tx.innerTransactions[i] as AccountMetadataTransaction;
        const key = MetadataKeyHelper.getKeyNameByKeyId(metadataTx.scopedMetadataKey);
        expect(key).toEqual(metadataKeys[i - 1]);
      }
    });
  });
  describe('オプション有り (オーナー)', () => {
    const data = new ArrayBuffer(10);
    const fileName = 'test.txt';
    const apostilleTransaction = ApostilleTransaction.create(data, fileName, account.publicKey, {
      isOwner: true,
    });

    const tx = apostilleTransaction.createTransaction();

    test('インナートランザクションの数', () => {
      expect(tx.innerTransactions.length).toEqual(2); // coreTx + metadataTx + ownerTx
    });

    test('インナートランザクションのTransactionType', () => {
      expect(tx.innerTransactions[0].type).toEqual(TransactionType.TRANSFER);
      expect(tx.innerTransactions[1].type).toEqual(TransactionType.MULTISIG_ACCOUNT_MODIFICATION);
    });

    test('マルチシグにオーナーアカウントが追加されている', () => {
      const ownerTx = tx.innerTransactions[1] as MultisigAccountModificationTransaction;
      const multisigAccounts = ownerTx.addressAdditions.map((a) => a.plain());
      expect(ownerTx.minApprovalDelta).toEqual(2); // 2 of 2
      expect(ownerTx.minRemovalDelta).toEqual(2); // 2 of 2
      expect(multisigAccounts).toContain(account.address.plain());
    });
  });
});
