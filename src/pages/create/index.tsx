import React, { useEffect, useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import DropZone from '@/components/DropZone';
import { Box, Button, TextField, Typography } from '@mui/material';
import { ApostilleTransaction } from '@/libs/ApostilleTransaction';
import { SSSWindow } from 'sss-module';
import { nodeList } from '@/consts/nodeList';
import { connectNode } from '@/utils/connectNode';
import { firstValueFrom } from 'rxjs';
import { RepositoryFactoryHttp } from 'symbol-sdk';
import Checkbox from '@mui/material/Checkbox';
declare const window: SSSWindow;

function Create(): JSX.Element {
  //共通設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定

  //ページ個別設定

  const [file, setFile] = useState<File | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [title, setTitle] = useState('');

  const handleCreateClick = () => {
    createApostille().then((apostilleTransaction) => {
      if (!!apostilleTransaction) {
        setSnackbarMessage(
          `Apostilleを作成しました。 Address: ${apostilleTransaction.apostilleAccount.account.address.plain()}`
        );
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
      }
    });
  };

  const createApostille = async () => {
    if (file === null) return undefined;

    const NODE = await connectNode(nodeList);
    if (NODE === '') return undefined;
    const repo = new RepositoryFactoryHttp(NODE, {
      websocketUrl: NODE.replace('http', 'ws') + '/ws',
      websocketInjected: WebSocket,
    });
    const txRepo = repo.createTransactionRepository();
    const data = await file.arrayBuffer();
    const apostilleTransaction = ApostilleTransaction.create(
      data,
      file.name,
      window.SSS.activePublicKey,
      {
        isOwner,
        metadata: {
          title,
          filename: file.name,
        },
      }
    );

    const transaction = apostilleTransaction.createTransaction();

    window.SSS.setTransaction(transaction);

    const cosignatories = [apostilleTransaction.apostilleAccount.account];
    if (isOwner) {
      cosignatories.push(apostilleTransaction.multisigAccount);
    }

    const signedTx = await window.SSS.requestSignWithCosignatories(cosignatories);
    await firstValueFrom(txRepo.announce(signedTx));
    return apostilleTransaction;
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
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='80px'>
        <Box sx={{ width: '800px' }}>
          <DropZone setFile={setFile} file={file} />
          <Box marginTop='32px'>
            <TextField
              label='Title'
              placeholder='Apostilleのタイトルを入力してください'
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
            />
          </Box>
          <Box
            display='flex'
            justifyContent='space-between'
            sx={{ width: '100%', marginTop: '32px' }}>
            <Box display={'flex'} alignItems={'center'}>
              <Checkbox
                checked={isOwner}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsOwner(e.target.checked)}
              />
              <Typography>オーナーになる</Typography>
            </Box>
            <Button variant='contained' onClick={handleCreateClick} disabled={!file}>
              作成する
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
export default Create;
