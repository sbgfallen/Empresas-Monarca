"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  LoaderCircle,
  Newspaper,
  Share2,
  Tag,
} from "lucide-react";

import API from "@/app/services/api";
import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

interface NewsItem {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image_url: string;
  category: string;
  tags: string[];
  published_at: string;
}

export default function NoticiaDetallePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [item, setItem] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    API.get<{ news: NewsItem }>(`/news/slug/${slug}`)
      .then((res) => {
        if (isActive) setItem(res.data.news);
      })
      .catch(console.error)
      .finally(() => {
        if (isActive) setLoading(false);
      });

    return () => { isActive = false; };
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
        <Navbar />
        <div className="flex min-h-[80vh] items-center justify-center pt-24">
          <div className="flex items-center gap-3 rounded-lg border border-rose-200/12 bg-rose-200/[0.06] px-6 py-4">
            <LoaderCircle className="h-5 w-5 animate-spin text-rose-500" />
            <span className="text-sm font-semibold">Cargando noticia...</span>
          </div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!item) {
    return (
      <main className="min-h-screen bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
        <Navbar />
        <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 pt-24">
          <Newspaper size={64} className="text-warm-50/20" />
          <h1 className="text-3xl font-black">Noticia no encontrada</h1>
          <p className="text-warm-50/60">La noticia que buscás no existe o fue eliminada.</p>
          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-3 text-sm font-black text-white transition hover:from-rose-500 hover:to-rose-600"
          >
            <ArrowLeft size={18} />
            Volver a noticias
          </Link>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,#1a0f0a_0%,#2d1f14_48%,#1a0f0a_100%)] text-warm-50">
      <Navbar />

      <article className="mx-auto max-w-4xl px-5 pt-28 pb-16 md:px-8">
        {/* Breadcrumb */}
        <Link
          href="/noticias"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-warm-50/50 transition hover:text-rose-400"
        >
          <ArrowLeft size={16} />
          Volver a noticias
        </Link>

        {/* Hero image */}
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-rose-200/12 shadow-2xl shadow-rose-950/30">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 900px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Meta */}
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-rose-500/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-rose-300">
            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
            {item.category}
          </span>
          {item.published_at && (
            <span className="inline-flex items-center gap-1.5 text-xs text-warm-50/50">
              <CalendarDays size={13} />
              {new Date(item.published_at).toLocaleDateString("es-AR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          )}
          {item.tags && item.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {item.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-md border border-rose-200/10 bg-rose-200/[0.04] px-2.5 py-1 text-[10px] font-bold text-warm-50/50"
                >
                  <Tag size={10} />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <h1 className="mt-6 text-4xl font-black leading-tight md:text-5xl lg:text-6xl">
          {item.title}
        </h1>

        {/* Excerpt */}
        <p className="mt-6 text-lg leading-8 text-warm-50/65 md:text-xl">
          {item.excerpt}
        </p>

        {/* Content */}
        {item.content && (
          <div className="mt-10 border-t border-white/10 pt-10">
            <div className="prose prose-invert prose-rose max-w-none">
              {item.content.split("\n").map((paragraph, idx) => (
                <p key={idx} className="mb-4 text-base leading-7 text-warm-50/70 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Share */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-8">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.18em] text-warm-50/40">
              <Share2 size={13} />
              Compartir
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="rounded-lg border border-rose-200/15 bg-rose-200/8 px-4 py-2 text-xs font-bold text-warm-50/60 transition hover:border-rose-200/30 hover:text-rose-300"
            >
              Copiar enlace
            </button>
          </div>

          <Link
            href="/noticias"
            className="inline-flex items-center gap-2 rounded-lg border border-rose-200/15 bg-rose-200/10 px-5 py-3 text-sm font-bold text-rose-300 transition hover:bg-rose-200/18 hover:border-rose-200/30"
          >
            <ArrowLeft size={16} />
            Más noticias
          </Link>
        </div>
      </article>

      <Footer />
    </main>
  );
}
