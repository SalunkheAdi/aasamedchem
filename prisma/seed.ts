import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

// Database setup mimicking our db.ts config
const connectionString =
  process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/assignment";

console.log("Seeding database via connection:", connectionString);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Starting database seeding...");

  // 1. Create Default Users
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const sellerPasswordHash = await bcrypt.hash("seller123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@medchem.com" },
    update: {},
    create: {
      email: "admin@medchem.com",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "ADMIN",
    },
  });
  console.log("Created admin user:", admin.email);

  const seller = await prisma.user.upsert({
    where: { email: "seller@medchem.com" },
    update: {},
    create: {
      email: "seller@medchem.com",
      username: "seller",
      passwordHash: sellerPasswordHash,
      role: "SELLER",
    },
  });
  console.log("Created seller user:", seller.email);

  // 2. Create Products
  const productsToSeed = [
    {
      name: "Acetonitrile 99.9% HPLC Grade",
      sku: "SOL-ACN-001",
      description: "High-purity organic solvent suitable for high-performance liquid chromatography.",
      category: "Solvents",
      dimension: "WEIGHT" as const,
      baseUnit: "g",
      stock: 150000, // 150 kg in grams
      price: 450, // ₹450 per kg
      priceUnit: "kg",
    },
    {
      name: "Sodium Bicarbonate Reagent Grade",
      sku: "RGT-SBC-002",
      description: "Fine chemical compound used as buffering agent and chemical synthesis reagent.",
      category: "Reagents",
      dimension: "WEIGHT" as const,
      baseUnit: "g",
      stock: 5000, // 5 kg in grams
      price: 15, // ₹15 per gram (expensive fine chemical)
      priceUnit: "g",
    },
    {
      name: "Methanol Anhydrous",
      sku: "SOL-MTH-003",
      description: "Dry solvent with exceptionally low water content for moisture-sensitive reactions.",
      category: "Solvents",
      dimension: "VOLUME" as const,
      baseUnit: "mL",
      stock: 200000, // 200 L in mL
      price: 320, // ₹320 per L
      priceUnit: "L",
    },
    {
      name: "Hydrochloric Acid 37% Tech Grade",
      sku: "ACD-HCL-004",
      description: "Strong inorganic acid with corrosive properties. Store in acid cabinets.",
      category: "Acids",
      dimension: "VOLUME" as const,
      baseUnit: "mL",
      stock: 25000, // 25 L in mL
      price: 90, // ₹90 per L
      priceUnit: "L",
    },
    {
      name: "Pipette Tips 200uL Autoclavable",
      sku: "EQP-PIP-005",
      description: "Box of 96 premium polypropylene pipette tips, clean and sterilized.",
      category: "Equipment",
      dimension: "COUNT" as const,
      baseUnit: "items",
      stock: 120, // 120 boxes
      price: 180, // ₹180 per box
      priceUnit: "items",
    },
    {
      name: "Magnetic Stirrer Bar (25mm)",
      sku: "EQP-MSB-006",
      description: "PTFE coated octagonal stirring rod with pivot ring.",
      category: "Equipment",
      dimension: "COUNT" as const,
      baseUnit: "items",
      stock: 45,
      price: 85, // ₹85 per item
      priceUnit: "items",
    },
  ];

  for (const item of productsToSeed) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {},
      create: {
        name: item.name,
        sku: item.sku,
        description: item.description,
        category: item.category,
        dimension: item.dimension,
        baseUnit: item.baseUnit,
        stock: item.stock,
        price: item.price,
        priceUnit: item.priceUnit,
      },
    });
    console.log(`Created product: ${product.name} (SKU: ${product.sku})`);
  }

  console.log("Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
