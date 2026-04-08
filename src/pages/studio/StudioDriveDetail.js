import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  IconButton,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  ToggleButtonGroup,
  ToggleButton,
  List,
  ListItem,
  ListItemIcon,
  Chip,
  Fade,
  Grow,
  Alert,
  Skeleton,
  TablePagination,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Breadcrumbs,
  Link,
  Menu,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  ArrowBack as ArrowBackIcon,
  Storage as StorageIcon,
  VideoLibrary as VideoLibraryIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  PlayArrow as PlayIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  DriveFileRenameOutline as RenameIcon,
  DriveFileMove as MoveIcon,
  ContentCopy as CopyIcon,
  CropFree as SizeSmallIcon,
  AspectRatio as SizeMediumIcon,
  Dashboard as SizeLargeIcon,
  CloudUpload as CloudUploadIcon,
  CreateNewFolder as CreateFolderIcon,
  Folder as FolderIcon,
  Share as ShareIcon,
} from '@mui/icons-material';
import {
  getClientDetails,
  getUserPlans,
  getStudioClientMediaList,
  deleteClientMedia,
  updateClientMedia,
  copyClientMedia,
  createClientShare,
  moveMediaBetweenPlans,
  copyClientMediaBetweenPlans,
  updateClientFolder,
  moveClientFolderToDrive,
  copyClientFolderToDrive,
} from '../../services/studioService';
import {
  getFolders,
  createFolder,
  deleteStudioFolder,
  uploadMediaForClientSmart,
} from '../../services/mediaService';
import { formatStorageWithUnits } from '../../utils/storageFormat';
import { getMediaUrl } from '../../config/api';
import UploadProgressRow from '../../components/UploadProgressRow';

const DATE_FILTERS = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'Last 7 Days' },
  { value: 'month', label: 'Last Month' },
];

const GRID_SIZES = {
  small: { cols: { xs: 4, sm: 3, md: 2, lg: 2 }, previewHeight: 88, titleVariant: 'caption' },
  medium: { cols: { xs: 6, sm: 4, md: 3 }, previewHeight: 120, titleVariant: 'body2' },
  large: { cols: { xs: 12, sm: 6, md: 4 }, previewHeight: 176, titleVariant: 'subtitle1' },
};

const PAGE_SIZE = 50;
const BYTES_PER_GB = 1024 * 1024 * 1024;

function formatFileSize(bytes) {
  if (bytes == null || Number.isNaN(Number(bytes))) return '—';
  const n = Number(bytes);
  if (n >= 1024 * 1024 * 1024) return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(2)} MB`;
  if (n >= 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${n} B`;
}

/** Build Root + … + current folder from flat folder list (parentFolderId chain). Avoids duplicate segments from double navigation / Strict Mode. */
function buildBreadcrumbTrail(allFolders, folderId) {
  const root = { id: null, name: 'Root' };
  if (folderId == null || folderId === '') return [root];
  const byId = new Map((allFolders || []).map((f) => [f.id, f]));
  let cur = typeof folderId === 'string' ? parseInt(folderId, 10) : folderId;
  if (Number.isNaN(cur)) return [root];
  const segments = [];
  const seen = new Set();
  while (cur != null) {
    if (seen.has(cur)) break;
    seen.add(cur);
    const f = byId.get(cur);
    if (!f) {
      segments.push({ id: cur, name: '…' });
      break;
    }
    segments.push({ id: f.id, name: f.name });
    const pid = f.parentFolderId;
    cur = pid != null && pid !== '' ? pid : null;
  }
  segments.reverse();
  return [root, ...segments];
}

/** Safe URL for img/video; avoids broken relative URLs when backend omits url */
function resolveMediaSrc(url) {
  const u = getMediaUrl(url);
  return u || '';
}

function MediaThumb({ item, height, variant }) {
  const [failed, setFailed] = useState(false);
  const src = resolveMediaSrc(item.url);
  if (!src || failed) {
    return (
      <Box
        sx={{
          width: '100%',
          height,
          bgcolor: 'grey.300',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: variant === 'list' ? 1 : '8px 8px 0 0',
        }}
      >
        {item.category === 'video' ? (
          <VideoLibraryIcon sx={{ fontSize: 40, color: 'grey.600' }} />
        ) : (
          <ImageIcon sx={{ fontSize: 40, color: 'grey.600' }} />
        )}
      </Box>
    );
  }
  if (item.category === 'video') {
    return (
      <Box
        component="video"
        src={src}
        muted
        playsInline
        onError={() => setFailed(true)}
        sx={{ width: '100%', height, objectFit: 'cover', borderRadius: variant === 'list' ? 1 : '8px 8px 0 0' }}
      />
    );
  }
  return (
    <Box
      component="img"
      src={src}
      alt={item.name}
      onError={() => setFailed(true)}
      sx={{ width: '100%', height, objectFit: 'cover', borderRadius: variant === 'list' ? 1 : '8px 8px 0 0' }}
    />
  );
}

