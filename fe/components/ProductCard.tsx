import Link from "next/link";
import { Product } from "@/lib/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const imageUrl = product.images[0] || "/placeholder.jpg";

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block h-full rounded-lg border border-border bg-card p-lg transition-colors hover:border-primary"
    >
      <div className="flex h-full flex-col">
        <div className="relative mb-lg aspect-square w-full overflow-hidden rounded-sm bg-secondary">
          <img
            src={imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </div>

        <div className="flex flex-1 flex-col space-y-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {product.category}
          </p>

          <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-primary">
            {product.name}
          </h3>

          <div className="flex items-center gap-xs">
            <div className="flex gap-xs">
              {Array.from({ length: 5 }).map((_, i) => (
                <svg
                  key={i}
                  className={`w-4 h-4 ${
                    i < Math.round(product.rating)
                      ? "fill-primary"
                      : "fill-border"
                  }`}
                  viewBox="0 0 20 20"
                >
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              ({product.reviewCount})
            </span>
          </div>

          <div className="mt-auto pt-sm flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-foreground">
                ${product.price.toFixed(2)}
              </p>
              <Link 
                href={`/companies/${product.sellerId}`}
                className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-xs"
                onClick={(e) => e.stopPropagation()}
              >
                {product.sellerLogo ? (
                  <img src={product.sellerLogo} alt={product.sellerName} className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center text-[10px] font-bold">
                    {product.sellerName.charAt(0)}
                  </div>
                )}
                by {product.sellerName}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
