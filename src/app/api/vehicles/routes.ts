// src/app/api/vehicles/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/vehicles - Get all vehicles
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    const customerId = searchParams.get('customerId');
    
    const vehicles = await prisma.vehicle.findMany({
      where: {
        AND: [
          customerId ? { customerId } : {},
          query ? {
            OR: [
              { make: { contains: query, mode: 'insensitive' } },
              { model: { contains: query, mode: 'insensitive' } },
              { vin: { contains: query, mode: 'insensitive' } },
              { licensePlate: { contains: query, mode: 'insensitive' } },
            ],
          } : {},
        ],
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        _count: {
          select: {
            workOrders: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    
    return NextResponse.json(vehicles);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch vehicles' },
      { status: 500 }
    );
  }
}

// POST /api/vehicles - Create a new vehicle
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['make', 'model', 'year', 'vin', 'customerId'];
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
    
    // Check if VIN already exists
    const existingVehicle = await prisma.vehicle.findUnique({
      where: { vin: body.vin },
    });
    
    if (existingVehicle) {
      return NextResponse.json(
        { error: 'A vehicle with this VIN already exists' },
        { status: 400 }
      );
    }
    
    const vehicle = await prisma.vehicle.create({
      data: body,
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    
    return NextResponse.json(vehicle, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create vehicle' },
      { status: 500 }
    );
  }
}

