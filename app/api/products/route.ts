import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PRODUCTS } from '@/data/products';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');

  let results = [...INITIAL_PRODUCTS];

  if (slug) {
    const single = results.find((p) => p.slug === slug || p.id === slug);
    if (!single) {
      return NextResponse.json({ success: false, message: 'Mahsulot topilmadi' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: single });
  }

  if (category && category !== 'all') {
    results = results.filter((p) => p.category === category);
  }

  return NextResponse.json({
    success: true,
    data: results,
  });
}
