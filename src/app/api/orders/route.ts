import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import Decimal = Prisma.Decimal;
import { calculateSubtotal, convertToBase, areUnitsCompatible } from "@/utils/unitConverter";

// GET /api/orders - Get orders (ADMIN: all orders, SELLER: user's own orders)
export async function GET() {
  try {
    const cookiesList = await cookies();
    const session = getSession(cookiesList);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const include = {
      user: {
        select: {
          username: true,
          email: true,
        },
      },
      items: {
        include: {
          product: {
            select: {
              name: true,
              sku: true,
              dimension: true,
              baseUnit: true,
              price: true,
              priceUnit: true,
            },
          },
        },
      },
    };

    let orders;
    if (session.role === "ADMIN") {
      orders = await prisma.order.findMany({
        include,
        orderBy: { createdAt: "desc" },
      });
    } else {
      orders = await prisma.order.findMany({
        where: { userId: session.userId },
        include,
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error("GET /api/orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/orders - Create a new order/quotation (SELLER/USER only)
export async function POST(request: Request) {
  try {
    const cookiesList = await cookies();
    const session = getSession(cookiesList);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { items, notes } = body; // items: array of { productId, orderedQuantity, orderedUnit }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Order must contain at least one item" }, { status: 400 });
    }

    // Calculate details for each item and total amount
    let totalAmount = new Decimal(0);
    interface OrderItemInput {
      productId: string;
      orderedQuantity: Decimal;
      orderedUnit: string;
      baseQuantity: Decimal;
      pricePerUnit: Decimal;
      priceUnit: string;
      subtotal: Decimal;
    }
    const orderItemsToCreate: OrderItemInput[] = [];

    for (const item of items) {
      const { productId, orderedQuantity, orderedUnit } = item;

      if (!productId || orderedQuantity === undefined || !orderedUnit) {
        return NextResponse.json({ error: "Invalid item data: missing fields" }, { status: 400 });
      }

      // Verify product exists
      const product = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        return NextResponse.json({ error: `Product not found: ${productId}` }, { status: 404 });
      }

      // Check unit compatibility
      if (!areUnitsCompatible(orderedUnit, product.baseUnit)) {
        return NextResponse.json(
          {
            error: `Incompatible unit "${orderedUnit}" for product "${product.name}" (dimension: ${product.dimension})`,
          },
          { status: 400 }
        );
      }

      // High precision parsing
      let qtyDec: Decimal;
      try {
        qtyDec = new Decimal(orderedQuantity);
        if (qtyDec.isNegative() || qtyDec.isZero()) {
          return NextResponse.json(
            { error: `Quantity must be greater than zero for product "${product.name}"` },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: `Invalid quantity numeric format for product "${product.name}"` },
          { status: 400 }
        );
      }

      // Calculate base quantity (internal storage equivalent)
      const baseQty = convertToBase(qtyDec, orderedUnit);

      // Calculate subtotal using rate and ordered quantity converted to price unit
      const subtotal = calculateSubtotal(qtyDec, orderedUnit, product.price, product.priceUnit);

      totalAmount = totalAmount.add(subtotal);

      orderItemsToCreate.push({
        productId,
        orderedQuantity: qtyDec,
        orderedUnit,
        baseQuantity: baseQty,
        pricePerUnit: product.price,
        priceUnit: product.priceUnit,
        subtotal,
      });
    }

    // Database transaction to create Order and OrderItems
    const order = await prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: session.userId,
          status: "PENDING",
          totalAmount,
          notes: notes || null,
        },
      });

      await Promise.all(
        orderItemsToCreate.map((item) =>
          tx.orderItem.create({
            data: {
              orderId: createdOrder.id,
              ...item,
            },
          })
        )
      );

      return tx.order.findUnique({
        where: { id: createdOrder.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/orders error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
