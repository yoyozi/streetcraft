import { getAllCategories } from '@/lib/actions/product.actions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const categories = await getAllCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([], { status: 500 });
  }
}
