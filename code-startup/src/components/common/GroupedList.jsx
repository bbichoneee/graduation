// src/components/qbank/GroupedList.jsx
import { useMemo } from "react";
import TypeGroup from "./TypeGroup";
import "./TypeGroup.scss";

// 문제에서 유형을 꺼내는 규칙
const getTypeKey = (p) => (Array.isArray(p.tags) && p.tags.length ? p.tags[0] : "기타");

export default function GroupedList({
  problems = [],
  userProgressById = {},
  defaultOpenFirst = true,
}) {
  const list = Array.isArray(problems) ? problems : [];

  // 유형별 그룹핑
  const grouped = useMemo(() => {
    const map = new Map(); // typeName -> [{problem, status}]
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
  }, [list, userProgressById]);

  // 그룹명 정렬
  const entries = useMemo(
    () =>
      Array.from(grouped.entries()).sort((a, b) =>
        String(a[0]).localeCompare(String(b[0]), "ko", { numeric: true })
      ),
    [grouped]
  );

  if (entries.length === 0) {
    return <div className="text-center text-muted py-5">표시할 문제가 없습니다.</div>;
  }

  // ✅ 상단 "전체/유형 선택" 드롭다운 없음 —> 유형별 섹션만 나열
  return (
    <div className="container-fluid py-3">
      {entries.map(([typeName, items], idx) => (
        <TypeGroup
          key={typeName}
          typeName={typeName}
          items={items}
          defaultOpen={defaultOpenFirst && idx === 0}
        />
      ))}
    </div>
  );
}

