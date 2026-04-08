import React from 'react';
import { ListItem, ListItemIcon, ListItemText, LinearProgress, Box, Typography, Button, Stack } from '@mui/material';
import { VideoLibrary as VideoLibraryIcon, Image as ImageIcon } from '@mui/icons-material';

const formatBytes = (bytes) => {
  if (bytes == null || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};
const formatSpeed = (bytesPerSec) => (bytesPerSec ? `${formatBytes(bytesPerSec)}/s` : '–');
const formatEta = (sec) => {
  if (sec == null || !Number.isFinite(sec) || sec < 0) return '–';
  if (sec < 60) return `${Math.round(sec)}s`;
  const m = Math.floor(sec / 60);
  const s = Math.round(sec % 60);
  return `${m}m ${s}s`;
};

export default function UploadProgressRow({ item, progress, onCancel, onRemoveFromQueue, showCancel = true }) {
  const isVideo = item?.category === 'video';
  const percent = progress?.percent ?? 0;
  const speed = progress?.speed ?? 0;
  const eta = progress?.eta;
  const status = progress?.status;
  const file = item?.file;
  const sizeStr = file ? formatBytes(file.size) : '';

  const uploadingNow = status === 'uploading';
  const canRemoveFromQueue =
    typeof onRemoveFromQueue === 'function' && !uploadingNow && (status == null || status === 'waiting');

  const secondary =
    canRemoveFromQueue || (showCancel && uploadingNow) ? (
      <Stack direction="row" spacing={0.5} alignItems="center" component="span">
        {canRemoveFromQueue && (
          <Button size="small" color="inherit" onClick={() => onRemoveFromQueue(item?.id)}>
            Remove
          </Button>
        )}
        {showCancel && uploadingNow && (
          <Button size="small" color="inherit" onClick={() => onCancel?.(item?.id)}>
            Cancel upload
          </Button>
        )}
      </Stack>
    ) : undefined;

  return (
    <ListItem secondaryAction={secondary}>
      <ListItemIcon sx={{ minWidth: 40 }}>
        {isVideo ? <VideoLibraryIcon color="primary" /> : <ImageIcon color="secondary" />}
      </ListItemIcon>
      <ListItemText
        primary={file?.name || 'File'}
        secondary={
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary" display="block">
              {sizeStr}
              {status === 'uploading' && (speed > 0 || eta != null) && (
                <> · {formatSpeed(speed)} · ETA {formatEta(eta)}</>
              )}
              {status === 'waiting' && ' · Queued'}
              {status === 'done' && ' · Done'}
              {status === 'error' && ' · Failed'}
              {status === 'cancelled' && ' · Cancelled'}
            </Typography>
            {status === 'uploading' && (
              <LinearProgress variant="determinate" value={Math.min(100, percent)} sx={{ mt: 0.5, height: 6, borderRadius: 1 }} />
            )}
          </Box>
        }
      />
    </ListItem>
  );
}
