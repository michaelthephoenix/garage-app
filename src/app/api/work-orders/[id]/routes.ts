// src/app/api/work-orders/[id]/route.ts
// GET /api/work-orders/[id] - Get a specific work order
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const workOrder = await prisma.workOrder.findUnique({
        where: { id: params.id },
        include: {
          customer: true,
          vehicle: true,
          technician: true,
          lineItems: {
            include: {
              part: true,
            },
          },
          invoice: {
            include: {
              payments: true,
            },
          },
        },
      });
      
      if (!workOrder) {
        return NextResponse.json(
          { error: 'Work order not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(workOrder);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch work order' },
        { status: 500 }
      );
    }
  }
  
  // PUT /api/work-orders/[id] - Update a work order
  export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const body = await req.json();
      
      // Check if work order exists
      const existingWorkOrder = await prisma.workOrder.findUnique({
        where: { id: params.id },
        include: {
          lineItems: true,
        },
      });
      
      if (!existingWorkOrder) {
        return NextResponse.json(
          { error: 'Work order not found' },
          { status: 404 }
        );
      }
      
      // Check if status is valid for update
      if (existingWorkOrder.status === 'INVOICED' || existingWorkOrder.status === 'PAID') {
        return NextResponse.json(
          { error: 'Cannot update a work order that is already invoiced or paid' },
          { status: 400 }
        );
      }
      
      // Extract line items data
      const { lineItems, ...workOrderData } = body;
      
      // Update work order
      const updatedWorkOrder = await prisma.workOrder.update({
        where: { id: params.id },
        data: workOrderData,
        include: {
          customer: true,
          vehicle: true,
          technician: true,
          lineItems: true,
        },
      });
      
      // Handle line items updates if provided
      if (lineItems && Array.isArray(lineItems)) {
        // Get existing line items
        const existingLineItems = existingWorkOrder.lineItems || [];
        
        // Delete all existing line items
        await prisma.workOrderLineItem.deleteMany({
          where: { workOrderId: params.id },
        });
        
        // Create new line items
        const newLineItems = await Promise.all(
          lineItems.map(async (item: any) => {
            const lineItem = await prisma.workOrderLineItem.create({
              data: {
                workOrderId: params.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                laborHours: item.laborHours,
                laborRate: item.laborRate,
                partId: item.partId,
              },
              include: {
                part: true,
              },
            });
            
            // Update inventory if part is used
            if (item.partId) {
              // Find if this part was previously used
              const existingItem = existingLineItems.find(
                (ei) => ei.partId === item.partId
              );
              
              // Calculate quantity difference
              const quantityDiff = existingItem 
                ? item.quantity - existingItem.quantity
                : item.quantity;
              
              if (quantityDiff !== 0) {
                // Update inventory quantity
                await prisma.inventoryItem.update({
                  where: { id: item.partId },
                  data: {
                    quantity: {
                      decrement: quantityDiff,
                    },
                    transactions: {
                      create: {
                        type: quantityDiff > 0 ? 'SALE' : 'RETURN',
                        quantity: Math.abs(quantityDiff),
                        notes: `Adjusted in Work Order ${existingWorkOrder.orderNumber}`,
                      },
                    },
                  },
                });
              }
            }
            
            return lineItem;
          })
        );
        
        // Refresh work order with updated line items
        const refreshedWorkOrder = await prisma.workOrder.findUnique({
          where: { id: params.id },
          include: {
            customer: true,
            vehicle: true,
            technician: true,
            lineItems: {
              include: {
                part: true,
              },
            },
          },
        });
        
        return NextResponse.json(refreshedWorkOrder);
      }
      
      return NextResponse.json(updatedWorkOrder);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to update work order' },
        { status: 500 }
      );
    }
  }
  
  // DELETE /api/work-orders/[id] - Delete a work order
  export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      // Check if work order exists
      const existingWorkOrder = await prisma.workOrder.findUnique({
        where: { id: params.id },
        include: {
          lineItems: {
            include: {
              part: true,
            },
          },
          invoice: true,
        },
      });
      
      if (!existingWorkOrder) {
        return NextResponse.json(
          { error: 'Work order not found' },
          { status: 404 }
        );
      }
      
      // Check if work order is already invoiced or paid
      if (existingWorkOrder.status === 'INVOICED' || existingWorkOrder.status === 'PAID' || existingWorkOrder.invoice) {
        return NextResponse.json(
          { error: 'Cannot delete a work order that is already invoiced or paid' },
          { status: 400 }
        );
      }
      
      // Return used parts to inventory
      for (const item of existingWorkOrder.lineItems) {
        if (item.partId) {
          // Increase inventory quantity
          await prisma.inventoryItem.update({
            where: { id: item.partId },
            data: {
              quantity: {
                increment: item.quantity,
              },
              transactions: {
                create: {
                  type: 'RETURN',
                  quantity: item.quantity,
                  notes: `Returned from deleted Work Order ${existingWorkOrder.orderNumber}`,
                },
              },
            },
          });
        }
      }
      
      // Delete the work order (cascade will delete line items)
      await prisma.workOrder.delete({
        where: { id: params.id },
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to delete work order' },
        { status: 500 }
      );
    }
  }