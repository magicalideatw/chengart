"use client";

type ActivityDetailHeroFrameProps = {
  children: React.ReactNode;
};

/** Hero image area: natural aspect ratio, no fixed height or cropping. */
export function ActivityDetailHeroFrame({ children }: ActivityDetailHeroFrameProps) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 md:px-8">
      <div className="relative w-full">{children}</div>
    </div>
  );
}

export const ACTIVITY_DETAIL_HERO_IMAGE_CLASS = "block h-auto w-full";

export const ACTIVITY_DETAIL_HERO_IMAGE_SIZES =
  "(max-width: 1400px) 100vw, 1400px";
