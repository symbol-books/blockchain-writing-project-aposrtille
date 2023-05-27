import Header from '@/components/Header';
import LeftDrawer from '@/components/LeftDrawer';
import { nodeList } from '@/consts/nodeList';
import { MetadataKey, MetadataKeyHelper } from '@/libs/MetadataKey';
import { connectNode } from '@/utils/connectNode';
import { List } from '@mui/icons-material';
import {
  Box,
  ListItemButton,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import axios from 'axios';
import { Router, useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { SSSWindow } from 'sss-module';
import { Address, RepositoryFactoryHttp, TransactionGroup } from 'symbol-sdk';
declare const window: SSSWindow;

type ApostilleInfo = {
  address: string;
  fileName: string;
};

function MyPage(): JSX.Element {
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)

  const [address, setAddress] = useState('');
  const [multisigAddresses, setMultisigAddresses] = useState<Address[]>([]);
  const router = useRouter();

  const [apostilleInfo, setApostilleInfo] = useState<ApostilleInfo[]>([]);

  useEffect(() => {
    const address = window.SSS.activeAddress;
    setAddress(address);
    // axios
    //   .get('/api/fetch-all-apostille', { params: { address } })
    //   .then((r) => r.data)
    //   .then(console.log);

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
      const addresses = info?.multisigAddresses ?? [];

      const addressPromise = await Promise.all(addresses).then((addresses) =>
        addresses.map((address) => accountRepo.getAccountInfo(address).toPromise())
      );

      const accounts = await Promise.all(addressPromise);

      const accountsPromise = accounts.map(async (account) => {
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
                .filter(
                  (m) =>
                    m.metadataEntry.scopedMetadataKey.toHex() ===
                    MetadataKeyHelper.keyToKeyId(MetadataKey.filename).toHex()
                )
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
