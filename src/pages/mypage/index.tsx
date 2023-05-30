import Header from '@/components/Header';
import LeftDrawer from '@/components/LeftDrawer';
import { nodeList } from '@/consts/nodeList';
import { MetadataKey } from '@/libs/MetadataKey';
import { connectNode } from '@/utils/connectNode';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { SSSWindow } from 'sss-module';
import { Address, RepositoryFactoryHttp, TransactionGroup } from 'symbol-sdk';
declare const window: SSSWindow;

type ApostilleInfo = {
  address: string;
  fileName: string;
};

function MyPage(): JSX.Element {
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定

  const router = useRouter();

  const [apostilleInfo, setApostilleInfo] = useState<ApostilleInfo[]>([]);

  useEffect(() => {
    const address = window.SSS.activeAddress;
    const f = async () => {
      const NODE = await connectNode(nodeList);
      if (NODE === '') return undefined;
      const repo = new RepositoryFactoryHttp(NODE, {
        websocketUrl: NODE.replace('http', 'ws') + '/ws',
        websocketInjected: WebSocket,
      });
      const multisigRepo = repo.createMultisigRepository();
      const accountRepo = repo.createAccountRepository();
      const metadataRepo = repo.createMetadataRepository();
      const info = await multisigRepo
        .getMultisigAccountInfo(Address.createFromRawAddress(address))
        .toPromise();
      const apostilleAddresses = info?.multisigAddresses ?? [];

      const addressPromise = await Promise.all(apostilleAddresses).then((addresses) =>
        addresses.map((address) => accountRepo.getAccountInfo(address).toPromise())
      );

      const apostilleAccounts = await Promise.all(addressPromise);

      const accountsPromise = apostilleAccounts.map(async (account) => {
        const r = await metadataRepo
          .search({
            targetAddress: account?.address,
          })
          .toPromise();
        return r?.data;
      });

      const metadata = await Promise.all(accountsPromise);

      const infos: ApostilleInfo[] = metadata
        .map((m) => {
          if (!!m && m.length !== 0) {
            const data = {
              address: m[0].metadataEntry.targetAddress?.plain(),
              fileName: m
                .filter((m) => m.metadataEntry.scopedMetadataKey.toHex() === MetadataKey.filename)
                .map((m) => m.metadataEntry.value)[0],
            };
            return data;
          }
          return undefined;
        })
        .filter((i) => !!i) as ApostilleInfo[];
      setApostilleInfo(infos);
    };
    f();
  }, []);
  return (
    <>
      <Header setOpenLeftDrawer={setOpenLeftDrawer} />
      <LeftDrawer openLeftDrawer={openLeftDrawer} setOpenLeftDrawer={setOpenLeftDrawer} />
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='80px'>
        <Box sx={{ width: '800px' }}>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label='simple table'>
              <TableHead>
                <TableRow>
                  <TableCell>Apostille Address</TableCell>
                  <TableCell>FileName</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {apostilleInfo.map((row) => (
                  <TableRow
                    key={row.address}
                    sx={{
                      '&:last-child td, &:last-child th': { border: 0 },
                      ':hover': { background: '#fafafa', cursor: 'pointer' },
                    }}
                    onClick={() => router.push(`/audit/${row.address}`)}>
                    <TableCell component='th' scope='row'>
                      {row.address}
                    </TableCell>
                    <TableCell>{row.fileName}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    </>
  );
}

export default MyPage;
