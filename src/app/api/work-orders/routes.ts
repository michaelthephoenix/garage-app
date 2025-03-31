// src/app/api/work-orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { generateOrderNumber } from '@/lib/utils';

// GET /api/work-orders - Get all work orders
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const vehicleId = searchParams.get('vehicleId');
    const technicianId = searchParams.get('technicianId');
    
    const workOrders = await prisma.workOrder.findMany({
      where: {
        AND: [
          status ? { status: status as any } : {},
          customerId ? { customerId } : {},
          vehicleId ? { vehicleId } : {},
          technicianId ? { technicianId } : {},
          query ? {
            OR: [
              { orderNumber: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
              { customer: {
                OR: [
                  { firstName: { contains: query, mode: 'insensitive' } },
                  { lastName: { contains: query, mode: 'insensitive' } },
                ],
              }},
              { vehicle: {
                OR: [
                  { make: { contains: query, mode: 'insensitive' } },
                  { model: { contains: query, mode: 'insensitive' } },
                  { vin: { contains: query, mode: 'insensitive' } },
                ],
              }},
            ],
          } : {},
        ],
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
            licensePlate: true,
          },
        },
        technician: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            lineItems: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    
    return NextResponse.json(workOrders);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch work orders' },
      { status: 500 }
    );
  }
}

// POST /api/work-orders - Create a new work order
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['description', 'startDate', 'customerId', 'vehicleId'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check if customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: body.customerId },
    });
    
    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }
    
    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { 
        id: body.vehicleId,
        customerId: body.customerId, // Ensure vehicle belongs to customer
      },
    });
    
    if (!vehicle) {
      return NextResponse.json(
        { error: 'Vehicle not found or does not belong to this customer' },
        { status: 404 }
      );
    }
    
    // Generate order number
    const orderNumber = generateOrderNumber();
    
    // Extract line items data
    const { lineItems, ...workOrderData } = body;
    
    // Create work order with line items
    const workOrder = await prisma.workOrder.create({
      data: {
        ...workOrderData,
        orderNumber,
        lineItems: lineItems && lineItems.length > 0 ? {
          create: lineItems.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            laborHours: item.laborHours,
            laborRate: item.laborRate,
            partId: item.partId,
          })),
        } : undefined,
      },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        vehicle: {
          select: {
            make: true,
            model: true,
            year: true,
          },
        },
        lineItems: true,
      },
    });
    
    // Update inventory quantities if parts were used
    if (lineItems && lineItems.length > 0) {
      for (const item of lineItems) {
        if (item.partId) {
          // Decrease inventory quantity
          await prisma.inventoryItem.update({
            where: { id: item.partId },
            data: {
              quantity: {
                decrement: item.quantity,
              },
              transactions: {
                create: {
                  type: 'SALE',
                  quantity: item.quantity,
                  notes: `Used in Work Order ${orderNumber}`,
                },
              },
            },
          });
        }
      }
    }
    
    return NextResponse.json(workOrder, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create work order' },
      { status: 500 }
    );
  }
}