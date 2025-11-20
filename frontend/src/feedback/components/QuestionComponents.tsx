import type { Question } from "../../features/surveys/types";

// Face images for scale questions
const FACE_IMAGES: Record<number, string> = {
  1: "./assets/faces/good.png",
  2: "./assets/faces/okay.png",
  3: "./assets/faces/neutral.png",
  4: "./assets/faces/unhappy.png",
  5: "./assets/faces/bad.png",
};

export type ScaleProps = {
  question: Question;
  value?: number;
  onSelect: (v: number) => void;
};

export function ScaleQuestion({ question, value, onSelect }: ScaleProps) {
  const min = question.min ?? 1;
  const max = question.max ?? 5;
  const options = Array.from({ length: max - min + 1 }, (_, idx) => min + idx);

  return (
    <div className="flex items-center justify-between gap-3 md:gap-6 mt-4">
      {options.map((val) => {
        const selected = value === val;
        const src = FACE_IMAGES[val];
        return (
          <button
            key={val}
            type="button"
            onClick={() => onSelect(val)}
            className="flex-1 flex flex-col items-center gap-2 focus:outline-none"
          >
            <div
              className={[
                "w-16 h-16 md:w-24 md:h-24 rounded-full flex items-center justify-center border border-line bg-peach-50 transition-transform",
                selected ? "ring-4 ring-brand shadow-lg scale-105" : "hover:scale-105",
              ].join(" ")}
            >
              {src ? (
                <img
                  src={src}
                  alt={`Arvosana ${val}`}
                  className="w-12 h-12 md:w-16 md:h-16 object-contain"
                />
              ) : (
                <span className="text-xl font-semibold text-ink">{val}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

export type BooleanProps = {
  value?: boolean;
  onSelect: (v: boolean) => void;
  yesLabel: string;
  noLabel: string;
};

export function BooleanQuestion({
  value,
  onSelect,
  yesLabel,
  noLabel,
}: BooleanProps) {
  return (
    <div className="flex justify-center gap-4 mt-4">
      <button
        type="button"
        onClick={() => onSelect(false)}
        className={[
          "px-6 py-3 rounded-full text-lg font-semibold border border-line bg-white",
          value === false
            ? "bg-brand text-white border-brand"
            : "hover:bg-peach-50",
        ].join(" ")}
      >
        {noLabel}
      </button>
      <button
        type="button"
        onClick={() => onSelect(true)}
        className={[
          "px-6 py-3 rounded-full text-lg font-semibold border border-line bg-white",
          value === true
            ? "bg-brand text-white border-brand"
            : "hover:bg-peach-50",
        ].join(" ")}
      >
        {yesLabel}
      </button>
    </div>
  );
}

export type TextProps = {
  value: string;
  onChange: (v: string) => void;
  maxLength: number;
  label: string;
  placeholder: string;
};

export function QuestionText({
  value,
  onChange,
  maxLength,
  label,
  placeholder,
}: TextProps) {
  return (
    <div>
      <p className="text-sm text-ink-3 mb-2">{label}</p>
      <textarea
        rows={4}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-brand bg-peach-50"
        placeholder={placeholder}
      />
      <div className="mt-1 text-right text-xs text-ink-3">
        {value.length} / {maxLength}
      </div>
    </div>
  );
}
