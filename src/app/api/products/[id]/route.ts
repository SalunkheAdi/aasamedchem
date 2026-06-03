import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import Decimal = Prisma.Decimal;
import { UNIT_CONFIG } from "@/utils/unitConverter";

// PUT /api/products/[id] - Update product details (ADMIN only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookiesList = await cookies();
    const session = getSession(cookiesList);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const { name, sku, description, category, dimension, baseUnit, stock, price, priceUnit } = body;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const updateData: any = {};

    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description || null;
    if (category) updateData.category = category;

    // If changing dimension or units, perform compatibility validations
    const targetDimension = dimension || existingProduct.dimension;
    const targetBaseUnit = baseUnit || existingProduct.baseUnit;
    const targetPriceUnit = priceUnit || existingProduct.priceUnit;

    if (dimension) {
      if (dimension !== "WEIGHT" && dimension !== "VOLUME" && dimension !== "COUNT") {
        return NextResponse.json({ error: "Invalid dimension" }, { status: 400 });
      }
      updateData.dimension = dimension;
    }

    if (baseUnit) {
      const baseConfig = UNIT_CONFIG[baseUnit];
      if (!baseConfig || baseConfig.dimension !== targetDimension) {
        return NextResponse.json({ error: `Invalid base unit ${baseUnit} for dimension ${targetDimension}` }, { status: 400 });
      }
      updateData.baseUnit = baseUnit;
    }

    if (priceUnit) {
      const priceConfig = UNIT_CONFIG[priceUnit];
      if (!priceConfig || priceConfig.dimension !== targetDimension) {
        return NextResponse.json({ error: `Invalid price unit ${priceUnit} for dimension ${targetDimension}` }, { status: 400 });
      }
      updateData.priceUnit = priceUnit;
    }

    if (sku && sku !== existingProduct.sku) {
      const skuCheck = await prisma.product.findUnique({ where: { sku } });
      if (skuCheck) {
        return NextResponse.json({ error: `Product SKU "${sku}" already exists` }, { status: 409 });
      }
      updateData.sku = sku;
    }

    if (stock !== undefined) {
      try {
        const stockDec = new Decimal(stock);
        if (stockDec.isNegative()) {
          return NextResponse.json({ error: "Stock must be non-negative" }, { status: 400 });
        }
        updateData.stock = stockDec;
      } catch {
        return NextResponse.json({ error: "Invalid numeric format for stock" }, { status: 400 });
      }
    }

    if (price !== undefined) {
      try {
        const priceDec = new Decimal(price);
        if (priceDec.isNegative()) {
          return NextResponse.json({ error: "Price must be non-negative" }, { status: 400 });
        }
        updateData.price = priceDec;
      } catch {
        return NextResponse.json({ error: "Invalid numeric format for price" }, { status: 400 });
      }
    }

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error("PUT /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/products/[id] - Delete product (ADMIN only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookiesList = await cookies();
    const session = getSession(cookiesList);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admin role required" }, { status: 403 });
    }

    const { id } = await params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Product deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
