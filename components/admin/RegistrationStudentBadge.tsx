"use client";

type RegistrationStudentBadgeProps = {
  registrationType: "adult" | "parent";
  studentCount: number;
  studentNames: string[];
};

export function RegistrationStudentBadge({
  registrationType,
  studentCount,
  studentNames,
}: RegistrationStudentBadgeProps) {
  const isAdult = registrationType === "adult";
  const label = isAdult ? "👤 成人" : "👨‍👩‍👧";
  const countLabel = isAdult ? `共 ${studentCount} 位` : `共 ${studentCount} 位學生`;

  return (
    <div className="group relative inline-flex">
      <span className="cursor-default text-foreground">
        {label} {countLabel}
      </span>
      {studentNames.length > 0 ? (
        <div className="pointer-events-none absolute left-0 top-full z-20 mt-2 min-w-[160px] rounded-xl border border-border bg-white px-3 py-2 text-xs text-foreground opacity-0 shadow-lg transition group-hover:opacity-100">
          {studentNames.map((name) => (
            <p key={name}>{name}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
