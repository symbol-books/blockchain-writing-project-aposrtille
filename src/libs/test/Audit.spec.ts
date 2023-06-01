import { Account, NetworkType } from 'symbol-sdk';
import { audit, parseMessage } from '../AuditService';
import { sha256 } from 'js-sha256';

describe('Audit', () => {
  const account = Account.generateNewAccount(NetworkType.TEST_NET);

  const checksum = 'fe4e5459';
  const hashingTypeStr = '83';

  const data = new ArrayBuffer(10);
  const hashedData = sha256.update(data).hex();
  const hash = account.signData(hashedData);

  const msg = checksum + hashingTypeStr + hash;
  describe('parse message', () => {
    test('アポスティーユのメッセージが渡された場合', () => {
      const result = parseMessage(msg);
      expect(result.hashingTypeStr).toEqual(hashingTypeStr);
      expect(result.signedHash).toEqual(hash);
    });
    test('アポスティーユのメッセージ以外が渡された場合 エラーを返す', () => {
      const result = () => parseMessage('invalid message');
      expect(result).toThrowError('It is not apostille message');
    });
  });

  describe('audit', () => {
    test('正しいデータの監査結果がTrue', () => {
      const isValid = audit(data, msg, account.publicAccount);
      expect(isValid).toBeTruthy();
    });
    test('改ざんしたデータの監査結果がFalse', () => {
      const invalidData = new ArrayBuffer(11);
      const hashedData = sha256.update(invalidData).hex();
      const hash = account.signData(hashedData);

      const msg = checksum + hashingTypeStr + hash;
      const isValid = audit(data, msg, account.publicAccount);
      expect(isValid).toBeFalsy();
    });
  });
});
