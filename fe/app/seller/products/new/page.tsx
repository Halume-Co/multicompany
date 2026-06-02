"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";

interface ProductForm {
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: Array<{ size: string; stock: number }>;
}

const categories = [
  "Running",
  "Basketball",
  "Casual",
  "Hiking",
  "Lifestyle",
  "Sports",
];

const defaultSizes = [
  { size: "6", stock: 0 },
  { size: "7", stock: 0 },
  { size: "8", stock: 0 },
  { size: "9", stock: 0 },
  { size: "10", stock: 0 },
  { size: "11", stock: 0 },
  { size: "12", stock: 0 },
  { size: "13", stock: 0 },
];

export default function NewProductPage() {
  const { canRender } = useSellerAccess();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    description: "",
    price: 0,
    category: "Running",
    sizes: defaultSizes,
  });

  useEffect(() => {
    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imageFiles]);

  if (!canRender) {
    return null;
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) : value,
    }));
  };

  const handleSizeChange = (index: number, field: "stock", value: number) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.map((size, sizeIndex) =>
        sizeIndex === index ? { ...size, [field]: value } : size
      ),
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageFiles(normalizeImageFiles(e.target.files || []));
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const normalizeImageFiles = (files: FileList | File[]) => {
    return Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 6);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/seller/products");
    } catch {
      alert("Failed to create product");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-5xl mx-auto px-lg py-3xl">
          <div className="mb-3xl">
            <h1 className="text-4xl font-semibold leading-[1.1] text-foreground mb-sm">
              Add New Product
            </h1>
            <p className="text-muted-foreground">
              Create and list a new shoe product for sale
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-xl">
            <div className="border border-border rounded-lg bg-card p-lg space-y-lg">
              <h2 className="text-xl font-bold text-foreground">
                Product Information
              </h2>

              <div>
                <label className="block text-sm font-medium mb-sm">
                  Product Name *
                </label>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Classic Air Max"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-sm">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Describe your product, materials, fit, and any special features"
                  rows={6}
                  className="w-full rounded-sm border border-border bg-background px-md py-sm text-base text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  required
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-lg">
                <div>
                  <label className="block text-sm font-medium mb-sm">
                    Price (USD) *
                  </label>
                  <Input
                    name="price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="129.99"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-sm">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="h-11 w-full rounded-sm border border-border bg-background px-md py-sm text-base text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="border border-border rounded-lg bg-card p-lg space-y-lg">
              <h2 className="text-xl font-bold text-foreground">
                Inventory & Sizes
              </h2>

              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-md">
                {formData.sizes.map((sizeOption, index) => (
                  <div key={sizeOption.size}>
                    <label className="block text-sm font-medium mb-sm">
                      Size {sizeOption.size}
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={sizeOption.stock}
                      onChange={(e) =>
                        handleSizeChange(
                          index,
                          "stock",
                          parseInt(e.target.value, 10) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="bg-secondary p-md rounded-sm">
                <p className="text-sm text-foreground">
                  Total Stock:{" "}
                  <span className="font-bold">
                    {formData.sizes.reduce((sum, size) => sum + size.stock, 0)}
                  </span>
                </p>
              </div>
            </div>

            <div className="border border-border rounded-lg bg-card p-lg space-y-lg">
              <h2 className="text-xl font-bold text-foreground">
                Product Images
              </h2>

              <label
                htmlFor="product-images"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  setImageFiles(normalizeImageFiles(event.dataTransfer.files));
                }}
                className="block rounded-lg border border-dashed border-border bg-secondary p-2xl text-center transition hover:border-primary hover:bg-background focus-within:ring-2 focus-within:ring-ring"
              >
                <input
                  id="product-images"
                  type="file"
                  accept="image/png,image/jpeg,image/gif,image/webp"
                  multiple
                  className="sr-only"
                  onChange={handleImageChange}
                />
                <svg
                  className="w-12 h-12 mx-auto mb-md text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-foreground font-medium">
                  Click to upload images
                </p>
                <p className="text-sm text-muted-foreground mt-sm">
                  PNG, JPG, GIF, or WebP up to 10MB each. You can select up to
                  6 images.
                </p>
                {imageFiles.length > 0 && (
                  <p className="mt-md text-sm font-medium text-primary">
                    {imageFiles.length} image{imageFiles.length > 1 ? "s" : ""} selected
                  </p>
                )}
              </label>

              {imagePreviews.length > 0 && (
                <div className="grid sm:grid-cols-3 gap-md">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={preview}
                      className="relative aspect-square rounded-md overflow-hidden border border-border bg-secondary"
                    >
                      <img
                        src={preview}
                        alt={`Product preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-sm right-sm rounded-full bg-background/90 border border-border px-sm py-xs text-xs font-medium text-foreground shadow-sm hover:bg-background"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-md justify-end">
              <Button variant="outline" asChild>
                <Link href="/seller/products">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isLoading} size="lg">
                {isLoading ? "Creating..." : "Create Product"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
