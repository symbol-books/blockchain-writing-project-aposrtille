import { KeyGenerator, UInt64 } from 'symbol-sdk';

export const MetadataKey = {
  title: 'A801BEEB799108BC',
  filename: 'D298EBA89C34461D',
  description: '9E30087F94867CF9',
};

const keyToNameMap = {
  [MetadataKey.title]: 'Title',
  [MetadataKey.filename]: 'Filename',
  [MetadataKey.description]: 'Description',
};

export class MetadataKeyHelper {
  public static getKeyNameByKeyId(keyId: UInt64) {
    const keyIdHex = keyId.toHex();
    return keyToNameMap[keyIdHex] || keyIdHex;
  }

  public static generateUInt64KeyFromKey(key: string) {
    return KeyGenerator.generateUInt64Key(key);
  }
}
