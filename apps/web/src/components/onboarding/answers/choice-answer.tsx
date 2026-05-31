import { Button } from "@kursa/ui/components/button";

type ChoiceAnswerProps<T extends string> = {
  choices: Array<{ value: T; label: string }>;
  value: T | "";
  onSelect: (value: T) => void;
  onBack: () => void;
};

export function ChoiceAnswer<T extends string>(props: ChoiceAnswerProps<T>) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {props.choices.map((choice) => {
          const isSelected = props.value === choice.value;
          return (
            <button
              key={choice.value}
              type="button"
              onClick={() => props.onSelect(choice.value)}
              className={`rounded-full px-4 py-1.5 transition-colors border text-sm ${
                isSelected
                  ? "border-ink bg-ink text-bg"
                  : "border-line bg-surface text-ink hover:bg-bg-sub"
              }`}
            >
              {choice.label}
            </button>
          );
        })}
      </div>
      <div className="flex justify-start">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
      </div>
    </div>
  );
}
