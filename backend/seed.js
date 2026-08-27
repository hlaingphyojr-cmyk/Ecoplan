require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Plan = require('./models/Plan');

const demoPlans = [
  {
    title: 'Closed-loop recycled rubber tyre',
    productType: 'tyres',
    description:
      'Manufacture tyres from recycled rubber crumb blended with silica, using solar-heated curing to slash energy use.',
    materials: ['recycled rubber crumb', 'silica', 'bio-based additives'],
    steps: [
      'Collect and devulcanize end-of-life tyre rubber',
      'Blend 45% recycled crumb with fresh silica compound',
      'Extrude tread using low-torque, servo-driven extruders',
      'Cure with solar-thermal + recovered heat ovens',
      'Balance and inspect under LED lighting, water-mist trim',
    ],
    baseline: { co2: 38, water: 210, electricity: 14, material: 100 },
    optimized: { co2: 19, water: 92, electricity: 6.5, material: 45 },
  },
  {
    title: 'Single-material recyclable sneaker',
    productType: 'shoes',
    description:
      'A mono-material sneaker knitted from recycled PET yarn with a compression-molded sole, designed for easy disassembly and recycling.',
    materials: ['recycled PET yarn', 'regrind TPU sole', 'waterless-dye'],
    steps: [
      'Knit uppers from 100% recycled PET yarn',
      'Waterless CO2 dyeing for color',
      'Compression-mold sole from TPU regrind at low temp',
      'Sonic-weld upper to sole (no glue)',
      'Assemble and pack in recycled cardboard',
    ],
    baseline: { co2: 12, water: 95, electricity: 3.2, material: 100 },
    optimized: { co2: 4.8, water: 11, electricity: 1.1, material: 90 },
  },
  {
    title: 'Lightweight recycled-aluminium can',
    productType: 'cans',
    description:
      'Ultra-light beverage cans from 80% recycled aluminium with a water-free lubricant line and regrind-friendly coatings.',
    materials: ['recycled aluminium', 'bio-based coating', 'recycled ink'],
    steps: [
      'Melt recycled aluminium scrap with induction furnaces',
      'Cast thin sheet, optimize gauge to 0.20mm',
      'Cup and draw using servo-die lubrication-free tooling',
      'Print with recycled-ink UV press, no chemical baths',
      'Quench-cool with closed-loop water recycling',
    ],
    baseline: { co2: 9, water: 40, electricity: 2.8, material: 100 },
    optimized: { co2: 2.7, water: 8, electricity: 1.0, material: 80 },
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/ecoplan');
  await User.deleteMany({});
  await Plan.deleteMany({});

  const passwordHash = await bcrypt.hash('demo1234', 10);
  const adminHash = await bcrypt.hash('admin1234', 10);
  const demoUser = await User.create({ name: 'Eco Demo', email: 'demo@ecoplan.app', passwordHash });
  const adminUser = await User.create({
    name: 'Eco Admin',
    email: 'admin@ecoplan.app',
    passwordHash: adminHash,
    role: 'admin',
  });

  const withAuthor = demoPlans.map((p) => ({ ...p, author: demoUser._id }));
  await Plan.create(withAuthor);

  console.log(
    'Seeded demo user (demo@ecoplan.app / demo1234), admin (admin@ecoplan.app / admin1234) and',
    withAuthor.length,
    'plans.'
  );
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});