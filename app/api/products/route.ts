import { NextRequest, NextResponse } from 'next/server';
import { INITIAL_PRODUCTS } from '@/data/products';
import { Product } from '@/lib/types';

// In-memory persistent cache for serverless lifetime
let currentProducts: Product[] = [...INITIAL_PRODUCTS];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const category = searchParams.get('category');

  let results = [...currentProducts];

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

// Admin: Add new product
export async function POST(req: NextRequest) {
  try {
    const newProduct: Product = await req.json();
    if (!newProduct || !newProduct.title || !newProduct.price) {
      return NextResponse.json({ success: false, message: 'Maʼlumotlar toʻliq emas' }, { status: 400 });
    }

    // Add to beginning of catalog
    currentProducts = [newProduct, ...currentProducts.filter((p) => p.id !== newProduct.id)];

    return NextResponse.json({
      success: true,
      message: 'Mahsulot muvaffaqiyatli qoʻshildi',
      data: newProduct,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Xatolik yuz berdi' }, { status: 500 });
  }
}

// Admin: Edit existing product
export async function PUT(req: NextRequest) {
  try {
    const updatedProduct: Product = await req.json();
    if (!updatedProduct || !updatedProduct.id) {
      return NextResponse.json({ success: false, message: 'Mahsulot ID si topilmadi' }, { status: 400 });
    }

    const index = currentProducts.findIndex((p) => p.id === updatedProduct.id);
    if (index > -1) {
      currentProducts[index] = { ...currentProducts[index], ...updatedProduct };
    } else {
      currentProducts.unshift(updatedProduct);
    }

    return NextResponse.json({
      success: true,
      message: 'Mahsulot muvaffaqiyatli yangilandi',
      data: updatedProduct,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Xatolik yuz berdi' }, { status: 500 });
  }
}

// Admin: Delete product
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID koʻrsatilmadi' }, { status: 400 });
    }

    currentProducts = currentProducts.filter((p) => p.id !== id);

    return NextResponse.json({
      success: true,
      message: 'Mahsulot oʻchirildi',
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Xatolik yuz berdi' }, { status: 500 });
  }
}
