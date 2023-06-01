import { UInt64 } from 'symbol-sdk';
import { MetadataKeyHelper, MetadataKey } from '../MetadataKey';

describe('MetadataKey', () => {
  describe('getKeyNameByKeyId', () => {
    test('既知のキーIDを指定した場合、キー名を返す', () => {
      const titleKeyId = UInt64.fromHex(MetadataKey.title);
      expect(MetadataKeyHelper.getKeyNameByKeyId(titleKeyId)).toEqual('Title');
    });
    test('未知のキーIDを指定した場合、Hex値を返す', () => {
      const hexKey = 'FFFFFFFFFFFFFFFF';
      const unknownKeyId = UInt64.fromHex(hexKey);
      expect(MetadataKeyHelper.getKeyNameByKeyId(unknownKeyId)).toEqual(hexKey);
    });
  });

  describe('generateUInt64KeyFromKey', () => {
    test('指定したキーからUInt64のキーを返す', () => {
      const key = 'filename';
      const expected = UInt64.fromHex('D298EBA89C34461D');
      expect(MetadataKeyHelper.generateUInt64KeyFromKey(key)).toEqual(expected);
    });
  });
});
