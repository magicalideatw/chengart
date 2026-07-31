import Image from "next/image";
import { FadeIn } from "@/components/ui/FadeIn";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { spaceRentalContent } from "@/lib/data/space-rental";

export function SpaceGallerySection() {
  const { gallery } = spaceRentalContent;

  return (
    <section className="bg-white py-16 sm:py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <FadeIn>
          <SectionHeader
            label={gallery.label}
            title={gallery.title}
            description={gallery.description}
            align="center"
          />
        </FadeIn>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2">
          {gallery.images.map((image, index) => (
            <FadeIn key={image.src} delay={0.04 + index * 0.03}>
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-border bg-surface">
                <Image
                  src={image.src}
                  alt={image.alt}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
