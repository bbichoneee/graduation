// src/components/qbank/TypeGroup.jsx
import ProblemListItem from "./ProblemListItem";
import { useState } from "react";
import "./TypeGroup.scss";

export default function TypeGroup({
  typeName,
  items = [],                // [{ problem, status }]
  defaultOpen = false,
  countBadge = true,
}) {
  const count = Array.isArray(items) ? items.length : 0;

  return (
    <li className="list-group-item p-0">
      <details className="type-group" open={defaultOpen}>
        <summary className="type-summary d-flex align-items-center justify-content-between">
          <div className="d-flex align-items-center gap-2">
            <span className="chevron" aria-hidden="true">▸</span>
            <strong>{typeName}</strong>
          </div>
          {countBadge && (
            <span className="badge bg-primary">{items.length}</span>
          )}
        </summary>

        <ul className="list-group list-group-flush">
          {items.map(({ problem, status }) => (
            <ProblemListItem key={problem.id} problem={problem} status={status} />
          ))}
        </ul>
      </details>
    </li>
  );
}
