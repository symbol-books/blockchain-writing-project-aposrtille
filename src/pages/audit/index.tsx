import React, { useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
import AlertsSnackbar from '@/components/AlertsSnackbar';
import AlertsDialog from '@/components/AlertsDialog';
import { createAccount } from '@/utils/createAccount';
import { ClientPrivateKey, ClientPublicKey, ClientAddress } from '@/globalState/atoms';
import { useRecoilState } from 'recoil';
import { Box, Button, TextField } from '@mui/material';
import { useRouter } from 'next/router';

function Audit(): JSX.Element {
  //共通設定
  const [openLeftDrawer, setOpenLeftDrawer] = useState<boolean>(false); //LeftDrawerの設定

  const router = useRouter();
  const [address, setAddress] = useState<string>('');

  const handleAuditClick = () => {
    router.push(`/audit/${address}`);
  };

  return (
    <>
      <Header setOpenLeftDrawer={setOpenLeftDrawer} />
      <LeftDrawer openLeftDrawer={openLeftDrawer} setOpenLeftDrawer={setOpenLeftDrawer} />
      <Box display='flex' flexDirection='column' alignItems='center' marginTop='80px'>
        <Box sx={{ width: '800px' }}>
          <Box display='flex' sx={{ width: '100%', marginTop: '32px' }}>
            <TextField
              fullWidth
              label='Apostille Address'
              placeholder='Apostille Accountのアドレスを入力してください'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Box>
          <Box display='flex' justifyContent='end' sx={{ width: '100%', marginTop: '32px' }}>
            <Button variant='contained' onClick={handleAuditClick}>
              監査する
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
export default Audit;
