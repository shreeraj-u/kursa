import { useState } from "react";

import { Button } from "@kursa/ui/components/button";

type UnsavedDraftGuardProps = {
  hasDraft: boolean;
  itemLabel: string;
  addLabel: string;
  onAdd: () => boolean;
  onContinue: () => void;
  onBack: () => void;
};

export function UnsavedDraftGuard(props: UnsavedDraftGuardProps) {
  const [warn, setWarn] = useState(false);

  const tryContinue = () => {
    if (props.hasDraft) {
      setWarn(true);
      return;
    }
    props.onContinue();
  };

  const discardAndContinue = () => {
    setWarn(false);
    props.onContinue();
  };

  const addAndContinue = () => {
    const saved = props.onAdd();
    if (!saved) return;
    setWarn(false);
    props.onContinue();
  };

  return (
    <>
      {warn ? (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3">
          <p className="text-xs text-ink">
            You started adding {props.itemLabel} but didn&apos;t click &quot;{props.addLabel}&quot;. Save it first, or continue without saving.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={addAndContinue}>
              {props.addLabel}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={discardAndContinue}>
              Continue without saving
            </Button>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={props.onBack}>
          Back
        </Button>
        <Button type="button" onClick={tryContinue}>
          Continue
        </Button>
      </div>
    </>
  );
}
