// src/app/api/customers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/customers - Get all customers
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('query') || '';
    
    const customers = await prisma.customer.findMany({
      where: query ? {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { lastName: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: { lastName: 'asc' },
      include: {
        _count: {
          select: {
            vehicles: true,
            workOrders: true,
          },
        },
      },
    });
    
    return NextResponse.json(customers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}

// POST /api/customers - Create a new customer
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'email', 'phone'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        );
      }
    }
    
    // Check if email already exists
    const existingCustomer = await prisma.customer.findUnique({
      where: { email: body.email },
    });
    
    if (existingCustomer) {
      return NextResponse.json(
        { error: 'A customer with this email already exists' },
        { status: 400 }
      );
    }
    
    const customer = await prisma.customer.create({
      data: body,
    });
    
    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create customer' },
      { status: 500 }
    );
  }
}