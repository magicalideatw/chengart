"use client";

type ActivityDetailHeroFrameProps = {
  children: React.ReactNode;
};

/** 16:9 hero image area, capped height on desktop to reduce object-cover cropping. */
export function ActivityDetailHeroFrame({ children }: ActivityDetailHeroFrameProps) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 md:px-8">
      <div
        className="relative mx-auto w-full overflow-hidden"
        style={{
          aspectRatio: "16 / 9",
          maxHeight: "clamp(280px, 35vw, 420px)",
          maxWidth: "min(100%, calc(clamp(280px, 35vw, 420px) * 16 / 9))",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export const ACTIVITY_DETAIL_HERO_IMAGE_CLASS =
  "object-cover object-[center_30%] sm:object-[center_25%] md:object-[center_22%]";

export const ACTIVITY_DETAIL_HERO_IMAGE_SIZES =
  "(max-width: 1400px) 100vw, 1400px";
