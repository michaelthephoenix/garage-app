// src/app/api/vehicles/[id]/route.ts
// GET /api/vehicles/[id] - Get a specific vehicle
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id: params.id },
        include: {
          customer: true,
          workOrders: {
            include: {
              lineItems: true,
            },
            orderBy: { createdAt: 'desc' },
          },
          appointments: {
            orderBy: { date: 'desc' },
          },
        },
      });
      
      if (!vehicle) {
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(vehicle);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch vehicle' },
        { status: 500 }
      );
    }
  }
  
  // PUT /api/vehicles/[id] - Update a vehicle
  export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      const body = await req.json();
      
      // Check if vehicle exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id: params.id },
      });
      
      if (!existingVehicle) {
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      
      // Check if VIN already exists (if VIN is being updated)
      if (body.vin && body.vin !== existingVehicle.vin) {
        const vehicleWithVin = await prisma.vehicle.findUnique({
          where: { vin: body.vin },
        });
        
        if (vehicleWithVin) {
          return NextResponse.json(
            { error: 'A vehicle with this VIN already exists' },
            { status: 400 }
          );
        }
      }
      
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: params.id },
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
      
      return NextResponse.json(updatedVehicle);
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to update vehicle' },
        { status: 500 }
      );
    }
  }
  
  // DELETE /api/vehicles/[id] - Delete a vehicle
  export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
  ) {
    try {
      // Check if vehicle exists
      const existingVehicle = await prisma.vehicle.findUnique({
        where: { id: params.id },
        include: {
          workOrders: true,
        },
      });
      
      if (!existingVehicle) {
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      
      // Check if vehicle has active work orders
      const hasActiveWorkOrders = existingVehicle.workOrders.some(
        wo => !['COMPLETED', 'CANCELED', 'PAID'].includes(wo.status)
      );
      
      if (hasActiveWorkOrders) {
        return NextResponse.json(
          { 
            error: 'Cannot delete vehicle with active work orders',
            hasActiveWorkOrders,
          },
          { status: 400 }
        );
      }
      
      // Delete the vehicle
      await prisma.vehicle.delete({
        where: { id: params.id },
      });
      
      return NextResponse.json({ success: true });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to delete vehicle' },
        { status: 500 }
      );
    }
  }