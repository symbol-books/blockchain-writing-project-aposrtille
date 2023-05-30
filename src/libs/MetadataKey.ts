import { KeyGenerator, UInt64 } from 'symbol-sdk';

export const MetadataKey = {
  title: 'A801BEEB799108BC',
  filename: 'D298EBA89C34461D',
};

const keyToNameMap = {
  [MetadataKey.title]: 'Title',
  [MetadataKey.filename]: 'Filename',
};

export class MetadataKeyHelper {
  public static getKeyNameByKeyId(keyId: UInt64) {
    return keyToNameMap[keyId.toHex()] || keyId.toHex();
  }

  public static generateUInt64KeyFromKey(key: string) {
    return KeyGenerator.generateUInt64Key(key);
  }
}
