import { useEffect, useRef, useState } from 'react';
import DataTable from 'datatables.net-dt';
import 'datatables.net-dt/css/dataTables.dataTables.css';
import {
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api, { apiError } from '../../api/client';
import { ProductFormDialog } from '../../components/admin/ProductFormDialog';
import { useAdminUi } from '../../components/admin/AdminLayout';
import { peso } from '../../utils/format';

export function Products() {
  const { notify } = useAdminUi();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [editing, setEditing] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const tableRef = useRef(null);
  const wrapRef = useRef(null);
  const dtRef = useRef(null);
  const selectedRef = useRef([]);

  async function load() {
    const [productRes, categoryRes, modelRes] = await Promise.all([
      api.get('/products/manage/all'),
      api.get('/categories'),
      api.get('/models'),
    ]);
    setProducts(productRes.data.products);
    setCategories(categoryRes.data.categories);
    setModels(modelRes.data.models);
    setSelected([]);
  }

  useEffect(() => {
    load().catch((error) => notify(apiError(error), 'error')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    selectedRef.current = selected;
    wrapRef.current?.querySelectorAll('.product-check').forEach((box) => {
      box.checked = selected.includes(box.dataset.id);
    });
  }, [selected]);

  useEffect(() => {
    if (!tableRef.current || loading) return undefined;
    const table = new DataTable(tableRef.current, {
      data: products.map((product) => ({
        id: String(product.id),
        photo: product.images.find((image) => image.isPrimary)?.url || product.images[0]?.url || '',
        imageCount: product.imageCount || product.images.length,
        itemCode: product.itemCode,
        name: product.name,
        category: product.category?.name || '',
        brand: product.motorcycleBrand,
        price: product.price,
        stock: product.stockQuantity,
        status: product.deletedAt ? 'Deleted' : product.status,
        created: new Date(product.createdAt).toLocaleDateString('en-PH'),
        deleted: Boolean(product.deletedAt),
      })),
      columns: [
        {
          title: '',
          data: 'id',
          orderable: false,
          searchable: false,
          render: (id) => `<input type="checkbox" class="product-check" data-id="${id}" />`,
        },
        {
          title: 'Photo',
          data: 'photo',
          orderable: false,
          render: (url, _type, row) => {
            if (!url) return '';
            const extra = row.imageCount > 1 ? `<span style="position:absolute;right:2px;bottom:2px;background:#12151a;color:#fff;font-size:10px;font-weight:700;border-radius:8px;padding:1px 5px;">+${row.imageCount - 1}</span>` : '';
            return `<span style="position:relative;display:inline-block;">${extra}<img src="${url}" alt="" width="48" height="48" style="object-fit:cover;border-radius:6px;" /></span>`;
          },
        },
        { title: 'Item code', data: 'itemCode' },
        { title: 'Name', data: 'name' },
        { name: 'category', title: 'Category', data: 'category' },
        { title: 'Brand', data: 'brand' },
        { title: 'Price', data: 'price', render: (value) => peso(value) },
        { title: 'Stock', data: 'stock' },
        { name: 'status', title: 'Status', data: 'status' },
        { title: 'Created', data: 'created' },
        {
          title: 'Actions',
          data: 'id',
          orderable: false,
          searchable: false,
          render: (_id, _type, row) => row.deleted
            ? `<button type="button" class="row-action" data-action="restore" data-id="${row.id}">Restore</button>`
            : `<button type="button" class="row-action" data-action="edit" data-id="${row.id}">Edit</button> <button type="button" class="row-action" data-action="delete" data-id="${row.id}">Delete</button>`,
        },
      ],
      pageLength: 10,
      order: [[2, 'asc']],
    });
    dtRef.current = table;
    table.on('draw', () => {
      wrapRef.current?.querySelectorAll('.product-check').forEach((box) => {
        box.checked = selectedRef.current.includes(box.dataset.id);
      });
    });

    return () => {
      table.destroy();
      dtRef.current = null;
    };
  }, [products, loading]);

  useEffect(() => {
    const table = dtRef.current;
    if (!table) return;
    table.column('category:name').search(categoryFilter).draw();
  }, [categoryFilter, products]);

  useEffect(() => {
    const table = dtRef.current;
    if (!table) return;
    table.column('status:name').search(statusFilter).draw();
  }, [statusFilter, products]);

  function visibleIds() {
    if (!dtRef.current) return products.map((product) => String(product.id));
    return dtRef.current.rows({ search: 'applied' }).data().toArray().map((row) => String(row.id));
  }

  function toggleAll(checked) {
    const ids = visibleIds();
    setSelected((current) => (checked ? Array.from(new Set([...current, ...ids])) : current.filter((id) => !ids.includes(id))));
  }

  function onTableChange(event) {
    const box = event.target.closest?.('.product-check');
    if (!box) return;
    setSelected((current) => (box.checked ? Array.from(new Set([...current, box.dataset.id])) : current.filter((id) => id !== box.dataset.id)));
  }

  function onTableClick(event) {
    const button = event.target.closest?.('[data-action]');
    if (!button) return;
    const product = products.find((item) => String(item.id) === button.dataset.id);
    if (!product) return;
    if (button.dataset.action === 'edit') {
      setEditing(product);
      setFormOpen(true);
    }
    if (button.dataset.action === 'delete') setConfirm({ type: 'one', ids: [product.id], label: product.name });
    if (button.dataset.action === 'restore') setConfirm({ type: 'restore', ids: [product.id], label: product.name });
  }

  async function runDelete() {
    try {
      const response = confirm.type === 'restore'
        ? await api.patch(`/products/${confirm.ids[0]}/restore`)
        : confirm.type === 'one'
          ? await api.delete(`/products/${confirm.ids[0]}`)
          : await api.post('/products/bulk-delete', { ids: confirm.ids });
      notify(response.data.message);
      setConfirm(null);
      await load();
    } catch (error) {
      notify(apiError(error), 'error');
    }
  }

  const ids = visibleIds();
  const allChecked = ids.length > 0 && ids.every((id) => selected.includes(id));

  return (
    <>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" spacing={2} sx={{ mb: 2 }}>
        <Typography variant="h4">Products</Typography>
        <Button variant="contained" onClick={() => { setEditing(null); setFormOpen(true); }}>New product</Button>
      </Stack>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <FormControlLabel control={<Checkbox checked={allChecked} onChange={(event) => toggleAll(event.target.checked)} />} label="Select all" />
        <TextField select label="Filter category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} sx={{ minWidth: 180 }}>
          <MenuItem value="">All</MenuItem>
          {categories.map((category) => <MenuItem key={category.id} value={category.name}>{category.name}</MenuItem>)}
        </TextField>
        <TextField select label="Filter status" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Inactive">Inactive</MenuItem>
          <MenuItem value="Deleted">Deleted</MenuItem>
        </TextField>
        <Button color="error" variant="contained" disabled={!selected.length} onClick={() => setConfirm({ type: 'bulk', ids: selected, label: `${selected.length} selected products` })}>
          Bulk delete
        </Button>
      </Stack>
      {loading ? <CircularProgress /> : (
        <div ref={wrapRef} onChange={onTableChange} onClick={onTableClick} className="admin-table-card">
          <table ref={tableRef} className="display" style={{ width: '100%' }} />
        </div>
      )}

      <ProductFormDialog
        open={formOpen}
        product={editing}
        categories={categories}
        models={models}
        onClose={() => setFormOpen(false)}
        onSaved={(next, close) => {
          setEditing(next);
          load();
          if (close) {
            setFormOpen(false);
            notify('Product saved.');
          }
        }}
      />

      <Dialog open={Boolean(confirm)} onClose={() => setConfirm(null)}>
        <DialogTitle>{confirm?.type === 'restore' ? 'Restore product' : 'Soft delete product'}</DialogTitle>
        <DialogContent>
          {confirm?.type === 'restore'
            ? `Restore ${confirm?.label} and show it in the shop again?`
            : `Remove ${confirm?.label} from the shop? This is a soft delete. Photos and order history stay, and you can restore it later.`}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)}>Cancel</Button>
          <Button color={confirm?.type === 'restore' ? 'primary' : 'error'} variant="contained" onClick={runDelete}>
            {confirm?.type === 'restore' ? 'Restore' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
