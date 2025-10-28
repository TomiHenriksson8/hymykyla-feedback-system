// src/admin/routes/SurveysPage.tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useSurveys,
  useCreateSurvey,
  useDeleteSurvey,
  useActivateSurvey,
  useDeactivateSurvey,
} from "../../features/surveys/hooks";
import type { Survey, Question } from "../../features/surveys/types";
import { useMutation } from "@tanstack/react-query";
import { duplicateSurvey as duplicateSurveyApi } from "../../features/surveys/api";
import { MoreHorizontal } from "lucide-react";

/* ---------------- tiny UI bits ---------------- */

function Badge({
  children,
  tone = "zinc" as "zinc" | "emerald" | "amber",
}: {
  children: React.ReactNode;
  tone?: "zinc" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    zinc: "bg-zinc-100 border-zinc-200 text-zinc-700",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-700",
    amber: "bg-amber-50 border-amber-200 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${tones[tone]}`}>
      {children}
    </span>
  );
}

function nextVersion(items: Survey[]) {
  const max = Math.max(0, ...items.map((s) => Number(s.version) || 0));
  return max + 1;
}

function makeDefaultQuestion(order: number): Omit<Question, "_id"> {
  return {
    type: "scale5",
    prompt: {
      fi: "Arvioi kokemuksesi",
      en: "Rate your experience",
      sv: "Betygsätt din upplevelse",
    },
    required: true,
    order,
    min: 1,
    max: 5,
  };
}

/* ---------------- survey card (full-width, kebab menu) ---------------- */

function SurveyCard({ s, items }: { s: Survey; items: Survey[] }) {
  const navigate = useNavigate();

  const activateM = useActivateSurvey(s._id);
  const deactivateM = useDeactivateSurvey(s._id);
  const deleteM = useDeleteSurvey();

  const duplicateM = useMutation({
    mutationFn: ({
      id,
      version,
      title,
      isActive,
    }: {
      id: string;
      version: number;
      title?: string;
      isActive?: boolean;
    }) => duplicateSurveyApi(id, { version, title, isActive }),
    onSuccess: (copied) => navigate(`/hallinta/kyselyt/${copied._id}`),
  });

  const busy = activateM.isPending || deactivateM.isPending;
  const [menuOpen, setMenuOpen] = useState(false);

  // card click => go to builder
  const goEdit = () => navigate(`/hallinta/kyselyt/${s._id}`);

  // button styles (for menu items that look like buttons)
  const itemBase =
    "w-full text-left px-3 py-2 rounded-md text-sm hover:bg-zinc-50 transition";
  const itemDanger = "text-red-600 hover:bg-red-50";
  const itemPrimary = "text-emerald-700 hover:bg-emerald-50";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goEdit}
      onKeyDown={(e) => (e.key === "Enter" ? goEdit() : null)}
      className="relative w-full bg-white border border-zinc-200 rounded-2xl p-6 cursor-pointer shadow-sm hover:shadow transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-300"
      aria-label={`Avaa kyselyn muokkaus: ${s.title}`}
    >
      {/* Kebab button (stops card navigation) */}
      <div className="absolute top-3 right-3">
        <button
          type="button"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label={`Avaa toiminnot: ${s.title}`}
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen((v) => !v);
          }}
          className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
        >
          <MoreHorizontal size={16} />
        </button>

        {/* Menu */}
        {menuOpen && (
          <div
            role="menu"
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 mt-2 w-56 rounded-xl border border-zinc-200 bg-white shadow-lg p-1 z-10"
          >
            <button
              role="menuitem"
              className={itemBase}
              onClick={() => {
                const v = Number(window.prompt("Uuden version numero:", String(nextVersion(items))));
                if (!Number.isFinite(v)) return;
                const title =
                  window.prompt("Kopioidun kyselyn otsikko (valinnainen):", `${s.title} v${v}`) ||
                  undefined;
                duplicateM.mutate({ id: s._id, version: v, title });
                setMenuOpen(false);
              }}
              disabled={duplicateM.isPending}
            >
              {duplicateM.isPending ? "Kopioidaan…" : "Kopioi versiona…"}
            </button>

            <button
              role="menuitem"
              className={`${itemBase} ${itemPrimary}`}
              onClick={async () => {
                if (s.isActive) await deactivateM.mutateAsync();
                else await activateM.mutateAsync(true); // exclusive publish
                setMenuOpen(false);
              }}
              disabled={busy}
            >
              {busy ? "…" : s.isActive ? "Poista käytöstä" : "Julkaise"}
            </button>

            <div className="my-1 h-px bg-zinc-200" />

            <button
              role="menuitem"
              className={`${itemBase} ${itemDanger}`}
              onClick={() => {
                if (!window.confirm("Poistetaanko kysely? Toimintoa ei voi perua.")) return;
                deleteM.mutate(s._id);
                setMenuOpen(false);
              }}
              disabled={deleteM.isPending}
            >
              Poista
            </button>
          </div>
        )}
      </div>

      {/* Top row: title + meta (clicking anywhere here goes to edit) */}
      <div className="flex flex-wrap items-start justify-between gap-3 pr-10">
        <div className="min-w-0">
          <div className="font-medium text-zinc-900 truncate">{s.title}</div>
          <div className="mt-2.5 flex flex-wrap gap-2 text-xs">
            <Badge>v{s.version}</Badge>
            {s.isActive ? <Badge tone="emerald">aktiivinen</Badge> : <Badge>luonnos</Badge>}
            <Badge tone="zinc">{s.questions.length} kysymystä</Badge>
          </div>
        </div>
        <div className="text-xs text-zinc-500">
          {s.updatedAt ? new Date(s.updatedAt).toLocaleString("fi-FI") : "—"}
        </div>
      </div>
    </div>
  );
}

