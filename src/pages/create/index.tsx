import React, { useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import DropZone from '@/components/DropZone';
import { Box, Button } from '@mui/material';
import { ApostilleTransaction } from '@/libs/ApostilleTransaction';
import { SSSWindow } from 'sss-module';
import { nodeList } from '@/consts/nodeList';
import { connectNode } from '@/utils/connectNode';
import { firstValueFrom } from 'rxjs';
import { RepositoryFactoryHttp } from 'symbol-sdk';

declare const window: SSSWindow;

function Create(): JSX.Element {
  //共通設定
  const [progress, setProgress] = useState<boolean>(false); //ローディングの設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定
  const [dialogMessage, setDialogMessage] = useState<string>(''); //AlertsDialogの設定(共通)

  //ページ個別設定
  const [openDialog, setOpenDialog] = useState<boolean>(false); //AlertsDialogの設定(個別)

  const [file, setFile] = useState<File | null>(null);

  const handleCreateClick = () => {
    setOpenDialog(false);
    createApostille().then(() => {
      setSnackbarMessage('snackbar message');
      setSnackbarSeverity('success');
      setOpenSnackbar(true);
    });
  };

  const createApostille = async () => {
    if (file === null) return;

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
        isOwner: false,
        metadata: {
          description: 'test description',
          title: 'test title',
        },
      }
    );

    const transaction = apostilleTransaction.createTransaction();

    window.SSS.setTransaction(transaction);

    const signedTx = await window.SSS.requestSignWithCosignatories([
      apostilleTransaction.apostilleAccount.account,
    ]);
    await firstValueFrom(txRepo.announce(signedTx));
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
        openDialog={openDialog}
        setOpenDialog={setOpenDialog}
        handleAgreeClick={() => {
          handleCreateClick();
        }}
        dialogTitle='作成しますか？'
        dialogMessage={dialogMessage}
      />
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='80px'>
        <Box sx={{ width: '800px' }}>
          <DropZone setFile={setFile} file={file} />
          <Box display='flex' justifyContent='end' sx={{ width: '100%', marginTop: '32px' }}>
            <Button variant='contained' onClick={() => setOpenDialog(true)} disabled={!file}>
              作成する
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
export default Create;
