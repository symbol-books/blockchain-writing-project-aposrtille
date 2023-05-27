import { sha256 } from 'js-sha256';
import { PublicAccount } from 'symbol-sdk';

export const audit = (blob: ArrayBuffer, payload: string, account: PublicAccount) => {
  const hashedData = sha256.update(blob).hex();
  const message = parseMessage(payload);
  const isValid = account.verifySignature(hashedData, message.signedHash);
  console.log({ isValid });
  return isValid;
};

const parseMessage = (txMessage: string) => {
  const regex = /^fe4e5459(\d{2})(\w+)/;
  const result = txMessage.match(regex);
  if (result) {
    const parsedMessage = {
      hashingTypeStr: result[1],
      signedHash: result[2],
    };
    return parsedMessage;
  }
  throw Error('It is not apostille message');
};
