import { useMemo } from "react";
import TypeGroup from "./TypeGroup";
import "./TypeGroup.scss";

// 유형 키(태그)
const getTypeKey = (p) =>
  Array.isArray(p.tags) && p.tags.length ? p.tags[0] : "기타";

// 난이도 라벨
const LEVEL_LABEL = (n) => `난이도 ${n}`;

export default function GroupedList({
  problems = [],
  userProgressById = {},
  defaultOpenFirst = true,
  groupMode = "unit", // "unit" | "level"
}) {
  const list = Array.isArray(problems) ? problems : [];

  // ── 그룹핑 ─────────────────────────────────────────────
  const grouped = useMemo(() => {
    // ✅ 유형 모드: 기존 로직 유지
    if (groupMode === "unit") {
      const map = new Map(); // groupName -> [{problem, status}]
      for (const p of list) {
        const status = userProgressById[p.id] ?? "unattempted";
        const key = getTypeKey(p);
        if (!map.has(key)) map.set(key, []);
        map.get(key).push({ problem: p, status });
      }
      // 그룹 내부 정렬 (level → id)
      for (const [, arr] of map) {
        arr.sort((a, b) => {
          const lvA = Number(a.problem.level ?? 0);
          const lvB = Number(b.problem.level ?? 0);
          if (lvA !== lvB) return lvA - lvB;
          return Number(a.problem.id) - Number(b.problem.id);
        });
      }
      return map;
    }

    // ✅ 난이도 모드: 1~5 드롭다운을 "항상" 생성
    const map = new Map();
    for (let lvl = 1; lvl <= 5; lvl += 1) {
      map.set(LEVEL_LABEL(lvl), []);
    }

    for (const p of list) {
      const status = userProgressById[p.id] ?? "unattempted";
      // 레벨이 없거나 이상하면 1~5로 보정
      const raw = Number(p.level ?? 1);
      const level = Number.isFinite(raw) ? Math.min(5, Math.max(1, raw)) : 1;
      map.get(LEVEL_LABEL(level)).push({ problem: p, status });
    }

    // 각 섹션 내부 정렬 (id 오름차순)
    for (const [, arr] of map) {
      arr.sort((a, b) => Number(a.problem.id) - Number(b.problem.id));
    }
    return map;
  }, [list, userProgressById, groupMode]);

  // ── 섹션 순서 ─────────────────────────────────────────
  const entries = useMemo(() => {
    const arr = Array.from(grouped.entries());
    if (groupMode === "level") {
      // 난이도 1 → 5 고정
      const order = (label) => {
        const m = String(label).match(/(\d+)/);
        return m ? Number(m[1]) : 9999;
      };
      return arr.sort((a, b) => order(a[0]) - order(b[0]));
    }
    // 유형은 한국어/숫자 정렬
    return arr.sort((a, b) =>
      String(a[0]).localeCompare(String(b[0]), "ko", { numeric: true })
    );
  }, [grouped, groupMode]);

  if (entries.length === 0) {
    return <div className="text-center text-muted py-5">표시할 문제가 없습니다.</div>;
  }

  // ── 렌더 ──────────────────────────────────────────────
  return (
    <div className="container-fluid py-3">
      {entries.map(([groupName, items], idx) => (
        <TypeGroup
          key={groupName}
          typeName={groupName}
          items={items}
          defaultOpen={defaultOpenFirst && idx === 0}
        />
      ))}
    </div>
  );
}
