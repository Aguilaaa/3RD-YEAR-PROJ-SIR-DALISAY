const fs = require('fs');
const path = require('path');
const Category = require('./models/Category');
const MotorcycleModel = require('./models/MotorcycleModel');
const Product = require('./models/Product');
const ProductCompatibility = require('./models/ProductCompatibility');
const ProductImage = require('./models/ProductImage');
const { uploadBuffer, cloudinaryConfigured } = require('./config/cloudinary');
const { CATEGORY_NAMES } = require('./constants');

const CATEGORY_PHOTOS = {
  Exhaust: 'performance.jpg',
  Braking: 'brakes.jpg',
  Suspension: 'frame.jpg',
  Electrical: 'drivetrain.jpg',
  Engine: 'performance.jpg',
  'Body/Protection': 'body.jpg',
  Lighting: 'frame.jpg',
  Accessories: 'accessories.jpg',
  'Riding Gear': 'body.jpg',
};

const MODELS = [
  ['CFMOTO', '450SR'],
  ['CFMOTO', '675SR'],
  ['CFMOTO', '400NK'],
  ['CFMOTO', '700MT'],
  ['Honda', 'CB650R'],
  ['Yamaha', 'MT-07'],
  ['Kawasaki', 'Z400'],
  ['Suzuki', 'GSX-S750'],
];

const PRODUCTS = [
  ['MT-EX-450', '450SR Slip-On Exhaust', 'Exhaust', 'CFMOTO', 'pc', 12800, 6, 'Stainless slip-on with a removable baffle, built for the CFMOTO 450SR.', ['CFMOTO 450SR']],
  ['MT-BR-450', 'Sintered Brake Pads', 'Braking', 'CFMOTO', 'set', 890, 24, 'Sintered compound pads for stronger bite on street and canyon rides.', ['CFMOTO 450SR', 'CFMOTO 400NK']],
  ['MT-SU-675', 'Adjustable Rear Shock', 'Suspension', 'CFMOTO', 'pc', 18500, 3, 'Rebound and preload adjustable shock for the 675SR.', ['CFMOTO 675SR']],
  ['MT-EL-400', 'Regulator Rectifier', 'Electrical', 'CFMOTO', 'pc', 2450, 10, 'Replacement regulator that keeps charging voltage steady.', ['CFMOTO 400NK']],
  ['MT-EN-700', 'High-Flow Air Filter', 'Engine', 'CFMOTO', 'pc', 1650, 18, 'Washable filter that improves airflow without dropping filtration.', ['CFMOTO 700MT']],
  ['MT-BD-SLD', 'Frame Sliders', 'Body/Protection', 'CFMOTO', 'set', 2100, 14, 'Delrin sliders that take the hit so the fairings do not.', ['CFMOTO 450SR', 'CFMOTO 400NK']],
  ['MT-LT-AUX', 'Auxiliary LED Lamps', 'Lighting', 'CFMOTO', 'pair', 3200, 11, 'Wide-beam lamps for night touring on the 700MT.', ['CFMOTO 700MT']],
  ['MT-AC-CHN', 'Chain Cleaning Kit', 'Accessories', 'Universal', 'kit', 420, 40, 'Brush, cleaner, and lube sized for street chains.', ['CFMOTO 450SR', 'Yamaha MT-07', 'Kawasaki Z400']],
  ['MT-RG-JKT', 'Mesh Riding Jacket', 'Riding Gear', 'Universal', 'pc', 5600, 8, 'Armored mesh jacket with CE elbow and shoulder pads.', ['Honda CB650R', 'Yamaha MT-07']],
  ['MT-BD-WND', 'Touring Windscreen', 'Body/Protection', 'CFMOTO', 'pc', 2750, 7, 'Taller screen that pushes highway wind off the chest.', ['CFMOTO 700MT']],
  ['MT-EX-675', 'Full-System Exhaust', 'Exhaust', 'CFMOTO', 'set', 24900, 2, 'Header and muffler system in brushed stainless for the 675SR.', ['CFMOTO 675SR']],
  ['MT-BR-LINE', 'Steel-Braided Brake Line', 'Braking', 'CFMOTO', 'pc', 1350, 16, 'Braided line that firms up lever feel.', ['CFMOTO 400NK', 'CFMOTO 450SR']],
  ['MT-LT-SIG', 'Sequential LED Signals', 'Lighting', 'CFMOTO', 'set', 980, 20, 'Smoked sequential signals with a plug-and-play harness.', ['CFMOTO 450SR']],
  ['MT-AC-GRP', 'Lock-On Grips', 'Accessories', 'CFMOTO', 'pair', 650, 30, 'Diamond-pattern lock-on grips that stay put in the rain.', ['CFMOTO 400NK', 'CFMOTO 450SR']],
  ['MT-SU-LNK', 'Lowering Link', 'Suspension', 'CFMOTO', 'pc', 780, 12, 'Drops seat height slightly for the 700MT without killing travel.', ['CFMOTO 700MT']],
  ['MT-RG-GLV', 'Leather Riding Gloves', 'Riding Gear', 'Universal', 'pair', 1900, 15, 'Goatskin gloves with palm sliders and a wrist strap.', ['Kawasaki Z400', 'Suzuki GSX-S750']],
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seedReferenceData() {
  for (const name of CATEGORY_NAMES) {
    await Category.updateOne({ name }, { name, slug: slugify(name) }, { upsert: true });
  }

  for (const [brand, name] of MODELS) {
    await MotorcycleModel.updateOne({ brand, name }, { brand, name }, { upsert: true });
  }

  if ((await Product.countDocuments()) === 0) {

  const categories = await Category.find().lean();
  const models = await MotorcycleModel.find().lean();
  const categoryId = new Map(categories.map((category) => [category.name, category._id]));
  const modelId = new Map(models.map((model) => [`${model.brand} ${model.name}`, model._id]));

  for (const [itemCode, name, category, motorcycleBrand, unit, price, stockQuantity, description, compatible] of PRODUCTS) {
    const product = await Product.create({
      itemCode,
      name,
      category: categoryId.get(category),
      motorcycleBrand,
      unit,
      price,
      stockQuantity,
      description,
      status: 'Active',
    });

    await ProductCompatibility.insertMany(
      compatible.map((label) => ({ product: product._id, model: modelId.get(label) }))
    );
  }

    console.log('Seeded MotoTech categories, models, and sample products.');
  }

  await ensureProductPhotos();
}

async function ensureProductPhotos() {
  if (!cloudinaryConfigured()) return;

  const photoDir = path.join(__dirname, '../../client/public/store');
  const products = await Product.find().populate('category');
  let added = 0;

  for (const product of products) {
    const existing = await ProductImage.exists({ product: product._id });
    if (existing) continue;

    const fileName = CATEGORY_PHOTOS[product.category?.name];
    if (!fileName) continue;

    const result = await uploadBuffer(fs.readFileSync(path.join(photoDir, fileName)), 'mototech/products');
    await ProductImage.create({
      product: product._id,
      url: result.secure_url,
      publicId: result.public_id,
      isPrimary: true,
    });
    added += 1;
  }

  if (added) console.log(`Added photos for ${added} products.`);
}

if (require.main === module) {
  require('dotenv').config();
  const mongoose = require('mongoose');
  const { connectDB } = require('./config/db');

  connectDB()
    .then(async () => {
      await seedReferenceData();
      await mongoose.disconnect();
      console.log('Seed complete.');
    })
    .catch(async (error) => {
      console.error(error.message);
      await mongoose.disconnect().catch(() => {});
      process.exit(1);
    });
}

module.exports = { seedReferenceData };
