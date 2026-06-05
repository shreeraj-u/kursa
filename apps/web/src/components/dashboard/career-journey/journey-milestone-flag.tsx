interface JourneyMilestoneFlagProps {
  onClick: () => void;
}

export default function JourneyMilestoneFlag({ onClick }: JourneyMilestoneFlagProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="mono text-2xs text-mute-3 hover:text-accent"
    >
      This step feels off
    </button>
  );
}
