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

/* ---------------- helpers ---------------- */

function Badge({ children, tone = "zinc" as "zinc" | "emerald" | "amber" }) {
  const tones: Record<string, string> = {
    zinc: "bg-zinc-900 border-zinc-700 text-zinc-300",
    emerald: "bg-emerald-700 border-emerald-900 text-zinc-200 px-2",
    amber: "bg-amber-900/20 border-amber-700 text-amber-400",
  };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs border ${tones[tone]}`}>{children}</span>
  );
}

function makeDefaultQuestion(order: number): Omit<Question, "_id"> {
  return {
    type: "scale5",
    prompt: { fi: "Arvioi kokemuksesi", en: "Rate your experience", sv: "Betygsätt din upplevelse" },
    required: true,
    order,
    min: 1,
    max: 5,
  };
}

function nextVersion(items: Survey[]) {
  const max = Math.max(0, ...items.map((s) => Number(s.version) || 0));
  return max + 1;
}

/* ---------------- page ---------------- */

export default function SurveysPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const surveysQ = useSurveys();
  const createM = useCreateSurvey();
  const deleteM = useDeleteSurvey();

  // duplicate as a tiny mutation here (no separate hook needed)
  const duplicateM = useMutation({
    mutationFn: ({ id, version, title, isActive }: { id: string; version: number; title?: string; isActive?: boolean }) =>
      duplicateSurveyApi(id, { version, title, isActive }),
    onSuccess: (s) => navigate(`/hallinta/kyselyt/${s._id}`),
  });

  // activate/deactivate as per row (we create the hook instance per row when used)
  const [toggleBusy, setToggleBusy] = useState<string | null>(null);

  const items = surveysQ.data ?? [];
  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter((s) => s.title.toLowerCase().includes(q));
  }, [items, search]);

  return (
    <div className=" py-3">
      <div className="flex items-start justify-between gap-4">
        <div className="border-b border-line/70 w-full pb-4 flex flex-row justify-between">
          <h1 className="text-2xl font-heading font-semibold text-black px-8 mt-1">kyselyt</h1>
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

      

      {/* Table */}
      <div className="mt-4 overflow-x-auto mx-10">
        <table className="min-w-full text-sm table-fixed">
          <thead>
            <tr className="text-center text-black bg-peach-50 shadow-sm ">
              <th className="py-2 px-3">Otsikko</th>
              <th className="py-2 px-3 w-24">Versio</th>
              <th className="py-2 px-3 w-36">Tila</th>
              <th className="py-2 px-3 w-36">Kysymykset</th>
              <th className="py-2 px-3 w-56">Päivitetty</th>
              <th className="py-2 px-3 w-64"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 text-center">
            {surveysQ.isLoading && (
              <tr>
                <td colSpan={6} className="py-8 text-zinc-500">
                  Ladataan…
                </td>
              </tr>
            )}

            {surveysQ.isError && !surveysQ.isLoading && (
              <tr>
                <td colSpan={6} className="py-8 text-amber-600">
                  Virhe ladattaessa. Yritä uudelleen.
                </td>
              </tr>
            )}

            {!surveysQ.isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-zinc-500">
                  Ei kyselyitä.
                </td>
              </tr>
            )}

            {filtered.map((s) => {
              const ActivateBtn = () => {
                const activateM = useActivateSurvey(s._id);
                const deactivateM = useDeactivateSurvey(s._id);
                const busy = toggleBusy === s._id && (activateM.isPending || deactivateM.isPending);

                // unified sizing + light style to match background
                const base =
                  "inline-flex items-center justify-center h-9 min-w-[132px] rounded-lg text-xs font-medium border transition-colors";
                const publish =
                  "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-500";
                const deactivate =
                  "bg-white border-black text-black hover:bg-peach-50";

                return (
                  <button
                    className={`${base} ${s.isActive ? deactivate : publish}`}
                    disabled={busy}
                    onClick={async () => {
                      setToggleBusy(s._id);
                      try {
                        if (s.isActive) await deactivateM.mutateAsync();
                        else await activateM.mutateAsync(true); // exclusive true
                      } finally {
                        setToggleBusy(null);
                      }
                    }}
                  >
                    {busy ? "…" : s.isActive ? "Poista käytöstä" : "Julkaise"}
                  </button>
                );
              };

              // shared light buttons for edit/copy to match page bg
              const btnBase =
                "inline-flex items-center justify-center h-9 min-w-[132px] rounded-lg text-xs font-medium border transition-colors";
              const btnLight = "bg-white border-black/50 text-black hover:bg-peach-50";
              const btnDanger = "bg-red-600 border-red-600 text-white hover:bg-red-500";

              return (
                <tr key={s._id} className="text-black hover:bg-peach-50/60 bg-zinc-400/10">
                  <td className="py-3 px-3">
                    <div className="font-medium">{s.title}</div>
                  </td>
                  <td className="py-3 px-3">
                    {s.version}
                  </td>
                  <td className="py-3 px-3">
                    {s.isActive ? <Badge tone="emerald">aktiivinen</Badge> : <Badge>luonnos</Badge>}
                  </td>
                  <td className="py-3 px-3">{s.questions.length}</td>
                  <td className="py-3 px-3 text-zinc-500">
                    {s.updatedAt ? new Date(s.updatedAt).toLocaleString("fi-FI") : "—"}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        className={`${btnBase} ${btnLight}`}
                        onClick={() => navigate(`/hallinta/kyselyt/${s._id}`)}
                      >
                        Muokkaa
                      </button>

                      <button
                        className={`${btnBase} ${btnLight}`}
                        onClick={async () => {
                          const v = Number(
                            window.prompt("Uuden version numero:", String(nextVersion(items)))
                          );
                          if (!Number.isFinite(v)) return;
                          const title = window.prompt("Kopioidun kyselyn otsikko (valinnainen):", `${s.title} v${v}`) || undefined;
                          duplicateM.mutate({ id: s._id, version: v, title });
                        }}
                        disabled={duplicateM.isPending}
                      >
                        {duplicateM.isPending ? "Kopioidaan…" : "Kopioi versiona…"}
                      </button>

                      <ActivateBtn />

                      <button
                        className={`${btnBase} ${btnDanger}`}
                        onClick={() => {
                          if (!window.confirm("Poistetaanko kysely? Toimintoa ei voi perua.")) return;
                          deleteM.mutate(s._id);
                        }}
                        disabled={deleteM.isPending}
                      >
                        Poista
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* small footer status */}
      <div className="mt-1 text-xs text-zinc-400 ml-10">
        {surveysQ.isFetching ? "Päivitetään…" : `Löytyi ${filtered.length} kyselyä`}
      </div>
      
    </div>
  );
}

/* ---------------- actions ---------------- */

async function handleCreate(items: Survey[], createM: ReturnType<typeof useCreateSurvey>, navigate: (to: string) => void) {
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
