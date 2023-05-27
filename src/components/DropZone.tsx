import React, { Dispatch, useCallback } from 'react';
import { Box, Typography, colors } from '@mui/material';
import { useDropzone } from 'react-dropzone';
import DeleteIcon from '@mui/icons-material/Delete';

function DropZone(props: {
  setFile: Dispatch<React.SetStateAction<File | null>>;
  file: File | null;
}): JSX.Element {
  const { setFile, file } = props;

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Do something with the files
      addFile(acceptedFiles[0]);
    },
    [file]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    },
  });

  const addFile = (file: File) => {
    setFile(file);
  };

  const removeFile = () => {
    setFile(null);
  };

  if (file === null) {
    return (
      <Box
        {...getRootProps()}
        sx={{
          width: '100%',
          height: '400px',
          background: '#fafafa',
          border: '1px dashed #bdbdbd',
          borderRadius: '8px',
        }}
        display='flex'>
        <input {...getInputProps()} />
        <Typography variant='body1' sx={{ margin: 'auto' }} color={colors.grey[800]}>
          ファイルを選択もしくはドラッグ＆ドロップ
        </Typography>
      </Box>
    );
  } else {
    return (
      <Box
        sx={{
          width: '100%',
          height: '400px',
          background: '#fafafa',
          border: '1px dashed #bdbdbd',
          borderRadius: '8px',
          position: 'relative',
        }}
        display='flex'
        justifyContent='center'
        alignItems='center'>
        <Box sx={{ height: '400px' }}>
          <img src={URL.createObjectURL(file)} alt={file.name} height='100%' />
        </Box>
        <Box position='absolute' top='20px' right='20px'>
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
            <DeleteIcon onClick={removeFile} />
          </Box>
        </Box>
      </Box>
    );
  }
}
export default DropZone;
