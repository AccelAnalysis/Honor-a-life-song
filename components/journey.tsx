import Link from "next/link";
import { howItWorksSteps } from "@/lib/public-navigation";

export function Journey() {
  return (
    <ol className="journey">
      {howItWorksSteps.map((step, index) => (
        <li key={step.id}>
          <span>{index + 1}</span>
          <div>
            <strong><Link href={step.href}>{step.label}</Link></strong>
            <small>{step.description}</small>
          </div>
        </li>
      ))}
    </ol>
  );
}
