import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateHeritageNarrative } from "@/lib/heritage-ai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const user = await getCurrentUser();
    if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: { brand: true, category: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.heritageNarrative.deleteMany({
      where: { productId: product.id },
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { status: "AI_PENDING" },
    });

    const { data, model } = await generateHeritageNarrative(
      product.name,
      product.brand.name,
      product.category.name,
    );

    const heritage = await prisma.heritageNarrative.create({
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

    return NextResponse.json({
      ...heritage,
      productName: product.name,
      brandName: product.brand.name,
    });
  } catch (err) {
    console.error(
      `Heritage regeneration failed for product ${params.id}:`,
      err,
    );

    try {
      await prisma.product.update({
        where: { id: params.id },
        data: { status: "DRAFT" },
      });
    } catch {
      /* product may not exist */
    }

    return NextResponse.json(
      {
        error:
          err instanceof Error ? err.message : "Heritage generation failed",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const body = await request.json();

    const heritage = await prisma.heritageNarrative.findUnique({
      where: { productId: params.id },
    });

    if (!heritage) {
      return NextResponse.json(
        { error: "Heritage narrative not found for this product" },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (typeof body.historyAndHeritage === "string" && body.historyAndHeritage.trim().length > 0) {
      updateData.historyAndHeritage = body.historyAndHeritage.trim();
    }
    if (typeof body.whenToWear === "string" && body.whenToWear.trim().length > 0) {
      updateData.whenToWear = body.whenToWear.trim();
    }
    if (Array.isArray(body.rightOccasion) && body.rightOccasion.length > 0) {
      updateData.rightOccasion = body.rightOccasion
        .filter((s: unknown) => typeof s === "string" && (s as string).trim().length > 0)
        .map((s: string) => s.trim());
    }
    if (Array.isArray(body.styleRecommendations) && body.styleRecommendations.length > 0) {
      updateData.styleRecommendations = body.styleRecommendations
        .filter((s: unknown) => typeof s === "string" && (s as string).trim().length > 0)
        .map((s: string) => s.trim());
    }

    if (body.isApproved === true) {
      updateData.isApproved = true;
      updateData.approvedAt = new Date();
    }

    const updated = await prisma.heritageNarrative.update({
      where: { id: heritage.id },
      data: updateData,
    });

    if (body.isApproved === true) {
      await prisma.product.update({
        where: { id: params.id },
        data: { status: "PUBLISHED" },
      });
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error(
      `Heritage update failed for product ${params.id}:`,
      err,
    );
    return NextResponse.json(
      { error: "Failed to update heritage narrative" },
      { status: 500 },
    );
  }
}