const StudioDriveDetail = () => {
  const theme = useTheme();
  const { id: clientId, planId } = useParams();
  const navigate = useNavigate();
  const [clientData, setClientData] = useState(null);
  const [clientPlans, setClientPlans] = useState([]);
  const [plan, setPlan] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [gridSize, setGridSize] = useState('medium');
  const [sortOrder, setSortOrder] = useState('desc');
  const [page, setPage] = useState(0);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([{ id: null, name: 'Root' }]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, mediaId: null, ids: [], name: '' });
  const [deleteFolderDialog, setDeleteFolderDialog] = useState({ open: false, folderId: null, name: '' });
  const [deleteFolderLoading, setDeleteFolderLoading] = useState(false);
  const [previewMedia, setPreviewMedia] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});
  const uploadAbortRef = useRef({});
  const [selectedUploadFolder, setSelectedUploadFolder] = useState('');
  const [uploadDialogFolders, setUploadDialogFolders] = useState([]);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [createFolderLoading, setCreateFolderLoading] = useState(false);

  const [mediaMenuAnchor, setMediaMenuAnchor] = useState(null);
  const [mediaMenuItem, setMediaMenuItem] = useState(null);
  const [renameDialog, setRenameDialog] = useState({ open: false, name: '', mediaId: null });
  const [renameLoading, setRenameLoading] = useState(false);
  const [moveCopyDialog, setMoveCopyDialog] = useState({
    open: false,
    mode: 'move',
    itemType: 'media',
    mediaId: null,
    mediaIds: null,
    sourceFolderId: null,
    targetDriveId: '',
    targetFolderId: '',
  });
  const [folderMenuAnchor, setFolderMenuAnchor] = useState(null);
  const [folderMenuFolder, setFolderMenuFolder] = useState(null);
  const [moveCopyLoading, setMoveCopyLoading] = useState(false);
  const [moveCopyFolders, setMoveCopyFolders] = useState([]);
  const [moveCopyFoldersLoading, setMoveCopyFoldersLoading] = useState(false);
  const [shareDialog, setShareDialog] = useState({
    open: false,
    link: '',
    title: '',
    description: '',
    loading: false,
  });
  /** Highlight drop target: 'root' = main area, 'breadcrumbRoot' = drive root, or folder id */
  const [dropTargetFolderId, setDropTargetFolderId] = useState(null);
  /** Server-paged media for current folder / filters */
  const [driveMedia, setDriveMedia] = useState([]);
  const [driveMediaTotal, setDriveMediaTotal] = useState(0);
  const [driveTotalOnPlan, setDriveTotalOnPlan] = useState(0);
  const [mediaListLoading, setMediaListLoading] = useState(false);

  const loadClientData = useCallback(async () => {
    try {
      const [data, plans] = await Promise.all([
        getClientDetails(clientId, { includeMedia: false }),
        getUserPlans(clientId),
      ]);
      setClientData(data);
      setClientPlans(Array.isArray(plans) ? plans : []);
      const p = (plans || []).find((pl) => String(pl.id) === String(planId));
      setPlan(p || null);
    } catch (e) {
      console.error(e);
    }
  }, [clientId, planId]);

  const loadFoldersForLevel = useCallback(async () => {
    if (!plan?.id) {
      setFolders([]);
      return;
    }
    const list = await getFolders(clientId, plan.id, currentFolderId);
    setFolders(Array.isArray(list) ? list : []);
  }, [clientId, plan?.id, currentFolderId]);

  const loadDriveMedia = useCallback(async () => {
    if (!clientId || !plan?.id) {
      setDriveMedia([]);
      setDriveMediaTotal(0);
      setDriveTotalOnPlan(0);
      return;
    }
    setMediaListLoading(true);
    try {
      const datePreset = dateFilter === 'all' ? undefined : dateFilter;
      const res = await getStudioClientMediaList(clientId, {
        userPlanId: plan.id,
        folderId: currentFolderId != null ? String(currentFolderId) : '',
        page: page + 1,
        limit: PAGE_SIZE,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
        search: searchQuery.trim() || undefined,
        datePreset,
        sort: sortOrder === 'asc' ? 'asc' : 'desc',
      });
      const rows = res?.data ?? [];
      setDriveMedia(Array.isArray(rows) ? rows : []);
      setDriveMediaTotal(Number(res?.total) || 0);
      setDriveTotalOnPlan(Number(res?.totalOnPlan) || 0);
    } catch (e) {
      console.error(e);
      setDriveMedia([]);
      setDriveMediaTotal(0);
      setDriveTotalOnPlan(0);
    } finally {
      setMediaListLoading(false);
    }
  }, [
    clientId,
    plan?.id,
    currentFolderId,
    page,
    categoryFilter,
    searchQuery,
    dateFilter,
    sortOrder,
  ]);

  useEffect(() => {
    loadDriveMedia();
  }, [loadDriveMedia]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await loadClientData();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [loadClientData]);

  useEffect(() => {
    loadFoldersForLevel();
  }, [loadFoldersForLevel]);

  useEffect(() => {
    if (!moveCopyDialog.open || !moveCopyDialog.targetDriveId) {
      if (!moveCopyDialog.open) setMoveCopyFolders([]);
      return;
    }
    let cancelled = false;
    setMoveCopyFoldersLoading(true);
    (async () => {
      try {
        const list = await getFolders(clientId, moveCopyDialog.targetDriveId, undefined);
        if (!cancelled) setMoveCopyFolders(Array.isArray(list) ? list : []);
      } finally {
        if (!cancelled) setMoveCopyFoldersLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [moveCopyDialog.open, moveCopyDialog.targetDriveId, clientId]);

  useEffect(() => {
    setPage(0);
  }, [searchQuery, dateFilter, categoryFilter, sortOrder, currentFolderId]);

  useEffect(() => {
    setSelectedIds([]);
    setCurrentFolderId(null);
  }, [clientId, planId]);

  /** Keep breadcrumb in sync with currentFolderId using the real folder tree (fixes duplicate segments). */
  useEffect(() => {
    let cancelled = false;
    if (!clientId || !plan?.id) {
      setBreadcrumb([{ id: null, name: 'Root' }]);
      return () => {};
    }
    (async () => {
      const list = await getFolders(clientId, plan.id, undefined);
      if (cancelled) return;
      const arr = Array.isArray(list) ? list : [];
      setBreadcrumb(buildBreadcrumbTrail(arr, currentFolderId));
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId, plan?.id, currentFolderId]);

  const loadAllFoldersForUpload = useCallback(async () => {
    const list = await getFolders(clientId, plan?.id, undefined);
    return Array.isArray(list) ? list : [];
  }, [clientId, plan?.id]);

  useEffect(() => {
    if (uploadDialogOpen && plan) {
      loadAllFoldersForUpload().then(setUploadDialogFolders);
      setUploadFiles([]);
      setSelectedUploadFolder(currentFolderId != null ? String(currentFolderId) : '');
      setCreateFolderOpen(false);
      setNewFolderName('');
    }
  }, [uploadDialogOpen, plan, currentFolderId, loadAllFoldersForUpload]);

  const onDrop = useCallback((acceptedFiles) => {
    const items = acceptedFiles.map((file) => ({
      file,
      id: Date.now() + Math.random(),
      category: file.type.startsWith('video/') ? 'video' : 'image',
    }));
    setUploadFiles((prev) => [...prev, ...items]);
  }, []);

  const { getRootProps, getInputProps, open: openFileDialog } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.avi', '.mov', '.mkv'], 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] },
    multiple: true,
    noClick: true,
  });

  const removeUploadFile = (id) => setUploadFiles((prev) => prev.filter((f) => f.id !== id));

  const handleUploadCancel = (itemId) => {
    const controller = uploadAbortRef.current[itemId];
    if (controller) controller.abort();
  };

  const getAvailableGB = useCallback((p) => {
    if (!p) return 0;
    const total = Number(p.totalStorage) || 0;
    const usedBytes = Number(p.usedStorage) || 0;
    return total - usedBytes / BYTES_PER_GB;
  }, []);

  const handleUploadSubmit = async () => {
    if (!plan || uploadFiles.length === 0) return;
    const availableGB = getAvailableGB(plan);
    if (availableGB <= 0) {
      setSnackbar({ open: true, message: 'No space in this drive', severity: 'error' });
      return;
    }
    setUploading(true);
    let success = 0;
    let failCount = 0;
    let lastError = null;
    const userPlanId = plan.id;
    const folderId =
      selectedUploadFolder !== '' && selectedUploadFolder != null
        ? selectedUploadFolder
        : currentFolderId != null
          ? String(currentFolderId)
          : null;

    uploadFiles.forEach((it) => setUploadProgress((p) => ({ ...p, [it.id]: { percent: 0, status: 'waiting' } })));
    for (const item of uploadFiles) {
      setUploadProgress((p) => ({ ...p, [item.id]: { percent: 0, speed: 0, eta: null, status: 'uploading' } }));
      const controller = new AbortController();
      uploadAbortRef.current[item.id] = controller;
      try {
        await uploadMediaForClientSmart({
          clientId,
          file: item.file,
          userPlanId,
          folderId,
          onProgress: (ev) => {
            setUploadProgress((prev) => ({
              ...prev,
              [item.id]: {
                percent: ev.percent ?? 0,
                speed: ev.speed ?? 0,
                eta: ev.eta,
                status: 'uploading',
              },
            }));
          },
          signal: controller.signal,
        });
        setUploadProgress((p) => ({ ...p, [item.id]: { percent: 100, status: 'done' } }));
        success++;
      } catch (e) {
        if (e?.message === 'Upload cancelled' || e?.name === 'AbortError') {
          setUploadProgress((p) => ({ ...p, [item.id]: { status: 'cancelled' } }));
        } else {
          failCount++;
          lastError = e?.response?.data?.message || e?.message || 'Upload failed';
          setUploadProgress((p) => ({ ...p, [item.id]: { status: 'error' } }));
        }
        console.error(e);
      }
      delete uploadAbortRef.current[item.id];
    }
    setUploading(false);
    setUploadProgress({});
    setUploadFiles([]);
    setUploadDialogOpen(false);
    await loadClientData();
    await loadDriveMedia();
    await loadFoldersForLevel();
    if (failCount > 0) {
      setSnackbar({ open: true, message: `${success} uploaded, ${failCount} failed. ${lastError}`, severity: 'warning' });
    } else {
      setSnackbar({ open: true, message: `${success} file(s) uploaded successfully`, severity: 'success' });
    }
  };

  const handleCreateFolder = async () => {
    const name = newFolderName.trim();
    if (!name) {
      setSnackbar({ open: true, message: 'Enter a folder name', severity: 'warning' });
      return;
    }
    setCreateFolderLoading(true);
    try {
      await createFolder({
        clientId,
        name,
        userPlanId: plan.id,
        parentFolderId: currentFolderId,
      });
      await loadFoldersForLevel();
      if (uploadDialogOpen) {
        loadAllFoldersForUpload().then(setUploadDialogFolders);
      }
      setCreateFolderOpen(false);
      setNewFolderName('');
      setSnackbar({ open: true, message: 'Folder created', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || e?.message || 'Failed', severity: 'error' });
    } finally {
      setCreateFolderLoading(false);
    }
  };

  const handleNavigateToFolder = (folder) => {
    setCurrentFolderId(folder.id);
    setPage(0);
  };

  const handleBreadcrumbClick = (index) => {
    const item = breadcrumb[index];
    setCurrentFolderId(item.id);
    setPage(0);
  };

  const handleDeleteFolderConfirm = async () => {
    const id = deleteFolderDialog.folderId;
    if (!id) return;
    setDeleteFolderLoading(true);
    try {
      await deleteStudioFolder(clientId, id);
      if (currentFolderId === id) {
        setCurrentFolderId(null);
      }
      await loadClientData();
      await loadDriveMedia();
      await loadFoldersForLevel();
      setDeleteFolderDialog({ open: false, folderId: null, name: '' });
      setSnackbar({ open: true, message: 'Folder deleted', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Delete failed', severity: 'error' });
    } finally {
      setDeleteFolderLoading(false);
    }
  };

  /** Total files on entire drive (all folders) — from server */
  const totalFilesOnDrive = driveTotalOnPlan;

  const totalItems = driveMediaTotal;
  const totalPages = Math.max(1, Math.ceil(driveMediaTotal / PAGE_SIZE));
  const pageSafe = Math.min(page, Math.max(0, totalPages - 1));
  const mediaDisplayed = driveMedia;

  useEffect(() => {
    const maxPage = Math.max(0, totalPages - 1);
    if (page > maxPage) setPage(maxPage);
  }, [totalPages, page]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleSelectAll = () => {
    const displayIds = mediaDisplayed.map((m) => m.id);
    const allSelected = displayIds.every((id) => selectedIds.includes(id));
    setSelectedIds((prev) =>
      allSelected ? prev.filter((id) => !displayIds.includes(id)) : [...new Set([...prev, ...displayIds])]
    );
  };
  const allDisplayedSelected = mediaDisplayed.length > 0 && mediaDisplayed.every((m) => selectedIds.includes(m.id));

  const handleDeleteConfirm = async () => {
    const idsToDelete = deleteDialog.ids?.length ? deleteDialog.ids : (deleteDialog.mediaId ? [deleteDialog.mediaId] : []);
    if (idsToDelete.length === 0) return;
    try {
      for (const mid of idsToDelete) {
        await deleteClientMedia(clientId, mid);
      }
      setSelectedIds((prev) => prev.filter((id) => !idsToDelete.includes(id)));
      setDeleteDialog({ open: false, mediaId: null, ids: [], name: '' });
      const [data, plans] = await Promise.all([
        getClientDetails(clientId, { includeMedia: false }),
        getUserPlans(clientId),
      ]);
      setClientData(data);
      const p = (plans || []).find((pl) => String(pl.id) === String(planId));
      if (p) setPlan(p);
      await loadDriveMedia();
      await loadFoldersForLevel();
      setSnackbar({ open: true, message: idsToDelete.length === 1 ? 'Deleted' : `${idsToDelete.length} item(s) deleted`, severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'Delete failed', severity: 'error' });
    }
  };

  const handlePageChange = (event, newPage) => {
    setPage(newPage);
  };

  const handleDragStart = useCallback((e, type, item) => {
    const bulkIds =
      type === 'media' &&
      selectedIds.length > 1 &&
      selectedIds.includes(item.id)
        ? selectedIds.filter((sid) => mediaDisplayed.some((m) => m.id === sid))
        : null;
    const payload =
      bulkIds && bulkIds.length > 1
        ? { type: 'bulk', ids: bulkIds }
        : { type, id: item.id };
    e.dataTransfer.setData('application/json', JSON.stringify(payload));
    e.dataTransfer.effectAllowed = 'move';
  }, [selectedIds, mediaDisplayed]);

  const handleDragEnd = useCallback(() => {
    setDropTargetFolderId(null);
  }, []);

  const handleDragOver = useCallback((e, folderId) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTargetFolderId(folderId);
  }, []);

  const handleDragLeave = useCallback((e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDropTargetFolderId(null);
  }, []);

  const handleDrop = useCallback(async (e, targetFolderId) => {
    e.preventDefault();
    setDropTargetFolderId(null);
    let payload;
    try {
      payload = JSON.parse(e.dataTransfer.getData('application/json'));
    } catch {
      return;
    }

    const resolved =
      targetFolderId === 'breadcrumbRoot'
        ? null
        : targetFolderId === 'root'
          ? currentFolderId
          : targetFolderId;

    const sameFolder = (a, b) => {
      const na = a == null || a === '' ? null : Number(a);
      const nb = b == null || b === '' ? null : Number(b);
      if (Number.isNaN(na) || Number.isNaN(nb)) return false;
      return na === nb;
    };

    if (payload.type === 'bulk' && Array.isArray(payload.ids)) {
      let moved = 0;
      for (const mid of payload.ids) {
        const item = mediaDisplayed.find((m) => m.id === mid);
        if (!item) continue;
        if (sameFolder(item.folderId, resolved)) continue;
        try {
          await updateClientMedia(clientId, mid, { folderId: resolved ?? null });
          moved++;
        } catch (err) {
          setSnackbar({ open: true, message: err?.response?.data?.message || 'Move failed', severity: 'error' });
          return;
        }
      }
      if (moved > 0) {
        await loadClientData();
        await loadDriveMedia();
        await loadFoldersForLevel();
        setSelectedIds([]);
        setSnackbar({ open: true, message: `${moved} file(s) moved`, severity: 'success' });
      }
      return;
    }

    const { type, id } = payload;
    if (!type || !id) return;

    if (type === 'folder') {
      const folder = folders.find((f) => f.id === id);
      if (!folder) return;
      if (folder.id === resolved) {
        setSnackbar({ open: true, message: 'Cannot move a folder into itself', severity: 'warning' });
        return;
      }
      if (folder.parentFolderId != null && sameFolder(folder.parentFolderId, resolved)) {
        setSnackbar({ open: true, message: 'Already in that location', severity: 'info' });
        return;
      }
      if (folder.parentFolderId == null && resolved == null) {
        setSnackbar({ open: true, message: 'Already at drive root', severity: 'info' });
        return;
      }
      try {
        await updateClientFolder(clientId, folder.id, { parentFolderId: resolved ?? null });
        await loadClientData();
        await loadDriveMedia();
        await loadFoldersForLevel();
        setSnackbar({ open: true, message: 'Folder moved', severity: 'success' });
      } catch (err) {
        setSnackbar({ open: true, message: err?.response?.data?.message || 'Move failed', severity: 'error' });
      }
    } else if (type === 'media') {
      const item = mediaDisplayed.find((m) => m.id === id);
      if (!item) return;
      if (sameFolder(item.folderId, resolved)) return;
      try {
        await updateClientMedia(clientId, item.id, { folderId: resolved ?? null });
        await loadClientData();
        await loadDriveMedia();
        await loadFoldersForLevel();
        setSnackbar({ open: true, message: 'File moved', severity: 'success' });
      } catch (err) {
        setSnackbar({ open: true, message: err?.response?.data?.message || 'Move failed', severity: 'error' });
      }
    }
  }, [clientId, currentFolderId, folders, mediaDisplayed, loadClientData, loadDriveMedia, loadFoldersForLevel]);

  const handleMediaMenuOpen = (e, item) => {
    e.stopPropagation();
    setMediaMenuAnchor(e.currentTarget);
    setMediaMenuItem(item);
  };
  const handleMediaMenuClose = () => {
    setMediaMenuAnchor(null);
    setMediaMenuItem(null);
  };

  const openRenameFromMenu = () => {
    if (!mediaMenuItem) return;
    setRenameDialog({ open: true, name: mediaMenuItem.name || '', mediaId: mediaMenuItem.id });
    handleMediaMenuClose();
  };

  const openMoveCopyFromMenu = (mode) => {
    if (!mediaMenuItem) return;
    const item = mediaMenuItem;
    handleMediaMenuClose();
    const defaultFolder =
      mode === 'copy' && currentFolderId != null ? String(currentFolderId) : '';
    setMoveCopyDialog({
      open: true,
      mode,
      itemType: 'media',
      mediaId: item.id,
      mediaIds: null,
      sourceFolderId: null,
      targetDriveId: String(plan.id),
      targetFolderId: defaultFolder,
    });
  };

  const openFolderMoveCopy = (folder, mode) => {
    handleFolderMenuClose();
    const defaultFolder =
      mode === 'copy' && currentFolderId != null ? String(currentFolderId) : '';
    setMoveCopyDialog({
      open: true,
      mode,
      itemType: 'folder',
      mediaId: null,
      mediaIds: null,
      sourceFolderId: folder.id,
      targetDriveId: String(plan.id),
      targetFolderId: defaultFolder,
    });
  };

  const openBulkMoveCopy = (mode) => {
    if (!selectedIds.length) return;
    const defaultFolder =
      mode === 'copy' && currentFolderId != null ? String(currentFolderId) : '';
    setMoveCopyDialog({
      open: true,
      mode,
      itemType: 'bulk',
      mediaId: null,
      mediaIds: [...selectedIds],
      sourceFolderId: null,
      targetDriveId: String(plan.id),
      targetFolderId: defaultFolder,
    });
  };

  const handleFolderMenuOpen = (e, folder) => {
    e.stopPropagation();
    setFolderMenuAnchor(e.currentTarget);
    setFolderMenuFolder(folder);
  };
  const handleFolderMenuClose = () => {
    setFolderMenuAnchor(null);
    setFolderMenuFolder(null);
  };

  const deleteFromMenu = () => {
    if (!mediaMenuItem) return;
    const item = mediaMenuItem;
    handleMediaMenuClose();
    setDeleteDialog({ open: true, mediaId: item.id, ids: [item.id], name: item.name });
  };

  const openShareLink = async (resourceType, resourceId, title, description) => {
    setShareDialog({
      open: true,
      link: '',
      title: title || 'Share link',
      description:
        description
        || 'Anyone with the link can view (read-only). Expires in 30 days.',
      loading: true,
    });
    try {
      const res = await createClientShare(clientId, { resourceType, resourceId, expiresInDays: 30 });
      const url = res.shareUrl || `${window.location.origin}/share/${res.token}`;
      setShareDialog((prev) => ({
        ...prev,
        link: url,
        loading: false,
      }));
    } catch (e) {
      setShareDialog({ open: false, link: '', title: '', description: '', loading: false });
      setSnackbar({
        open: true,
        message: e?.response?.data?.message || e?.message || 'Could not create share link',
        severity: 'error',
      });
    }
  };

  const shareMediaFromMenu = () => {
    if (!mediaMenuItem) return;
    const item = mediaMenuItem;
    handleMediaMenuClose();
    openShareLink(
      'media',
      item.id,
      `Share “${item.name}”`,
      'Anyone with the link can view this file (read-only). Expires in 30 days.',
    );
  };

  const handleRenameSave = async () => {
    const name = renameDialog.name?.trim();
    if (!name || !renameDialog.mediaId) return;
    setRenameLoading(true);
    try {
      await updateClientMedia(clientId, renameDialog.mediaId, { name });
      await loadClientData();
      await loadDriveMedia();
      setRenameDialog({ open: false, name: '', mediaId: null });
      setSnackbar({ open: true, message: 'Renamed', severity: 'success' });
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.message || e?.message || 'Rename failed',
        severity: 'error',
      });
    } finally {
      setRenameLoading(false);
    }
  };

  const handleMoveCopySave = async () => {
    const {
      mode,
      itemType,
      mediaId,
      mediaIds,
      sourceFolderId,
      targetDriveId,
      targetFolderId,
    } = moveCopyDialog;
    const sourcePlanId = Number(plan.id);
    const destPlanId = Number(targetDriveId);
    const folderId = targetFolderId === '' || targetFolderId == null ? null : Number(targetFolderId);

    if (Number.isNaN(destPlanId)) {
      setSnackbar({ open: true, message: 'Select a destination drive', severity: 'warning' });
      return;
    }
    if (itemType === 'media' && !mediaId) return;
    if (itemType === 'bulk' && (!mediaIds || mediaIds.length === 0)) return;
    if (itemType === 'folder' && !sourceFolderId) return;

    setMoveCopyLoading(true);
    try {
      if (itemType === 'media') {
        if (destPlanId === sourcePlanId) {
          if (mode === 'move') await updateClientMedia(clientId, mediaId, { folderId });
          else await copyClientMedia(clientId, mediaId, { folderId });
        } else if (mode === 'move') {
          await moveMediaBetweenPlans(clientId, sourcePlanId, destPlanId, [mediaId], folderId);
        } else {
          await copyClientMediaBetweenPlans(clientId, sourcePlanId, destPlanId, [mediaId], folderId);
        }
      } else if (itemType === 'bulk') {
        const ids = mediaIds || [];
        if (destPlanId === sourcePlanId) {
          if (mode === 'move') {
            for (const id of ids) {
              await updateClientMedia(clientId, id, { folderId });
            }
          } else {
            await copyClientMediaBetweenPlans(clientId, sourcePlanId, destPlanId, ids, folderId);
          }
        } else if (mode === 'move') {
          await moveMediaBetweenPlans(clientId, sourcePlanId, destPlanId, ids, folderId);
        } else {
          await copyClientMediaBetweenPlans(clientId, sourcePlanId, destPlanId, ids, folderId);
        }
      } else if (itemType === 'folder') {
        const fid = sourceFolderId;
        if (destPlanId === sourcePlanId) {
          if (mode === 'move') {
            await updateClientFolder(clientId, fid, { parentFolderId: folderId });
          } else {
            await copyClientFolderToDrive(clientId, fid, destPlanId, folderId);
          }
        } else if (mode === 'move') {
          await moveClientFolderToDrive(clientId, fid, destPlanId, folderId);
        } else {
          await copyClientFolderToDrive(clientId, fid, destPlanId, folderId);
        }
      }

      await loadClientData();
      await loadDriveMedia();
      await loadFoldersForLevel();
      setMoveCopyDialog({
        open: false,
        mode: 'move',
        itemType: 'media',
        mediaId: null,
        mediaIds: null,
        sourceFolderId: null,
        targetDriveId: '',
        targetFolderId: '',
      });
      if (itemType === 'bulk') setSelectedIds([]);
      setSnackbar({
        open: true,
        message: mode === 'move' ? 'Moved' : 'Copied',
        severity: 'success',
      });
    } catch (e) {
      setSnackbar({
        open: true,
        message: e?.response?.data?.message || e?.message || 'Action failed',
        severity: 'error',
      });
    } finally {
      setMoveCopyLoading(false);
    }
  };

  const moveCopyDialogTitle = () => {
    const { mode, itemType, mediaIds } = moveCopyDialog;
    const verb = mode === 'move' ? 'Move' : 'Copy';
    if (itemType === 'folder') return `${verb} folder`;
    if (itemType === 'bulk') return `${verb} ${mediaIds?.length || 0} file(s)`;
    return `${verb} file`;
  };

  const gridConfig = GRID_SIZES[gridSize] || GRID_SIZES.medium;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 2 }} />
        <Skeleton variant="rectangular" height={56} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={2}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Grid item xs={6} md={4} key={i}>
              <Skeleton variant="rectangular" height={160} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (!clientData || !plan) {
    return (
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Alert severity="warning">Drive or client not found.</Alert>
        <IconButton onClick={() => navigate(`/studio/clients/${clientId}`)} sx={{ mt: 2 }}>
          <ArrowBackIcon /> Back to client
        </IconButton>
      </Container>
    );
  }

  const fmt = formatStorageWithUnits(plan.totalStorage, plan.usedStorage, { usedIsBytes: true });

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3 }, px: { xs: 1, sm: 2 } }}>
      <Fade in timeout={400}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <IconButton onClick={() => navigate(`/studio/clients/${clientId}`)} size="large">
              <ArrowBackIcon />
            </IconButton>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold' }} noWrap>
                {clientData.client?.name || 'Client'} — Drive
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Plan {plan.totalStorage} GB • Expiry: {new Date(plan.expiryDate).toLocaleDateString()}
              </Typography>
            </Box>
            <Chip icon={<StorageIcon />} label={plan.status} color={plan.status === 'active' ? 'success' : 'default'} />
            <Button
              variant="contained"
              size="small"
              startIcon={<CloudUploadIcon />}
              onClick={() => setUploadDialogOpen(true)}
              disabled={getAvailableGB(plan) <= 0}
            >
              Upload
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<CreateFolderIcon />}
              onClick={() => setCreateFolderOpen(true)}
            >
              New folder
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<ShareIcon />}
              onClick={() =>
                openShareLink(
                  'drive',
                  plan.id,
                  'Share this drive',
                  'Anyone with the link can browse folders and files on this drive (read-only). Subfolders and nested files are included. Expires in 30 days.',
                )
              }
            >
              Share drive
            </Button>
          </Box>

          <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Breadcrumbs separator="›" aria-label="folder path">
              {breadcrumb.map((b, idx) => (
                <Link
                  key={b.id ?? 'root'}
                  component="button"
                  variant="body2"
                  underline="hover"
                  color={idx === breadcrumb.length - 1 ? 'text.primary' : 'inherit'}
                  onClick={() => handleBreadcrumbClick(idx)}
                  onDragOver={(e) => {
                    if (idx === 0 && breadcrumb.length > 1) handleDragOver(e, 'breadcrumbRoot');
                  }}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => {
                    if (idx === 0 && breadcrumb.length > 1) handleDrop(e, 'breadcrumbRoot');
                  }}
                  sx={{
                    cursor: 'pointer',
                    border: 0,
                    background: 'none',
                    font: 'inherit',
                    ...(idx === 0 && breadcrumb.length > 1 && dropTargetFolderId === 'breadcrumbRoot'
                      ? {
                        bgcolor: 'action.selected',
                        borderRadius: 1,
                        px: 0.5,
                      }
                      : {}),
                  }}
                  title={idx === 0 && breadcrumb.length > 1 ? 'Drop here to move to drive root' : undefined}
                >
                  {b.name}
                </Link>
              ))}
            </Breadcrumbs>
            {currentFolderId != null && (
              <Button
                size="small"
                variant="text"
                startIcon={<ShareIcon />}
                onClick={() =>
                  openShareLink(
                    'folder',
                    currentFolderId,
                    'Share this folder',
                    'Anyone with the link can open this folder and browse subfolders and files (read-only). Expires in 30 days.',
                  )
                }
              >
                Share this folder
              </Button>
            )}
          </Box>

          <Paper elevation={2} sx={{ p: 2, mb: 3, borderRadius: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Total</Typography>
                <Typography variant="h6">{fmt.totalFormatted}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Used</Typography>
                <Typography variant="h6">{fmt.usedFormatted}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">Available</Typography>
                <Typography variant="h6">{fmt.availableFormatted}</Typography>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Typography variant="caption" color="text.secondary">
                  {currentFolderId == null ? 'Files in this folder (root)' : 'Files in this folder'}
                </Typography>
                <Typography variant="h6">{totalItems}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                  On whole drive: {totalFilesOnDrive} file{totalFilesOnDrive === 1 ? '' : 's'}
                </Typography>
              </Grid>
            </Grid>
          </Paper>

          <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
                <TextField
                  placeholder="Search by name..."
                  size="small"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ minWidth: 220, flexGrow: 1 }}
                />
                <FormControl size="small" sx={{ minWidth: 140 }}>
                  <InputLabel>Date</InputLabel>
                  <Select value={dateFilter} label="Date" onChange={(e) => setDateFilter(e.target.value)}>
                    {DATE_FILTERS.map((f) => (
                      <MenuItem key={f.value} value={f.value}>{f.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Category</InputLabel>
                  <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="video">Videos</MenuItem>
                    <MenuItem value="image">Images</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Sort</InputLabel>
                  <Select value={sortOrder} label="Sort" onChange={(e) => setSortOrder(e.target.value)}>
                    <MenuItem value="desc">Newest first</MenuItem>
                    <MenuItem value="asc">Oldest first</MenuItem>
                  </Select>
                </FormControl>
                <ToggleButtonGroup
                  value={viewMode}
                  exclusive
                  onChange={(e, v) => v && setViewMode(v)}
                  size="small"
                >
                  <ToggleButton value="list" aria-label="List"><ViewListIcon /></ToggleButton>
                  <ToggleButton value="grid" aria-label="Grid"><ViewModuleIcon /></ToggleButton>
                </ToggleButtonGroup>
                {viewMode === 'grid' && (
                  <ToggleButtonGroup
                    value={gridSize}
                    exclusive
                    size="small"
                    color="primary"
                    onChange={(e, v) => {
                      if (v !== null) setGridSize(v);
                    }}
                  >
                    <ToggleButton value="small" aria-label="Small tiles"><SizeSmallIcon /></ToggleButton>
                    <ToggleButton value="medium" aria-label="Medium tiles"><SizeMediumIcon /></ToggleButton>
                    <ToggleButton value="large" aria-label="Large tiles"><SizeLargeIcon /></ToggleButton>
                  </ToggleButtonGroup>
                )}
              </Box>
              {mediaDisplayed.length > 0 && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={allDisplayedSelected}
                        indeterminate={selectedIds.some((id) => mediaDisplayed.some((m) => m.id === id)) && !allDisplayedSelected}
                        onChange={toggleSelectAll}
                      />
                    }
                    label="Select all (files on page)"
                  />
                  {selectedIds.length > 0 && (
                    <>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<MoveIcon />}
                        onClick={() => openBulkMoveCopy('move')}
                      >
                        Move ({selectedIds.length})
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<CopyIcon />}
                        onClick={() => openBulkMoveCopy('copy')}
                      >
                        Copy ({selectedIds.length})
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        startIcon={<DeleteIcon />}
                        onClick={() => setDeleteDialog({ open: true, mediaId: null, ids: [...selectedIds], name: '' })}
                      >
                        Delete ({selectedIds.length})
                      </Button>
                    </>
                  )}
                </Box>
              )}
            </Box>

            <Box
              sx={{
                p: { xs: 1.5, sm: 2 },
                minHeight: 160,
                borderRadius: 2,
                transition: 'background-color 0.2s',
                ...(dropTargetFolderId === 'root'
                  ? { bgcolor: alpha(theme.palette.primary.main, 0.08), outline: `1px dashed ${theme.palette.primary.main}` }
                  : {}),
              }}
              onDragOver={(e) => handleDragOver(e, 'root')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, 'root')}
            >
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Drag files or folders onto a folder below to move them. Drop on <strong>Root</strong> in the path above to move to the drive root.
              </Typography>
              {totalFilesOnDrive > 0 && totalItems === 0 && folders.length > 0 && (
                <Alert severity="info" sx={{ mb: 2, borderRadius: 2 }}>
                  No files at this level, but this drive has <strong>{totalFilesOnDrive}</strong> file
                  {totalFilesOnDrive === 1 ? '' : 's'} total — open a folder below to view them.
                </Alert>
              )}
              {folders.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                    <FolderIcon color="primary" sx={{ fontSize: 22 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
                      Folders
                    </Typography>
                    <Chip size="small" label={folders.length} sx={{ height: 22 }} />
                  </Stack>
                  <Grid container spacing={1.5}>
                    {folders.map((f) => (
                      <Grid item xs={12} sm={6} md={4} key={f.id}>
                        <Paper
                          variant="outlined"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDragOver(e, f.id);
                          }}
                          onDragLeave={(e) => {
                            e.stopPropagation();
                            handleDragLeave(e);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDrop(e, f.id);
                          }}
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            transition: 'box-shadow 0.2s, border-color 0.2s, background-color 0.2s',
                            borderColor: dropTargetFolderId === f.id ? 'primary.main' : 'divider',
                            borderWidth: dropTargetFolderId === f.id ? 2 : 1,
                            bgcolor:
                              dropTargetFolderId === f.id
                                ? alpha(theme.palette.primary.main, 0.1)
                                : undefined,
                            '&:hover': {
                              borderColor: 'primary.light',
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                              boxShadow: 1,
                            },
                          }}
                        >
                          <Box
                            draggable
                            onDragStart={(e) => handleDragStart(e, 'folder', f)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleNavigateToFolder(f)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1.5,
                              flex: 1,
                              minWidth: 0,
                              cursor: 'grab',
                              '&:active': { cursor: 'grabbing' },
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 1.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.12),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <FolderIcon sx={{ fontSize: 28, color: 'primary.main' }} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography variant="subtitle2" fontWeight={600} noWrap title={f.name}>
                                {f.name}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Open folder
                              </Typography>
                            </Box>
                          </Box>
                          <Stack direction="row" alignItems="center" spacing={0}>
                            <Tooltip title="More">
                              <IconButton size="small" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleFolderMenuOpen(e, f)}>
                                <MoreVertIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Share link">
                              <IconButton
                                size="small"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openShareLink(
                                    'folder',
                                    f.id,
                                    `Share folder “${f.name}”`,
                                    'Anyone with the link can open this folder and browse all subfolders and files inside (read-only). Expires in 30 days.',
                                  );
                                }}
                              >
                                <ShareIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete folder">
                              <IconButton
                                size="small"
                                color="error"
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteFolderDialog({ open: true, folderId: f.id, name: f.name });
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              {folders.length === 0 && mediaDisplayed.length === 0 ? (
                <Alert
                  severity={totalFilesOnDrive > 0 && totalItems === 0 ? 'warning' : 'info'}
                  sx={{ borderRadius: 2 }}
                >
                  {totalFilesOnDrive > 0 && totalItems === 0 ? (
                    <>
                      <strong>Used space reflects {totalFilesOnDrive} file{totalFilesOnDrive === 1 ? '' : 's'}</strong> on this drive, but none are at this location.
                      They may be tied to a removed folder (data mismatch) or filters may hide them. Clear search/date filters or upload new files to this folder.
                    </>
                  ) : (
                    'This folder is empty. Upload files or create a subfolder.'
                  )}
                </Alert>
              ) : viewMode === 'list' ? (
                <Box>
                  {mediaDisplayed.length > 0 && (
                    <>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <VideoLibraryIcon color="action" sx={{ fontSize: 22 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
                          Files
                        </Typography>
                        <Chip size="small" label={mediaDisplayed.length} sx={{ height: 22 }} />
                      </Stack>
                      <TableContainer
                        sx={{
                          borderRadius: 2,
                          border: 1,
                          borderColor: 'divider',
                          overflow: 'hidden',
                        }}
                      >
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.06) }}>
                              <TableCell padding="checkbox" sx={{ width: 48 }} />
                              <TableCell sx={{ width: 88, fontWeight: 700 }}>Preview</TableCell>
                              <TableCell sx={{ fontWeight: 700 }}>Name</TableCell>
                              <TableCell align="right" sx={{ width: 110, fontWeight: 700 }}>Size</TableCell>
                              <TableCell sx={{ width: 200, fontWeight: 700 }}>Added</TableCell>
                              <TableCell align="right" sx={{ width: 110, fontWeight: 700 }}>Actions</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {mediaDisplayed.map((item) => (
                              <TableRow
                                key={item.id}
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'media', item)}
                                onDragEnd={handleDragEnd}
                                hover
                                selected={selectedIds.includes(item.id)}
                                sx={{
                                  '&:last-child td': { borderBottom: 0 },
                                  cursor: 'grab',
                                  '&:active': { cursor: 'grabbing' },
                                }}
                                onClick={() => setPreviewMedia(item)}
                              >
                                <TableCell
                                  padding="checkbox"
                                  onClick={(e) => e.stopPropagation()}
                                  onMouseDown={(e) => e.stopPropagation()}
                                >
                                  <Checkbox
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => toggleSelect(item.id)}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell sx={{ py: 1 }}>
                                  <Box sx={{ width: 72, height: 48, borderRadius: 1, overflow: 'hidden' }}>
                                    <MediaThumb item={item} height={48} variant="list" />
                                  </Box>
                                </TableCell>
                                <TableCell sx={{ maxWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={600} noWrap title={item.name}>
                                    {item.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                                    {item.category === 'video' ? 'Video' : 'Image'}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {formatFileSize(item.size)}
                                  </Typography>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2" color="text.secondary" noWrap>
                                    {new Date(item.uploadDate || item.createdAt).toLocaleString()}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                                  <Tooltip title="Preview">
                                    <IconButton
                                      size="small"
                                      onMouseDown={(e) => e.stopPropagation()}
                                      onClick={() => setPreviewMedia(item)}
                                    >
                                      {item.category === 'video' ? <PlayIcon fontSize="small" /> : <ViewIcon fontSize="small" />}
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="More actions">
                                    <IconButton size="small" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleMediaMenuOpen(e, item)}>
                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </>
                  )}
                  {folders.length > 0 && mediaDisplayed.length === 0 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No files in this folder — only subfolders above.
                    </Alert>
                  )}
                </Box>
              ) : (
                <Box>
                  {mediaDisplayed.length > 0 && (
                    <>
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
                        <VideoLibraryIcon color="action" sx={{ fontSize: 22 }} />
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
                          Files
                        </Typography>
                        <Chip size="small" label={mediaDisplayed.length} sx={{ height: 22 }} />
                      </Stack>
                      <Grid container spacing={gridSize === 'large' ? 3 : 2}>
                        {mediaDisplayed.map((item, index) => (
                          <Grid item {...gridConfig.cols} key={item.id}>
                            <Grow in timeout={80 * Math.min(index, 24)}>
                              <Card
                                draggable
                                onDragStart={(e) => handleDragStart(e, 'media', item)}
                                onDragEnd={handleDragEnd}
                                elevation={0}
                                sx={{
                                  height: '100%',
                                  borderRadius: 2,
                                  position: 'relative',
                                  border: 2,
                                  borderColor: selectedIds.includes(item.id) ? 'primary.main' : 'divider',
                                  transition: 'box-shadow 0.2s, border-color 0.2s, transform 0.2s',
                                  cursor: 'grab',
                                  '&:active': { cursor: 'grabbing' },
                                  '&:hover': {
                                    boxShadow: 4,
                                    borderColor: selectedIds.includes(item.id) ? 'primary.main' : alpha(theme.palette.primary.main, 0.35),
                                    transform: 'translateY(-2px)',
                                  },
                                }}
                              >
                                <Box sx={{ position: 'absolute', top: 8, left: 8, zIndex: 1 }}>
                                  <Checkbox
                                    checked={selectedIds.includes(item.id)}
                                    onChange={() => toggleSelect(item.id)}
                                    onClick={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    size="small"
                                    sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}
                                  />
                                </Box>
                                <Box sx={{ position: 'absolute', top: 6, right: 6, zIndex: 1 }}>
                                  <IconButton
                                    size="small"
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => handleMediaMenuOpen(e, item)}
                                    sx={{ bgcolor: 'background.paper', borderRadius: 1, boxShadow: 1 }}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                                <CardActionArea sx={{ height: '100%', p: 0 }} onClick={() => setPreviewMedia(item)}>
                                  <MediaThumb item={item} height={gridConfig.previewHeight} variant="grid" />
                                  <CardContent sx={{ textAlign: 'left', p: 2, pt: 1.5 }}>
                                    <Typography variant={gridConfig.titleVariant} sx={{ fontWeight: 700, lineHeight: 1.3 }} noWrap title={item.name}>
                                      {item.name}
                                    </Typography>
                                    <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 0.5 }}>
                                      <Typography variant="caption" color="text.secondary">
                                        {formatFileSize(item.size)}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        {new Date(item.uploadDate || item.createdAt).toLocaleDateString()}
                                      </Typography>
                                    </Stack>
                                    <Chip
                                      size="small"
                                      label={item.category === 'video' ? 'Video' : 'Image'}
                                      sx={{ mt: 1, height: 22, fontSize: '0.7rem' }}
                                      variant="outlined"
                                    />
                                  </CardContent>
                                </CardActionArea>
                              </Card>
                            </Grow>
                          </Grid>
                        ))}
                      </Grid>
                    </>
                  )}
                  {folders.length > 0 && mediaDisplayed.length === 0 && (
                    <Alert severity="info" sx={{ borderRadius: 2 }}>
                      No files in this folder — only subfolders above.
                    </Alert>
                  )}
                </Box>
              )}
              {totalItems > PAGE_SIZE && (
                <TablePagination
                  component="div"
                  count={totalItems}
                  page={pageSafe}
                  onPageChange={handlePageChange}
                  rowsPerPage={PAGE_SIZE}
                  rowsPerPageOptions={[PAGE_SIZE]}
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count}`}
                />
              )}
            </Box>
          </Paper>
        </Box>
      </Fade>

      <Dialog open={uploadDialogOpen} onClose={() => !uploading && setUploadDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Upload to this drive</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Files go into the folder you select below (default: current folder: <strong>{breadcrumb.map((b) => b.name).join(' / ')}</strong>).
          </Typography>
          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Save into folder (optional)</InputLabel>
            <Select
              value={selectedUploadFolder}
              label="Save into folder (optional)"
              onChange={(e) => setSelectedUploadFolder(e.target.value)}
            >
              <MenuItem value="">Current folder (breadcrumb)</MenuItem>
              {uploadDialogFolders.map((f) => (
                <MenuItem key={f.id} value={String(f.id)}>{f.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box {...getRootProps()} sx={{ border: '2px dashed', borderColor: 'divider', borderRadius: 2, p: 3, textAlign: 'center', cursor: 'pointer', mb: 2 }}>
            <input {...getInputProps()} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Drag and drop multiple files here, or add them with the button below.
            </Typography>
            <Button
              type="button"
              variant="contained"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                openFileDialog();
              }}
            >
              Add files
            </Button>
          </Box>
          {uploadFiles.length > 0 && (
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
              Files to upload ({uploadFiles.length})
            </Typography>
          )}
          <List dense disablePadding sx={{ bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
            {uploadFiles.map((item) => (
              <UploadProgressRow
                key={item.id}
                item={item}
                progress={uploadProgress[item.id]}
                onCancel={handleUploadCancel}
                onRemoveFromQueue={removeUploadFile}
                showCancel
              />
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadSubmit} disabled={uploading || uploadFiles.length === 0}>
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createFolderOpen} onClose={() => !createFolderLoading && setCreateFolderOpen(false)}>
        <DialogTitle>New folder</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Folder name"
            fullWidth
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateFolderOpen(false)} disabled={createFolderLoading}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateFolder} disabled={createFolderLoading}>Create</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(previewMedia)}
        onClose={() => setPreviewMedia(null)}
        maxWidth={previewMedia?.category === 'video' ? 'md' : 'sm'}
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ pb: 0 }}>{previewMedia?.name}</DialogTitle>
        <DialogContent sx={{ pt: 1, overflow: 'hidden' }}>
          {previewMedia && resolveMediaSrc(previewMedia.url) ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: '#000', borderRadius: 1, overflow: 'hidden' }}>
              {previewMedia.category === 'video' ? (
                <video
                  controls
                  autoPlay
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                  src={resolveMediaSrc(previewMedia.url)}
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  alt={previewMedia.name}
                  src={resolveMediaSrc(previewMedia.url)}
                  style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain' }}
                />
              )}
            </Box>
          ) : (
            <Alert severity="warning">No file URL on record. Re-upload may be required.</Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewMedia(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, mediaId: null, ids: [], name: '' })}>
        <DialogTitle>Delete media?</DialogTitle>
        <DialogContent>
          <Typography>
            {deleteDialog.ids?.length > 1
              ? `Delete ${deleteDialog.ids.length} selected item(s)? This cannot be undone.`
              : `Delete "${deleteDialog.name}"? This cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, mediaId: null, ids: [], name: '' })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteConfirm}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteFolderDialog.open} onClose={() => !deleteFolderLoading && setDeleteFolderDialog({ open: false, folderId: null, name: '' })}>
        <DialogTitle>Delete folder?</DialogTitle>
        <DialogContent>
          <Typography>
            Delete folder &quot;{deleteFolderDialog.name}&quot; and everything inside? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteFolderDialog({ open: false, folderId: null, name: '' })} disabled={deleteFolderLoading}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteFolderConfirm} disabled={deleteFolderLoading}>
            {deleteFolderLoading ? 'Deleting…' : 'Delete folder'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={mediaMenuAnchor}
        open={Boolean(mediaMenuAnchor)}
        onClose={handleMediaMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={openRenameFromMenu}>
          <ListItemIcon><RenameIcon fontSize="small" /></ListItemIcon>
          Rename
        </MenuItem>
        <MenuItem onClick={() => openMoveCopyFromMenu('move')}>
          <ListItemIcon><MoveIcon fontSize="small" /></ListItemIcon>
          Move to folder…
        </MenuItem>
        <MenuItem onClick={() => openMoveCopyFromMenu('copy')}>
          <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
          Copy to folder…
        </MenuItem>
        <MenuItem onClick={shareMediaFromMenu}>
          <ListItemIcon><ShareIcon fontSize="small" /></ListItemIcon>
          Share link
        </MenuItem>
        <MenuItem onClick={deleteFromMenu} sx={{ color: 'error.main' }}>
          <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={renameDialog.open}
        onClose={() => !renameLoading && setRenameDialog({ open: false, name: '', mediaId: null })}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Rename</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="File name"
            fullWidth
            value={renameDialog.name}
            onChange={(e) => setRenameDialog((d) => ({ ...d, name: e.target.value }))}
            onKeyDown={(e) => e.key === 'Enter' && handleRenameSave()}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialog({ open: false, name: '', mediaId: null })} disabled={renameLoading}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleRenameSave}
            disabled={renameLoading || !renameDialog.name?.trim()}
          >
            {renameLoading ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={shareDialog.open}
        onClose={() => !shareDialog.loading && setShareDialog({ open: false, link: '', title: '', description: '', loading: false })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{shareDialog.title}</DialogTitle>
        <DialogContent>
          {shareDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {shareDialog.description}
              </Typography>
              <TextField fullWidth size="small" value={shareDialog.link} InputProps={{ readOnly: true }} />
              <Button
                size="small"
                sx={{ mt: 1 }}
                startIcon={<ShareIcon />}
                onClick={() => {
                  navigator.clipboard.writeText(shareDialog.link);
                  setSnackbar({ open: true, message: 'Link copied', severity: 'success' });
                }}
              >
                Copy link
              </Button>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setShareDialog({ open: false, link: '', title: '', description: '', loading: false })}
            disabled={shareDialog.loading}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={moveCopyDialog.open}
        onClose={() => {
          if (!moveCopyLoading && !moveCopyFoldersLoading) {
            setMoveCopyDialog({
              open: false,
              mode: 'move',
              itemType: 'media',
              mediaId: null,
              mediaIds: null,
              sourceFolderId: null,
              targetDriveId: '',
              targetFolderId: '',
            });
          }
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{moveCopyDialogTitle()}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Choose the destination drive, then a folder (or drive root). You can move or copy within this drive or to another drive for this client.
          </Typography>
          <FormControl fullWidth size="small" sx={{ mt: 1 }}>
            <InputLabel id="move-copy-drive-label">Destination drive</InputLabel>
            <Select
              labelId="move-copy-drive-label"
              value={moveCopyDialog.targetDriveId}
              label="Destination drive"
              onChange={(e) => setMoveCopyDialog((d) => ({ ...d, targetDriveId: e.target.value, targetFolderId: '' }))}
            >
              {clientPlans.map((p) => (
                <MenuItem key={p.id} value={String(p.id)}>
                  {p.totalStorage} GB — exp. {new Date(p.expiryDate).toLocaleDateString()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {moveCopyDialog.itemType === 'folder'
            && moveCopyDialog.mode === 'move'
            && Number(moveCopyDialog.targetDriveId) !== Number(plan.id) && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              Moving a folder to another drive merges all files (including nested folders) into one folder on the destination; the old nested folder structure is removed.
            </Alert>
          )}
          {moveCopyFoldersLoading ? (
            <Typography variant="body2" sx={{ mt: 2 }}>Loading folders…</Typography>
          ) : (
            <FormControl fullWidth sx={{ mt: 2 }} size="small">
              <InputLabel id="move-copy-dest-label">Destination folder</InputLabel>
              <Select
                labelId="move-copy-dest-label"
                value={moveCopyDialog.targetFolderId}
                label="Destination folder"
                onChange={(e) => setMoveCopyDialog((d) => ({ ...d, targetFolderId: e.target.value }))}
              >
                <MenuItem value="">Drive root</MenuItem>
                {moveCopyFolders.map((f) => (
                  <MenuItem key={f.id} value={String(f.id)}>{f.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setMoveCopyDialog({
              open: false,
              mode: 'move',
              itemType: 'media',
              mediaId: null,
              mediaIds: null,
              sourceFolderId: null,
              targetDriveId: '',
              targetFolderId: '',
            })}
            disabled={moveCopyLoading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleMoveCopySave}
            disabled={moveCopyLoading || moveCopyFoldersLoading || !moveCopyDialog.targetDriveId}
          >
            {moveCopyLoading ? 'Working…' : moveCopyDialog.mode === 'move' ? 'Move' : 'Copy'}
          </Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={folderMenuAnchor}
        open={Boolean(folderMenuAnchor)}
        onClose={handleFolderMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <MenuItem
          onClick={() => {
            if (folderMenuFolder) openFolderMoveCopy(folderMenuFolder, 'move');
          }}
        >
          <ListItemIcon><MoveIcon fontSize="small" /></ListItemIcon>
          Move to…
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (folderMenuFolder) openFolderMoveCopy(folderMenuFolder, 'copy');
          }}
        >
          <ListItemIcon><CopyIcon fontSize="small" /></ListItemIcon>
          Copy to…
        </MenuItem>
      </Menu>

      <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>{snackbar.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default StudioDriveDetail;
