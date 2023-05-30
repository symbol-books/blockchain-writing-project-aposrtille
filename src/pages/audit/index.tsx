import React, { useState } from 'react';
import LeftDrawer from '@/components/LeftDrawer';
import Header from '@/components/Header';
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
            <Button variant='contained' onClick={handleAuditClick} disabled={address.length !== 39}>
              監査ページへ進む
            </Button>
          </Box>
        </Box>
      </Box>
    </>
  );
}
export default Audit;
