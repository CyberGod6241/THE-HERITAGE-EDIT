"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { getImagePlaceholder } from "@/lib/utils";
import type { Product } from "@/types";

const HERO_COLLECTIONS = [
  {
    title: "Autumn/Winter 2026",
    subtitle: "The New Silhouette",
    description:
      "A study in architectural precision and fluid movement. Discover the season's defining pieces.",
    image: getImagePlaceholder(1440, 800),
    href: "/collection/aw-2026",
    cta: "Explore the Collection",
  },
];

const EDITORIAL_BLOCKS = [
  {
    title: "The Art of Tailoring",
    category: "Men's Suiting",
    image: getImagePlaceholder(700, 900),
    href: "/collection/tailoring",
  },
  {
    title: "Evening Edit",
    category: "Black Tie",
    image: getImagePlaceholder(700, 900),
    href: "/collection/evening",
  },
  {
    title: "Resort Collection",
    category: "Cruise 2026",
    image: getImagePlaceholder(700, 900),
    href: "/collection/resort",
  },
];

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products?featured=true&pageSize=8")
      .then((res) => res.json())
      .then((data) => setFeaturedProducts(data.data ?? []))
      .catch(() => {});
  }, []);

  const hero = HERO_COLLECTIONS[0];

  return (
    <div>
      <section className="relative h-[85vh] min-h-[600px] bg-heritage-green overflow-hidden">
        <div className="absolute inset-0">
          <Image src={hero.image} alt={hero.title} fill className="object-cover opacity-40" priority />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-heritage-green/80 via-heritage-green/40 to-transparent" />
        <div className="relative luxury-container h-full flex items-center">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="max-w-xl">
            <p className="text-[10px] font-sans font-medium tracking-[0.3em] uppercase text-white/50 mb-4">{hero.subtitle}</p>
            <h1 className="text-display-lg md:text-display-xl font-serif italic text-white mb-6">{hero.title}</h1>
            <p className="text-base font-sans text-white/70 leading-relaxed mb-8 max-w-md">{hero.description}</p>
            <Link href={hero.href} className="inline-flex items-center gap-3 text-sm font-sans font-medium tracking-wider uppercase text-white border-b border-white/30 pb-2 hover:border-white transition-colors duration-300">
              {hero.cta}
              <ArrowRight size={16} />
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="luxury-container py-20 md:py-28">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="text-[10px] font-sans font-medium tracking-[0.3em] uppercase text-heritage-purple mb-3">Curated Selections</p>
          <h2 className="text-display-md font-serif italic text-obsidian">The Editorial</h2>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {EDITORIAL_BLOCKS.map((block, idx) => (
            <motion.div key={block.title} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}>
              <Link href={block.href} className="group block">
                <div className="relative aspect-[7/9] bg-ivory overflow-hidden mb-4">
                  <Image src={block.image} alt={block.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-700 ease-luxury group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
                <p className="text-[10px] font-sans font-medium tracking-[0.15em] uppercase text-neutral-400 mb-1">{block.category}</p>
                <h3 className="text-lg font-serif text-obsidian group-hover:text-heritage-green transition-colors duration-300">{block.title}</h3>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-ivory py-20 md:py-28">
        <div className="luxury-container">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-[10px] font-sans font-medium tracking-[0.3em] uppercase text-heritage-green mb-3">Handpicked</p>
              <h2 className="text-display-sm md:text-display-md font-serif italic text-obsidian">Featured Pieces</h2>
            </div>
            <Link href="/collection/all" className="hidden md:inline-flex items-center gap-2 text-xs font-sans font-medium tracking-wider uppercase text-heritage-green hover:text-heritage-green-600 transition-colors">
              View All
              <ChevronRight size={14} />
            </Link>
          </div>
          <div className="luxury-grid">
            {featuredProducts.length > 0
              ? featuredProducts.map((product) => (
                  <ProductCard key={product.id} slug={product.slug} name={product.name} brandName={product.brand.name} priceCents={product.basePriceCents} salePriceCents={product.salePriceCents} currency={product.currency} imageUrl={product.images[0]?.url ?? getImagePlaceholder(600, 800)} hoverImageUrl={product.images[1]?.url} />
                ))
              : Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="space-y-3">
                    <div className="aspect-[3/4] skeleton" />
                    <div className="h-3 w-16 skeleton" />
                    <div className="h-4 w-32 skeleton" />
                    <div className="h-3 w-20 skeleton" />
                  </div>
                ))}
          </div>
        </div>
      </section>

      <section className="relative bg-heritage-purple text-white py-24 md:py-32 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-white/5 rounded-full translate-x-1/3 translate-y-1/3" />
        </div>
        <div className="luxury-container relative text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <p className="text-[10px] font-sans font-medium tracking-[0.3em] uppercase text-white/40 mb-4">Powered by AI</p>
            <h2 className="text-display-md md:text-display-lg font-serif italic mb-6 max-w-3xl mx-auto">Every piece tells a story of heritage and craft</h2>
            <p className="text-base font-sans text-white/60 leading-relaxed max-w-xl mx-auto mb-10">Our AI-powered Heritage Engine researches the history, design DNA, and cultural significance behind every garment — enriching your shopping experience with stories worth wearing.</p>
            <Link href="/heritage" className="luxury-button-primary bg-white text-heritage-purple hover:bg-white/90">Discover The Heritage Edit</Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
