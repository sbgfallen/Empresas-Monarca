"use client";

import dynamic from "next/dynamic";

// Lazy load heavy components to reduce initial bundle size

/** ParticleBackground - heavy canvas animation, only needed on public pages */
export const LazyParticleBackground = dynamic(
  () => import("./ParticleBackground"),
  { ssr: false }
);

/** LoanCalculator - complex form with calculations, only on /prestamos */
export const LazyLoanCalculator = dynamic(
  () => import("./LoanCalculator"),
  { ssr: false }
);
