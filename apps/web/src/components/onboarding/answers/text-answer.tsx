import { Button } from "@kursa/ui/components/button";
import { Input } from "@kursa/ui/components/input";

type TextAnswerProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  placeholder?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  allowEmpty?: boolean;
};

export function TextAnswer(props: TextAnswerProps) {
  return (
    <div className="flex flex-col gap-3">
      <Input
        type={props.type ?? "text"}
        min={props.min}
        max={props.max}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            props.onSubmit();
          }
        }}
      />
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>Back</Button>
        <Button type="button" onClick={props.onSubmit}>Continue</Button>
      </div>
    </div>
  );
}
