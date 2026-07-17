import { Link } from "@tanstack/react-router";
import { formatPrice } from "@/lib/format";

type Props = {
  slug: string;
  name: string;
  priceCents: number;
  compareAtCents?: number | null;
  imageUrl: string | null;
  shortDescription?: string | null;
};

export function ProductCard({ slug, name, priceCents, compareAtCents, imageUrl, shortDescription }: Props) {
  return (
    <Link to="/products/$slug" params={{ slug }} className="group block">
      <div className="aspect-[5/4] overflow-hidden rounded-md bg-secondary/60">
        {imageUrl && (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="font-serif text-lg leading-tight">{name}</h3>
        <div className="text-right whitespace-nowrap">
          {compareAtCents && compareAtCents > priceCents ? (
            <>
              <span className="mr-2 text-xs text-muted-foreground line-through">{formatPrice(compareAtCents)}</span>
              <span className="text-accent font-medium">{formatPrice(priceCents)}</span>
            </>
          ) : (
            <span className="font-medium">{formatPrice(priceCents)}</span>
          )}
        </div>
      </div>
      {shortDescription && <p className="mt-1 text-sm text-muted-foreground line-clamp-1">{shortDescription}</p>}
    </Link>
  );
}
