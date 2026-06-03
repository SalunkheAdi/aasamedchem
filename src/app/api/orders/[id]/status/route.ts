import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import Decimal = Prisma.Decimal;

export async function PATCH(
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
    const { status } = body; // "APPROVED" or "REJECTED"

    if (status !== "APPROVED" && status !== "REJECTED") {
      return NextResponse.json({ error: "Invalid status: must be APPROVED or REJECTED" }, { status: 400 });
    }

    // Retrieve order and items in transaction to prevent concurrency issues
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      if (!order) {
        throw new Error("ORDER_NOT_FOUND");
      }

      if (order.status !== "PENDING") {
        throw new Error("ORDER_ALREADY_PROCESSED");
      }

      if (status === "APPROVED") {
        // Verify inventory and deduct stock
        for (const item of order.items) {
          const product = item.product;
          const orderBaseQty = new Decimal(item.baseQuantity);
          const currentStock = new Decimal(product.stock);

          if (currentStock.lessThan(orderBaseQty)) {
            throw new Error(`INSUFFICIENT_STOCK: ${product.name} (Stock: ${product.stock} ${product.baseUnit}, Required: ${item.baseQuantity} ${product.baseUnit})`);
          }

          // Deduct stock
          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: currentStock.sub(orderBaseQty),
            },
          });
        }
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status },
        include: {
          items: {
            include: {
              product: true,
            },
          },
        },
      });

      return updatedOrder;
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("PATCH /api/orders/[id]/status error:", error.message || error);

    if (error.message === "ORDER_NOT_FOUND") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (error.message === "ORDER_ALREADY_PROCESSED") {
      return NextResponse.json({ error: "Order has already been approved or rejected" }, { status: 400 });
    }
    if (error.message.startsWith("INSUFFICIENT_STOCK:")) {
      const details = error.message.replace("INSUFFICIENT_STOCK: ", "");
      return NextResponse.json({ error: "Insufficient stock for product", details }, { status: 422 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
