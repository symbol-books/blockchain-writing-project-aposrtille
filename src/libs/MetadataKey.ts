import { KeyGenerator } from 'symbol-sdk';

export enum MetadataKey {
  author = 'B8A2B7186A421369',
  title = 'A801BEEB799108BC',
  tag = 'EB9BDBED96B9EC45',
  description = '9E30087F94867CF9',
  filename = 'D298EBA89C34461D',
  originUrl = '9FA2FCC0B88961FC',
  certificateUrl = '92F13A7B7DF2F7A9',
}

export const getMetadataKey = (key: MetadataKey) => {
  return KeyGenerator.generateUInt64Key(key);
};
