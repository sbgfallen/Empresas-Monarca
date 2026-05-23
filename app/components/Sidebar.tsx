const links = [
  {
    href: "/admin-hidden-2026",
    label: "Dashboard",
  },
  {
    href: "/admin-hidden-2026/products",
    label: "Productos",
  },
  {
    href: "/admin-hidden-2026/promotions",
    label: "Promociones",
  },
  {
    href: "/admin-hidden-2026/news",
    label: "Noticias",
  },
  {
    href: "/admin-hidden-2026/credits",
    label: "Créditos",
  },
  {
    href: "/admin-hidden-2026/analytics",
    label: "Analíticas",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-[300px] border-r border-amber-200/10 bg-[linear-gradient(180deg,#1a0f0a_0%,#120a06_100%)] p-8 text-warm-50">
      <h1 className="mb-14 text-4xl font-black">ADMIN</h1>

      <nav className="space-y-4">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="block rounded-lg p-4 transition hover:bg-amber-400 hover:text-warm-900"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
