import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createProductSchema } from "@/lib/validators";
import { slugify, generateSKU } from "@/lib/utils";
import { generateHeritageNarrative } from "@/lib/heritage-ai";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    48,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "24")),
  );
  const brands = searchParams.getAll("brand");
  const category = searchParams.get("category");
  const collection = searchParams.get("collection");
  const sizes = searchParams.getAll("size");
  const colors = searchParams.getAll("color");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort");
  const search = searchParams.get("search");
  const featured = searchParams.get("featured");

  const where: Record<string, unknown> = { status: "PUBLISHED" };

  if (brands.length > 0) {
    where.brand = { slug: { in: brands } };
  }
  if (category) {
    where.category = { slug: category };
  }
  if (collection) {
    where.collections = { some: { collection: { slug: collection } } };
  }
  if (sizes.length > 0 || colors.length > 0) {
    const variantWhere: Record<string, unknown> = {};
    if (sizes.length > 0) variantWhere.size = { in: sizes };
    if (colors.length > 0) variantWhere.color = { in: colors };
    where.variants = { some: variantWhere };
  }
  if (minPrice || maxPrice) {
    where.basePriceCents = {};
    if (minPrice)
      (where.basePriceCents as Record<string, number>).gte =
        parseInt(minPrice) * 100;
    if (maxPrice)
      (where.basePriceCents as Record<string, number>).lte =
        parseInt(maxPrice) * 100;
  }
  if (search) {
    const sanitizedSearch = search.trim().slice(0, 200);
    if (sanitizedSearch.length > 0) {
      where.OR = [
        { name: { contains: sanitizedSearch, mode: "insensitive" } },
        { brand: { name: { contains: sanitizedSearch, mode: "insensitive" } } },
        {
          description: {
            contains: sanitizedSearch,
            mode: "insensitive",
          },
        },
      ];
    }
  }
  if (featured === "true") {
    where.isFeatured = true;
  }

  let orderBy: Record<string, string> = { createdAt: "desc" };
  switch (sort) {
    case "price_asc":
      orderBy = { basePriceCents: "asc" };
      break;
    case "price_desc":
      orderBy = { basePriceCents: "desc" };
      break;
    case "name_asc":
      orderBy = { name: "asc" };
      break;
    case "newest":
      orderBy = { createdAt: "desc" };
      break;
  }

  try {
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          brand: true,
          category: true,
          images: { orderBy: { sortOrder: "asc" }, take: 2 },
          variants: { orderBy: { size: "asc" } },
          heritage: {
            select: {
              id: true,
              isApproved: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      data: products,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    console.error("Product listing error:", err);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const [brand, category] = await Promise.all([
      prisma.brand.findUnique({ where: { id: input.brandId } }),
      prisma.category.findUnique({ where: { id: input.categoryId } }),
    ]);

    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found for the given brandId" },
        { status: 400 },
      );
    }
    if (!category) {
      return NextResponse.json(
        { error: "Category not found for the given categoryId" },
        { status: 400 },
      );
    }

    let slug = slugify(`${brand.name}-${input.name}`);

    const existingSlug = await prisma.product.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (existingSlug) {
      const suffix = Date.now().toString(36).slice(-4);
      slug = `${slug}-${suffix}`;
    }

    const sku = generateSKU(brand.name, category.name);

    const product = await prisma.product.create({
      data: {
        sku,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() ?? null,
        brandId: input.brandId,
        categoryId: input.categoryId,
        basePriceCents: input.basePriceCents,
        salePriceCents: input.salePriceCents ?? null,
        currency: input.currency,
        status: "AI_PENDING",
        images: input.imageUrls
          ? {
              create: input.imageUrls.map((url, idx) => ({
                url,
                sortOrder: idx,
                isPrimary: idx === 0,
              })),
            }
          : undefined,
        variants: input.variants
          ? {
              create: input.variants.map((v) => ({
                size: v.size,
                color: v.color ?? null,
                colorHex: v.colorHex ?? null,
                stockCount: v.stockCount,
                priceDeltaCents: v.priceDeltaCents,
              })),
            }
          : undefined,
      },
      include: {
        brand: true,
        category: true,
        images: { orderBy: { sortOrder: "asc" } },
        variants: { orderBy: { size: "asc" } },
      },
    });

    generateHeritageNarrative(product.name, brand.name, category.name)
      .then(async ({ data, model }) => {
        await prisma.heritageNarrative.create({
          data: {
            productId: product.id,
            historyAndHeritage: data.history_and_heritage,
            whenToWear: data.when_to_wear,
            rightOccasion: data.right_occasion,
            styleRecommendations: data.style_recommendations,
            aiModelUsed: model,
          },
        });
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "AI_REVIEW" },
        });
      })
      .catch(async (err) => {
        console.error(
          `Heritage AI generation failed for product ${product.id}:`,
          err,
        );
        await prisma.product.update({
          where: { id: product.id },
          data: { status: "DRAFT" },
        });
      });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("Product creation error:", err);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
