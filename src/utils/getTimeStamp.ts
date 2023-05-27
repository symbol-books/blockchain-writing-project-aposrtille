import { epochAdjustment } from '@/consts/blockchainProperty';
import { nodeList } from '@/consts/nodeList';
import { RepositoryFactoryHttp, UInt64 } from 'symbol-sdk';

export const getTimeStamp = async (height: UInt64): Promise<Date> => {
  const NODE_URL = nodeList[0];
  const repositoryFactory = new RepositoryFactoryHttp(NODE_URL);
  const blockRep = repositoryFactory.createBlockRepository();
  const blockInfo = await blockRep.getBlockByHeight(height).toPromise();

  if (!blockInfo) return new Date(0);

  const t = Number(blockInfo.timestamp.toString());
  return new Date(t + epochAdjustment * 1000);
};
