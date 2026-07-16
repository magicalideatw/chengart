export type ActivityCtaState =
  | {
      kind: "internal-link";
      label: string;
      href: string;
    }
  | {
      kind: "external-link";
      label: string;
      href: string;
    }
  | {
      kind: "internal-action";
      label: string;
    }
  | {
      kind: "disabled";
      label: string;
    };

export function isPublicCourse(isOpen: boolean): boolean {
  return isOpen;
}

export function resolveActivityCta(input: {
  isOpen: boolean;
  isFull?: boolean;
  participationMethod: import("@/lib/courses/participation-method").ParticipationMethod;
  externalUrl: string | null;
  actionButtonText: string;
  internalHref: string;
}): ActivityCtaState {
  if (!input.isOpen) {
    return { kind: "disabled", label: "報名已截止" };
  }

  if (input.isFull) {
    return { kind: "disabled", label: "已額滿" };
  }

  if (input.participationMethod === "coming_soon") {
    return { kind: "disabled", label: "尚未開放" };
  }

  if (input.participationMethod === "external" && input.externalUrl) {
    return {
      kind: "external-link",
      label: input.actionButtonText,
      href: input.externalUrl,
    };
  }

  return {
    kind: "internal-link",
    label: input.actionButtonText,
    href: input.internalHref,
  };
}

export function canShowInternalPurchaseForm(input: {
  isOpen: boolean;
  participationMethod: import("@/lib/courses/participation-method").ParticipationMethod;
}): boolean {
  return input.isOpen && input.participationMethod === "internal";
}
