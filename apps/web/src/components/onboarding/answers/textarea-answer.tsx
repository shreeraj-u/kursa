import { Button } from "@kursa/ui/components/button";

type TextareaAnswerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  placeholder?: string;
};

export function TextareaAnswer(props: TextareaAnswerProps) {
  return (
    <div className="flex flex-col gap-3">
      <textarea
        className="min-h-[88px] w-full rounded-md border border-line bg-surface p-3 text-ink text-sm"
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
        <Button type="button" onClick={props.onSubmit}>Continue</Button>
      </div>
    </div>
  );
}
