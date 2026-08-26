"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Info,
  LoaderCircle,
  PartyPopper,
  ShieldAlert,
  X,
  Zap,
} from "lucide-react";

import API from "@/app/services/api";

type Announcement = {
  id: number;
  title: string;
  content: string;
  type: "info" | "warning" | "success" | "promo" | "urgent";
  link_url: string;
  link_label: string;
  icon: string;
  is_active: boolean;
  starts_at: string;
  expires_at: string;
  sort_order: number;
};

const typeConfig = {
  info: {
    bg: "bg-blue-500/10 border-blue-400/25",
    text: "text-blue-300",
    icon: Info,
  },
  warning: {
    bg: "bg-rose-500/10 border-rose-400/25",
    text: "text-rose-300",
    icon: AlertTriangle,
  },
  success: {
    bg: "bg-emerald-500/10 border-emerald-400/25",
    text: "text-emerald-300",
    icon: PartyPopper,
  },
  promo: {
    bg: "bg-gradient-to-r from-rose-500/12 to-rose-700/10 border-rose-500/25",
    text: "text-rose-400",
    icon: Zap,
  },
  urgent: {
    bg: "bg-rose-500/10 border-rose-400/25",
    text: "text-rose-300",
    icon: ShieldAlert,
  },
};

export default function AnnouncementsBar() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get<{ announcements: Announcement[] }>("/announcements")
      .then((res) => {
        if (res.data.announcements) {
          setAnnouncements(res.data.announcements);
        }
      })
      .catch(() => {
        // Silent
      })
      .finally(() => setLoading(false));
  }, []);

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (loading || visible.length === 0) return null;

  return (
    <div className="relative z-50 flex flex-col gap-1.5 px-4 pt-2">
      {visible.map((ann) => {
        const config = typeConfig[ann.type] || typeConfig.info;
        const Icon = config.icon;

        return (
          <div
            key={ann.id}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg backdrop-blur transition-all ${config.bg}`}
          >
            <Icon size={18} className={`shrink-0 ${config.text}`} />

            <div className="flex-1 min-w-0">
              <span className={`font-bold ${config.text}`}>{ann.title}</span>
              {ann.content && (
                <span className="ml-2 text-warm-50/70">{ann.content}</span>
              )}
            </div>

            {ann.link_url && (
              <a
                href={ann.link_url}
                target="_blank"
                rel="noopener noreferrer"
                className={`shrink-0 rounded-md border px-3 py-1 text-xs font-bold transition hover:bg-rose-200/10 ${config.text} border-current/20`}
              >
                {ann.link_label || "Saber más"}
              </a>
            )}

            <button
              type="button"
              onClick={() => setDismissed((prev) => new Set(prev).add(ann.id))}
              className="shrink-0 rounded-md p-1 text-warm-50/40 transition hover:bg-rose-200/10 hover:text-warm-50"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
