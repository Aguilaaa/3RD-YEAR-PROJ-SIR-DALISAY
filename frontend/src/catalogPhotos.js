const PHOTOS = {
  Exhaust: '/store/performance.jpg',
  Braking: '/store/brakes.jpg',
  Suspension: '/store/frame.jpg',
  Electrical: '/store/drivetrain.jpg',
  Engine: '/store/performance.jpg',
  'Body/Protection': '/store/body.jpg',
  Lighting: '/store/frame.jpg',
  Accessories: '/store/accessories.jpg',
  'Riding Gear': '/store/body.jpg',
};

export function productPhoto(product) {
  return product.imageUrl || PHOTOS[product.categoryName] || '/store/hero-track.jpg';
}

function models(labels) {
  return labels.map((label) => {
    const [brand, ...rest] = label.split(' ');
    return { brand, name: rest.join(' ') };
  });
}

const ROWS = [
  ['MT-EX-450', '450SR Slip-On Exhaust', 'Exhaust', 'CFMOTO', 12800, 6, ['CFMOTO 450SR']],
  ['MT-BR-450', 'Sintered Brake Pads', 'Braking', 'CFMOTO', 890, 24, ['CFMOTO 450SR', 'CFMOTO 400NK']],
  ['MT-SU-675', 'Adjustable Rear Shock', 'Suspension', 'CFMOTO', 18500, 3, ['CFMOTO 675SR']],
  ['MT-EL-400', 'Regulator Rectifier', 'Electrical', 'CFMOTO', 2450, 10, ['CFMOTO 400NK']],
  ['MT-EN-700', 'High-Flow Air Filter', 'Engine', 'CFMOTO', 1650, 18, ['CFMOTO 700MT']],
  ['MT-BD-SLD', 'Frame Sliders', 'Body/Protection', 'CFMOTO', 2100, 14, ['CFMOTO 450SR', 'CFMOTO 400NK']],
  ['MT-LT-AUX', 'Auxiliary LED Lamps', 'Lighting', 'CFMOTO', 3200, 11, ['CFMOTO 700MT']],
  ['MT-AC-CHN', 'Chain Cleaning Kit', 'Accessories', 'Universal', 420, 40, ['CFMOTO 450SR', 'Yamaha MT-07', 'Kawasaki Z400']],
  ['MT-RG-JKT', 'Mesh Riding Jacket', 'Riding Gear', 'Universal', 5600, 8, ['Honda CB650R', 'Yamaha MT-07']],
  ['MT-BD-WND', 'Touring Windscreen', 'Body/Protection', 'CFMOTO', 2750, 7, ['CFMOTO 700MT']],
  ['MT-EX-675', 'Full-System Exhaust', 'Exhaust', 'CFMOTO', 24900, 2, ['CFMOTO 675SR']],
  ['MT-BR-LINE', 'Steel-Braided Brake Line', 'Braking', 'CFMOTO', 1350, 16, ['CFMOTO 400NK', 'CFMOTO 450SR']],
  ['MT-LT-SIG', 'Sequential LED Signals', 'Lighting', 'CFMOTO', 980, 20, ['CFMOTO 450SR']],
  ['MT-AC-GRP', 'Lock-On Grips', 'Accessories', 'CFMOTO', 650, 30, ['CFMOTO 400NK', 'CFMOTO 450SR']],
  ['MT-SU-LNK', 'Lowering Link', 'Suspension', 'CFMOTO', 780, 12, ['CFMOTO 700MT']],
  ['MT-RG-GLV', 'Leather Riding Gloves', 'Riding Gear', 'Universal', 1900, 15, ['Kawasaki Z400', 'Suzuki GSX-S750']],
];

export const SAMPLE_PRODUCTS = ROWS.map(([itemCode, name, categoryName, motorcycleBrand, price, stockQuantity, compatible]) => ({
  id: itemCode,
  itemCode,
  name,
  categoryName,
  motorcycleBrand,
  price,
  stockQuantity,
  models: models(compatible),
  imageUrl: '',
  averageRating: 0,
}));

export function filterSamples(products, { search = '', categoryName = '', price = '', rating = '', modelId = '', models = [] }) {
  if (rating) return [];
  const selected = models.find((model) => model.id === modelId);
  const words = search.trim().toLowerCase();

  return products.filter((product) => {
    if (categoryName && product.categoryName !== categoryName) return false;
    if (words) {
      const haystack = `${product.name} ${product.itemCode} ${product.models.map((model) => `${model.brand} ${model.name}`).join(' ')}`.toLowerCase();
      if (!haystack.includes(words)) return false;
    }
    if (price === 'under-500' && !(product.price < 500)) return false;
    if (price === '500-1000' && !(product.price >= 500 && product.price <= 1000)) return false;
    if (price === '1000-5000' && !(product.price > 1000 && product.price <= 5000)) return false;
    if (price === 'above-5000' && !(product.price > 5000)) return false;
    if (selected) {
      const label = `${selected.brand} ${selected.name}`;
      if (!product.models.some((model) => `${model.brand} ${model.name}` === label)) return false;
    }
    return true;
  });
}
