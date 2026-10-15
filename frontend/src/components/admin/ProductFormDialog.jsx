import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import api, { apiError, apiFieldErrors } from '../../api/client';
import { imageError, productSchema } from '../../validation/schemas';

const emptyProduct = {
  itemCode: '',
  name: '',
  category: '',
  motorcycleBrand: '',
  unit: 'pc',
  price: '',
  stockQuantity: 0,
  description: '',
  status: 'Active',
  modelIds: [],
};

export function ProductFormDialog({ open, product, categories, models, onClose, onSaved }) {
  const [files, setFiles] = useState([]);
  const [fileMessage, setFileMessage] = useState('');
  const [formError, setFormError] = useState('');
  const [nextCode, setNextCode] = useState('MT-XXXX');
  const form = useForm({ resolver: yupResolver(productSchema), defaultValues: emptyProduct });

  useEffect(() => {
    if (!open) return;
    setFiles([]);
    setFileMessage('');
    setFormError('');
    form.reset(product ? {
      itemCode: product.itemCode,
      name: product.name,
      category: product.category?.id || '',
      motorcycleBrand: product.motorcycleBrand,
      unit: product.unit,
      price: product.price,
      stockQuantity: product.stockQuantity,
      description: product.description,
      status: product.status,
      modelIds: (product.modelIds || []).map(String),
    } : emptyProduct);
    if (!product) {
      api.get('/products/manage/next-code')
        .then(({ data }) => setNextCode(data.itemCode))
        .catch(() => setNextCode('Assigned on save'));
    }
  }, [open, product]);

  async function refresh(next) {
    onSaved(next);
  }

  async function onSubmit(values) {
    const message = imageError(files, 5 * 1024 * 1024);
    if (message) {
      setFileMessage(message);
      return;
    }
    const body = new FormData();
    Object.entries(values).forEach(([key, value]) => {
      body.append(key, key === 'modelIds' ? JSON.stringify(value) : value);
    });
    files.forEach((file) => body.append('photos', file));

    try {
      const response = product
        ? await api.put(`/products/${product.id}`, body)
        : await api.post('/products', body);
      onSaved(response.data.product, true);
    } catch (error) {
      const fields = apiFieldErrors(error);
      Object.entries(fields).forEach(([key, fieldMessage]) => form.setError(key, { message: fieldMessage }));
      if (!Object.keys(fields).length) setFormError(apiError(error));
    }
  }

  async function imageAction(request) {
    try {
      const response = await request();
      await refresh(response.data.product);
    } catch (error) {
      setFormError(apiError(error));
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{product ? 'Update product' : 'New product'}</DialogTitle>
      <DialogContent>
        {formError && <Typography color="error" sx={{ mt: 1 }}>{formError}</Typography>}
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Item code"
            value={product?.itemCode || nextCode}
            disabled
            helperText={product ? 'Item codes are assigned automatically and cannot be changed.' : 'This code is assigned automatically when you save.'}
          />
          <TextField label="Product name" {...form.register('name')} error={!!form.formState.errors.name} helperText={form.formState.errors.name?.message} />
          <Controller
            name="category"
            control={form.control}
            render={({ field }) => (
              <TextField select label="Category" {...field} error={!!form.formState.errors.category} helperText={form.formState.errors.category?.message}>
                <MenuItem value="">Select a category</MenuItem>
                {categories.map((category) => <MenuItem key={category.id} value={category.id}>{category.name}</MenuItem>)}
              </TextField>
            )}
          />
          <TextField label="Motorcycle brand" {...form.register('motorcycleBrand')} error={!!form.formState.errors.motorcycleBrand} helperText={form.formState.errors.motorcycleBrand?.message} />
          <Controller
            name="modelIds"
            control={form.control}
            render={({ field }) => (
              <TextField
                select
                label="Compatible models"
                {...field}
                slotProps={{ select: { multiple: true } }}
                error={!!form.formState.errors.modelIds}
                helperText={form.formState.errors.modelIds?.message || 'Hold Ctrl or Cmd to select more than one.'}
              >
                {models.map((model) => <MenuItem key={model.id} value={String(model.id)}>{model.brand} {model.name}</MenuItem>)}
              </TextField>
            )}
          />
          <Controller
            name="unit"
            control={form.control}
            render={({ field }) => (
              <TextField select label="Unit" {...field} error={!!form.formState.errors.unit} helperText={form.formState.errors.unit?.message}>
                {['pc', 'set', 'pair', 'kit'].map((unit) => <MenuItem key={unit} value={unit}>{unit}</MenuItem>)}
              </TextField>
            )}
          />
          <TextField label="Price" type="number" {...form.register('price')} error={!!form.formState.errors.price} helperText={form.formState.errors.price?.message} />
          <TextField label="Stock quantity" type="number" {...form.register('stockQuantity')} error={!!form.formState.errors.stockQuantity} helperText={form.formState.errors.stockQuantity?.message} />
          <TextField label="Description" multiline minRows={3} {...form.register('description')} error={!!form.formState.errors.description} helperText={form.formState.errors.description?.message} />
          <Controller
            name="status"
            control={form.control}
            render={({ field }) => (
              <TextField select label="Status" {...field}>
                <MenuItem value="Active">Active</MenuItem>
                <MenuItem value="Inactive">Inactive</MenuItem>
              </TextField>
            )}
          />
          <TextField
            type="file"
            inputProps={{ accept: 'image/jpeg,image/png,image/webp', multiple: true }}
            helperText={fileMessage || 'JPG, PNG, or WEBP. Up to 8 photos, 5 MB each. Uploaded to Cloudinary.'}
            error={Boolean(fileMessage)}
            onChange={(event) => {
              const chosen = Array.from(event.target.files || []);
              setFiles(chosen);
              setFileMessage(imageError(chosen, 5 * 1024 * 1024));
            }}
          />
          {product?.images?.length > 0 && (
            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
              {product.images.map((image, index) => (
                <Stack key={image.id} spacing={1} sx={{ width: 140 }}>
                  <div style={{ position: 'relative' }}>
                    <img src={image.url} alt="" style={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                    <Typography
                      variant="caption"
                      sx={{
                        position: 'absolute',
                        right: 6,
                        bottom: 6,
                        bgcolor: 'rgba(0,0,0,0.75)',
                        color: 'white',
                        px: 0.7,
                        borderRadius: 1,
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}/{product.images.length}{image.isPrimary ? ' · Main' : ''}
                    </Typography>
                  </div>
                  <Button size="small" variant={image.isPrimary ? 'contained' : 'outlined'} onClick={() => imageAction(() => api.patch(`/products/${product.id}/images/${image.id}/primary`))}>
                    {image.isPrimary ? 'Primary' : 'Set primary'}
                  </Button>
                  <Button size="small" component="label">
                    Replace
                    <input
                      hidden
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (!file) return;
                        const message = imageError([file], 5 * 1024 * 1024);
                        if (message) {
                          setFileMessage(message);
                          return;
                        }
                        const body = new FormData();
                        body.append('photo', file);
                        imageAction(() => api.put(`/products/${product.id}/images/${image.id}`, body));
                      }}
                    />
                  </Button>
                  <Button size="small" color="error" onClick={() => imageAction(() => api.delete(`/products/${product.id}/images/${image.id}`))}>Remove</Button>
                </Stack>
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={form.handleSubmit(onSubmit)} disabled={form.formState.isSubmitting}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
