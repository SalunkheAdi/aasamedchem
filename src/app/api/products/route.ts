import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import Decimal = Prisma.Decimal;
import { UNIT_CONFIG, areUnitsCompatible } from "@/utils/unitConverter";

// GET /api/products - List, search, and filter products
export async function GET(request: Request) {
  try {
    const cookiesList = await cookies();
    const session = getSession(cookiesList);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const dimension = searchParams.get("dimension") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { sku: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (category && category !== "All") {
      where.category = category;
    }

    if (dimension && dimension !== "All") {
      where.dimension = dimension;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: "asc" },
    });

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/products - Create a product (ADMIN only)
export async function POST(request: Request) {
  try {
    const cookiesList = await cookies();
    const session = getSession(cookiesList);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, sku, description, category, dimension, baseUnit, stock, price, priceUnit } = body;

    // Validate required fields
    if (!name || !sku || !dimension || !baseUnit || stock === undefined || price === undefined || !priceUnit) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate dimension
    if (dimension !== "WEIGHT" && dimension !== "VOLUME" && dimension !== "COUNT") {
      return NextResponse.json({ error: "Invalid dimension" }, { status: 400 });
    }

    // Validate units
    const baseConfig = UNIT_CONFIG[baseUnit];
    const priceConfig = UNIT_CONFIG[priceUnit];

    if (!baseConfig || baseConfig.dimension !== dimension) {
      return NextResponse.json({ error: `Invalid base unit ${baseUnit} for dimension ${dimension}` }, { status: 400 });
    }

    if (!priceConfig || priceConfig.dimension !== dimension) {
      return NextResponse.json({ error: `Invalid price unit ${priceUnit} for dimension ${dimension}` }, { status: 400 });
    }

    // High precision decimals
    let stockDec: Decimal;
    let priceDec: Decimal;
    try {
      stockDec = new Decimal(stock);
      priceDec = new Decimal(price);
      if (stockDec.isNegative() || priceDec.isNegative()) {
        return NextResponse.json({ error: "Stock and price must be non-negative values" }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: "Invalid numeric formatting for stock or price" }, { status: 400 });
    }

    // Check SKU unique
    const existingProduct = await prisma.product.findUnique({
      where: { sku },
    });

    if (existingProduct) {
      return NextResponse.json({ error: `Product SKU "${sku}" already exists` }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description: description || null,
        category: category || "General",
        dimension,
        baseUnit,
        stock: stockDec,
        price: priceDec,
        priceUnit,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/products error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
