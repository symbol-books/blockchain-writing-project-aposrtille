import React, { useEffect, useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import DropZone from '@/components/DropZone';
import {
  Box,
  Button,
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
import { nodeList } from '@/consts/nodeList';
import { getTimeStamp } from '@/utils/getTimeStamp';
import {
  AccountMetadataTransaction,
  Address,
  AggregateTransaction,
  Convert,
  InnerTransaction,
  MultisigAccountModificationTransaction,
  Order,
  PublicAccount,
  RepositoryFactoryHttp,
  TransactionGroup,
  TransactionType,
  TransferTransaction,
} from 'symbol-sdk';
import { connectNode } from '@/utils/connectNode';
import { useRouter } from 'next/router';
import { audit } from '@/libs/AuditService';
import { MetadataKeyHelper } from '@/libs/MetadataKey';
import DeleteIcon from '@mui/icons-material/Delete';
interface AuditResult {
  isValid: boolean;
  apostilleAddress: string;
  ownerAddress: string;
  signerAddress: string;
  timestamp: string;
  metadata: { key: string; value: string }[];
}

function Audit(): JSX.Element {
  //共通設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定
  const [openSnackbar, setOpenSnackbar] = useState<boolean>(false); //AlertsSnackbarの設定
  const [snackbarSeverity, setSnackbarSeverity] = useState<'error' | 'success'>('error'); //AlertsSnackbarの設定
  const [snackbarMessage, setSnackbarMessage] = useState<string>(''); //AlertsSnackbarの設定

  const router = useRouter();
  const { address } = router.query;

  const [file, setFile] = useState<File | null>(null);
  const [hash, setHash] = useState<string>('');
  const [publicKey, setPublicKey] = useState('');
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);

  useEffect(() => {
    if (!address) return;
    const f = async () => {
      const NODE = await connectNode(nodeList);
      if (NODE === '') return undefined;
      const repo = new RepositoryFactoryHttp(NODE, {
        websocketUrl: NODE.replace('http', 'ws') + '/ws',
        websocketInjected: WebSocket,
      });

      const accountRepo = repo.createAccountRepository();
      const account = await accountRepo
        .getAccountInfo(Address.createFromRawAddress(`${address}`))
        .toPromise();

      if (!account) return;

      setPublicKey(account.publicKey);
      const txRepo = repo.createTransactionRepository();

      const tx = await txRepo
        .search({
          group: TransactionGroup.Confirmed,
          address: Address.createFromRawAddress(`${address}`),
          order: Order.Asc,
        })
        .toPromise();
      console.log({ tx });
      if (!tx) return;
      const h = tx.data[0].transactionInfo?.hash;
      console.log({ h });
      setHash(`${h}`);
    };
    f();
  }, [address]);

  const handleAuditClick = async () => {
    if (!file) return;

    const NODE = await connectNode(nodeList);
    if (NODE === '') return undefined;

    const repo = new RepositoryFactoryHttp(NODE, {
      websocketUrl: NODE.replace('http', 'ws') + '/ws',
      websocketInjected: WebSocket,
    });
    const txRepo = repo.createTransactionRepository();

    txRepo
      .getTransaction(hash, TransactionGroup.Confirmed)
      .toPromise()
      .then(async (data) => {
        if (!data || !data.transactionInfo) {
          return;
        }
        console.log({ data });

        const aggregateTx = data as AggregateTransaction;

        const coreTx = aggregateTx.innerTransactions[0] as TransferTransaction;

        const blob = await file.arrayBuffer();
        const isValid = audit(
          blob,
          coreTx.message.payload,
          PublicAccount.createFromPublicKey(publicKey, 152)
        );

        if (!isValid) {
          console.log('invalid');
          setSnackbarSeverity('error');
          setSnackbarMessage('Apostilleされたファイルと異なります。');
          setFile(null);
          setOpenSnackbar(true);
          return;
        } else {
          setSnackbarSeverity('success');
          setSnackbarMessage('Apostilleファイルの監査に成功しました。');
          setOpenSnackbar(true);
        }

        const height = data.transactionInfo.height;
        const timestamp = await getTimeStamp(height);

        const txs = aggregateTx.innerTransactions;

        const { ownerTx, metadataTxs } = getOptionTx(txs);

        console.log({ coreTx, ownerTx, metadataTxs });

        const metadata = metadataTxs.map((tx) => {
          return {
            key: MetadataKeyHelper.getKeyNameByKeyId(tx.scopedMetadataKey),
            value: Convert.uint8ToUtf8(tx.value),
          };
        });

        const apostilleAddress = coreTx.recipientAddress.plain();
        const signerAddress = aggregateTx.signer?.address.plain() ?? '';

        const r = {
          timestamp: timestamp.toString(),
          ownerAddress: !!ownerTx ? signerAddress : apostilleAddress,
          apostilleAddress,
          signerAddress,
          metadata,
          isValid: isValid,
        };
        setAuditResult(r);
      });
  };

  const getOptionTx = (
    txs: InnerTransaction[]
  ): {
    ownerTx: MultisigAccountModificationTransaction | null;
    metadataTxs: AccountMetadataTransaction[];
  } => {
    if (txs.length === 1) {
      return {
        ownerTx: null,
        metadataTxs: [],
      };
    }

    const ownerTx = txs.filter((tx) => tx.type === TransactionType.MULTISIG_ACCOUNT_MODIFICATION);
    const metadataTx = txs.filter((tx) => tx.type === TransactionType.ACCOUNT_METADATA);

    return {
      ownerTx: (ownerTx[0] as MultisigAccountModificationTransaction) ?? null,
      metadataTxs: metadataTx as AccountMetadataTransaction[],
    };
  };

  const showContent = () => {
    if (auditResult === null || file === null) {
      return (
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
      );
    }

    return (
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='80px'>
        <Box sx={{ width: '800px' }}>
          <Box sx={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <Typography component='h2'>Audit Result</Typography>
            <Box
              sx={{
                width: '24px',
                height: '24px',
                padding: '4px',
                ':hover': {
                  cursor: 'pointer',
                  borderRadius: '50%',
                  background: '#bdbdbd',
                },
              }}>
              <DeleteIcon
                onClick={() => {
                  setAuditResult(null);
                  setFile(null);
                }}
              />
            </Box>
          </Box>
          <Box
            sx={{
              height: '400px',
              marginBottom: '16px',
              '> img': {
                objectFit: 'contain',
              },
            }}>
            <img src={URL.createObjectURL(file)} alt={file.name} height='100%' width='100%' />
          </Box>
          <TableContainer component={Paper}>
            <Table sx={{ minWidth: 650 }} aria-label='simple table'>
              <TableHead>
                <TableRow>
                  <TableCell>Key</TableCell>
                  <TableCell>Value</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow
                  onClick={() =>
                    window.open(
                      `https://testnet.symbol.fyi/accounts/${auditResult.apostilleAddress}`,
                      '_blank'
                    )
                  }
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    ':hover': { background: '#fafafa', cursor: 'pointer' },
                  }}>
                  <TableCell component='th' scope='row'>
                    Apostille Address
                  </TableCell>
                  <TableCell>{auditResult.apostilleAddress}</TableCell>
                </TableRow>
                <TableRow
                  onClick={() =>
                    window.open(
                      `https://testnet.symbol.fyi/accounts/${auditResult.signerAddress}`,
                      '_blank'
                    )
                  }
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    ':hover': { background: '#fafafa', cursor: 'pointer' },
                  }}>
                  <TableCell component='th' scope='row'>
                    Signer Address
                  </TableCell>
                  <TableCell>{auditResult.signerAddress}</TableCell>
                </TableRow>
                <TableRow
                  onClick={() =>
                    window.open(
                      `https://testnet.symbol.fyi/accounts/${auditResult.ownerAddress}`,
                      '_blank'
                    )
                  }
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    ':hover': { background: '#fafafa', cursor: 'pointer' },
                  }}>
                  <TableCell component='th' scope='row'>
                    Owner Address
                  </TableCell>
                  <TableCell>{auditResult.ownerAddress}</TableCell>
                </TableRow>
                <TableRow
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    ':hover': { background: '#fafafa', cursor: 'pointer' },
                  }}>
                  <TableCell component='th' scope='row'>
                    Timestamp
                  </TableCell>
                  <TableCell>{auditResult.timestamp}</TableCell>
                </TableRow>
                {Object.entries(auditResult.metadata).map(([key, value]) => {
                  return (
                    <TableRow
                      key={key}
                      sx={{
                        '&:last-child td, &:last-child th': { border: 0 },
                        ':hover': { background: '#fafafa', cursor: 'pointer' },
                      }}>
                      <TableCell component='th' scope='row'>
                        {value.key}
                      </TableCell>
                      <TableCell>{value.value}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Box>
    );
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
      {showContent()}
    </>
  );
}
export default Audit;
