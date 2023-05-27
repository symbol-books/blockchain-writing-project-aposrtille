import React, { useEffect, useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import { createAccount } from '@/utils/createAccount';
import { ClientPrivateKey, ClientPublicKey, ClientAddress } from '@/globalState/atoms';
import { useRecoilState } from 'recoil';
import DropZone from '@/components/DropZone';
import { Box, Button, TextField } from '@mui/material';
import axios from 'axios';
import { nodeList } from '@/consts/nodeList';
import { getTimeStamp } from '@/utils/getTimeStamp';
import {
  AccountMetadataTransaction,
  Address,
  Convert,
  InnerTransaction,
  MultisigAccountModificationTransaction,
  PublicAccount,
  RepositoryFactoryHttp,
  TransactionGroup,
  UInt64,
} from 'symbol-sdk';
import { connectNode } from '@/utils/connectNode';
import { useRouter } from 'next/router';
import { audit } from '@/libs/AuditService';

function Audit(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogTitle, setDialogTitle] = useState<string>(''); //AlertsDialogの設定(共通)
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)

  //ページ個別設定
  const [clientPrivateKey, setClientPrivateKey] = useRecoilState(ClientPrivateKey);
  const [clientPublicKey, setClientPublicKey] = useRecoilState(ClientPublicKey);
  const [clientAddress, setClientAddress] = useRecoilState(ClientAddress);
  const [openDialogClientAddress, setOpenDialogClientAddress] = useState<boolean>(false); //AlertsDialogの設定(個別)

  const router = useRouter();
  const { address } = router.query;

  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>('');
  const [publicKey, setPublicKey] = useState('');

  useEffect(() => {
    if (!address) return;
    const f = async () => {
      const NODE = await connectNode(nodeList);
      if (NODE === '') return undefined;
      const data = await axios.get(`${NODE}/accounts/${address}`).then((res) => res.data);
      setPublicKey(data.account.publicKey);

      const repo = new RepositoryFactoryHttp(NODE, {
        websocketUrl: NODE.replace('http', 'ws') + '/ws',
        websocketInjected: WebSocket,
      });
      const txRepo = repo.createTransactionRepository();

      const tx = await txRepo
        .search({
          group: TransactionGroup.Confirmed,
          address: Address.createFromRawAddress(`${address}`),
        })
        .toPromise();
      if (!tx) return;
      const h = tx.data[0].transactionInfo?.hash;
      console.log({ h });
      setHash(`${h}`);
    };
    f();
  }, [address]);

  const handleAgreeClickClientAddress = () => {
    setProgress(true);
    const [privatekey, publickey, address] = createAccount();
    setClientPrivateKey(privatekey);
    setClientPublicKey(publickey);
    setClientAddress(address);
    setSnackbarSeverity('success');
    setSnackbarMessage('アカウントの生成に成功しました');
    setOpenSnackbar(true);
    setProgress(false);
  };

  const handleAuditClick = async () => {
    if (!file) return;

    const NODE = await connectNode(nodeList);
    if (NODE === '') return undefined;
    axios
      .get(`${NODE}/transactions/confirmed/${hash}`)
      .then((res) => res.data)
      .then(async (data) => {
        console.log('data', data);
        const height = UInt64.fromNumericString(data.meta.height);
        const timestamp = await getTimeStamp(height);

        const txs = data.transaction.transactions;
        const coreTx = txs[0].transaction;
        const optionTx = getOptionTx(txs);
        const msg = Convert.decodeHex(coreTx.message.slice(2));
        // const fileHash =

        const blob = await file.arrayBuffer();

        const isValid = audit(blob, msg, PublicAccount.createFromPublicKey(publicKey, 152));

        alert(isValid ? '監査成功' : '監査失敗');

        console.log({
          coreTx,
          optionTx,
          msg,
        });

        const r = {
          timestamp: timestamp.toString(),
          address: PublicAccount.createFromPublicKey(
            data.transaction.signerPublicKey,
            152
          ).address.plain(),
          apostilleAccount: coreTx.recipientAddress,
          fileName: file.name,
          fileHash: coreTx.message,
        };
        console.log('r', r);
      });
  };

  const getOptionTx = (
    txs: InnerTransaction[]
  ): {
    ownerTx: MultisigAccountModificationTransaction | null;
    titleTx: AccountMetadataTransaction | null;
    authorTx: AccountMetadataTransaction | null;
  } => {
    if (txs.length === 1)
      return {
        ownerTx: null,
        titleTx: null,
        authorTx: null,
      };
    return {
      ownerTx: txs[1] as MultisigAccountModificationTransaction,
      titleTx: null,
      authorTx: null,
    };
  };

  return (
    <>
      <Header setOpenLeftDrawer={setOpenLeftDrawer} />
      <LeftDrawer openLeftDrawer={openLeftDrawer} setOpenLeftDrawer={setOpenLeftDrawer} />
      <AlertsSnackbar
        openSnackbar={openSnackbar}
        setOpenSnackbar={setOpenSnackbar}
        vertical={'bottom'}
        snackbarSeverity={snackbarSeverity}
        snackbarMessage={snackbarMessage}
      />
      <AlertsDialog
        openDialog={openDialogClientAddress}
        setOpenDialog={setOpenDialogClientAddress}
        handleAgreeClick={() => {
          handleAgreeClickClientAddress();
          setOpenDialogClientAddress(false);
        }}
        dialogTitle={dialogTitle}
        dialogMessage={dialogMessage}
      />
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='80px'>
        <Box sx={{ width: '800px' }}>
          <DropZone setFile={setFile} file={file} />
          <Box display='flex' justifyContent='end' sx={{ width: '100%', marginTop: '32px' }}>
            <Button variant='contained' onClick={handleAuditClick} disabled={!file}>
              監査する
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
export default Audit;