/* ---------------- page ---------------- */

export default function SurveysPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const surveysQ = useSurveys();
  const createM = useCreateSurvey();

  const items = surveysQ.data ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((s) => s.title.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className="py-3">
      {/* Top row — search bar stays EXACTLY as you had it */}
      <div className="flex items-start justify-between gap-4">
        <div className="border-b border-line/70 w-full pb-4 flex flex-row justify-between">
          <h1 className="text-2xl font-heading font-semibold text-black px-8 mt-1">kyselyt</h1>

          {/* unchanged positioning/spacing */}
          <input
            className="w-[400px] mr-36 bg-white border px-3  border-black rounded-lg py-2 text-sm"
            placeholder="Hae otsikolla…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="font-heading text-[14px] px-3 py-1.5 mr-8 rounded-lg bg-black/85 text-white hover:bg-brand-600"
            onClick={() => handleCreate(items, createM, navigate)}
            disabled={createM.isPending}
          >
            {createM.isPending ? "Luodaan…" : "Uusi kysely"}
          </button>
        </div>
      </div>

      {/* Full-width stacked cards (card is the link, kebab has secondary actions) */}
      <div className="mt-4 mx-10 space-y-3">
        {surveysQ.isLoading && (
          <div className="text-sm text-zinc-500 px-1 py-10">Ladataan…</div>
        )}
        {surveysQ.isError && !surveysQ.isLoading && (
          <div className="text-sm text-amber-600 px-1 py-10">
            Virhe ladattaessa. Yritä uudelleen.
          </div>
        )}
        {!surveysQ.isLoading && filtered.length === 0 && (
          <div className="text-sm text-zinc-500 px-1 py-10">Ei kyselyitä.</div>
        )}

        {filtered.map((s) => (
          <SurveyCard key={s._id} s={s} items={items} />
        ))}
      </div>

      {/* small footer status */}
      <div className="mt-2 text-xs text-zinc-400 ml-12">
        {surveysQ.isFetching ? "Päivitetään…" : `Löytyi ${filtered.length} kyselyä`}
      </div>
    </div>
  );
}

/* ---------------- actions ---------------- */

async function handleCreate(
  items: Survey[],
  createM: ReturnType<typeof useCreateSurvey>,
  navigate: (to: string) => void
) {
  const suggestedVersion = nextVersion(items);
  const title = window.prompt("Kyselyn otsikko:", `Uusi kysely v${suggestedVersion}`);
  if (!title) return;

  const body = {
    title: title.trim(),
    version: suggestedVersion,
    isActive: false,
    questions: [makeDefaultQuestion(10)],
  };

  createM.mutate(body as any, {
    onSuccess: (created) => {
      navigate(`/hallinta/kyselyt/${(created as Survey)._id}`);
    },
  });
}
