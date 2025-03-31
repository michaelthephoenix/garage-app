// src/app/api/customers/[id]/route.ts
// GET /api/customers/[id] - Get a specific customer
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: params.id },
        include: {
          vehicles: true,
          workOrders: {
            include: {
              vehicle: true,
              lineItems: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          appointments: {
            include: {
              vehicle: true,
            },
            orderBy: { date: 'desc' },
          },
          invoices: {
            include: {
              workOrder: true,
              payments: true,
            },
            orderBy: { date: 'desc' },
          },
        },
      });
      
      if (!customer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(customer);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch customer' },
        { status: 500 }
      );
    }
  }
  
  // PUT /api/customers/[id] - Update a customer
  export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const body = await req.json();
      
      // Check if customer exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: params.id },
      });
      
      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      // Check if email already exists (if email is being updated)
      if (body.email && body.email !== existingCustomer.email) {
        const customerWithEmail = await prisma.customer.findUnique({
          where: { email: body.email },
        });
        
        if (customerWithEmail) {
          return NextResponse.json(
            { error: 'A customer with this email already exists' },
            { status: 400 }
          );
        }
      }
      
      const updatedCustomer = await prisma.customer.update({
        where: { id: params.id },
        data: body,
      });
      
      return NextResponse.json(updatedCustomer);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to update customer' },
        { status: 500 }
      );
    }
  }
  
  // DELETE /api/customers/[id] - Delete a customer
  export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      // Check if customer exists
      const existingCustomer = await prisma.customer.findUnique({
        where: { id: params.id },
        include: {
          workOrders: true,
          invoices: true,
        },
      });
      
      if (!existingCustomer) {
        return NextResponse.json(
          { error: 'Customer not found' },
          { status: 404 }
        );
      }
      
      // Check if customer has active work orders or unpaid invoices
      const hasActiveWorkOrders = existingCustomer.workOrders.some(
        wo => !['COMPLETED', 'CANCELED', 'PAID'].includes(wo.status)
      );
      
      const hasUnpaidInvoices = existingCustomer.invoices.some(
        inv => !['PAID', 'VOID'].includes(inv.status)
      );
      
      if (hasActiveWorkOrders || hasUnpaidInvoices) {
        return NextResponse.json(
          { 
            error: 'Cannot delete customer with active work orders or unpaid invoices',
            hasActiveWorkOrders,
            hasUnpaidInvoices
          },
          { status: 400 }
        );
      }
      
      // Delete the customer (cascade will delete related records)
      await prisma.customer.delete({
        where: { id: params.id },
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to delete customer' },
        { status: 500 }
      );
    }
  }
  