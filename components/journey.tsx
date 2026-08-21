import { songJourney } from "@/domain/workflows";

export function Journey() {
  return <ol className="journey">{songJourney.map((step, index) => <li key={step}><span>{index + 1}</span><div><strong>{step}</strong><small>{index === 0 ? "Begin the service journey" : "Governed workflow state"}</small></div></li>)}</ol>;
}
