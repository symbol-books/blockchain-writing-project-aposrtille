import { KeyGenerator, UInt64 } from 'symbol-sdk';

export enum MetadataKey {
  title = 'A801BEEB799108BC',
  description = '9E30087F94867CF9',
  filename = 'D298EBA89C34461D',
}
export class MetadataKeyHelper {
  public static getKeyNameByKeyId(keyId: UInt64) {
    console.log(keyId.toHex());
    switch (keyId.toHex()) {
      case this.keyToKeyId(MetadataKey.title).toHex():
        return 'Title';
      case this.keyToKeyId(MetadataKey.description).toHex():
        return 'Description';
      case MetadataKey.filename:
        return 'Filename';
      default:
        return keyId.toHex();
    }
  }

  public static keyToKeyId(key: string) {
    return KeyGenerator.generateUInt64Key(key);
  }
}
