"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSellerAccess } from "@/lib/hooks/useSellerAccess";
import * as api from "@/lib/api";

interface ProductForm {
  name: string;
  description: string;
  price: number;
  categoryId: string;
  imageUrl: string;
  sizes: Array<{ size: number; stock: number }>;
}

const defaultSizes = [
  { size: 38, stock: 0 },
  { size: 39, stock: 0 },
  { size: 40, stock: 0 },
  { size: 41, stock: 0 },
  { size: 42, stock: 0 },
  { size: 43, stock: 0 },
  { size: 44, stock: 0 },
  { size: 45, stock: 0 },
];

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  
  const { canRender } = useSellerAccess();
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<api.Category[]>([]);
  
  // Image handling state
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [formData, setFormData] = useState<ProductForm>({
    name: "",
    description: "",
    price: 0,
    categoryId: "",
    imageUrl: "",
    sizes: defaultSizes,
  });

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [catsRes, productRes] = await Promise.all([
          api.getCategories(),
          api.getProduct(id)
        ]);

        if (catsRes.success && catsRes.data) {
          setCategories(catsRes.data);
        }

        if (productRes.success && productRes.data) {
          const p = productRes.data;
          
          // Map product sizes to our default sizes structure
          const mappedSizes = defaultSizes.map(ds => {
            const found = p.sizes.find(ps => parseInt(ps.size) === ds.size);
            return found ? { size: ds.size, stock: found.stock } : ds;
          });

          // Also check for sizes not in our default list
          p.sizes.forEach(ps => {
            const sizeInt = parseInt(ps.size);
            if (!mappedSizes.find(ms => ms.size === sizeInt)) {
              mappedSizes.push({ size: sizeInt, stock: ps.stock });
            }
          });

          setFormData({
            name: p.name,
            description: p.description,
            price: p.price,
            categoryId: catsRes.data?.find(c => c.name === p.category)?.id || "",
            imageUrl: p.images[0] || "",
            sizes: mappedSizes.sort((a, b) => a.size - b.size),
          });
          
          if (p.images[0]) {
            setImagePreviews([p.images[0]]);
          }
        } else {
          alert("Product not found");
          router.push("/seller/products");
        }
      } catch (error) {
        console.error("Error fetching product data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id, router]);

  useEffect(() => {
    // Only generate previews for NEWLY selected files
    if (imageFiles.length === 0) return;

    const previews = imageFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);

    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview));
    };
  }, [imageFiles]);

  if (!canRender || isLoading) {
    return (
      <>
        <Header />
        <main className="bg-background">
          <div className="max-w-5xl mx-auto px-lg py-3xl text-center">
            <p className="text-muted-foreground animate-pulse">Loading product data...</p>
          </div>
        </main>
      </>
    );
  }

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "price" ? parseFloat(value) || 0 : value,
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
    const files = normalizeImageFiles(e.target.files || []);
    setImageFiles(files);
  };

  const removeImage = (index: number) => {
    if (imageFiles.length > 0) {
      setImageFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
    } else {
      // If we are removing an existing image
      setImagePreviews([]);
      setFormData(prev => ({ ...prev, imageUrl: "" }));
    }
  };

  const normalizeImageFiles = (files: FileList | File[]) => {
    return Array.from(files)
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, 6);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let finalImageUrl = formData.imageUrl;
      if (imageFiles.length > 0) {
        // Mock upload
        finalImageUrl = "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"; 
      }

      const payload = {
        ...formData,
        imageUrl: finalImageUrl,
        sizes: formData.sizes.filter((s) => s.stock > 0),
      };

      if (payload.sizes.length === 0) {
        alert("Please add stock for at least one size");
        setIsSaving(false);
        return;
      }

      const res = await api.updateProduct(id, payload);
      if (res.success) {
        router.push("/seller/products");
      } else {
        alert("Failed to update product: " + (res.error || "Unknown error"));
      }
    } catch (error) {
      alert("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Header />
      <main className="bg-background">
        <div className="max-w-5xl mx-auto px-lg py-3xl">
          <div className="mb-3xl">
            <h1 className="text-4xl font-semibold leading-[1.1] text-foreground mb-sm">
              Edit Product
            </h1>
            <p className="text-muted-foreground">
              Update your shoe product details and inventory
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
                    name="categoryId"
                    value={formData.categoryId}
                    onChange={handleInputChange}
                    className="h-11 w-full rounded-sm border border-border bg-background px-md py-sm text-base text-foreground outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/20"
                    required
                  >
                    <option value="" disabled>Select category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-sm">
                  Direct Image URL (Optional)
                </label>
                <Input
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/my-shoe.jpg"
                />
              </div>
            </div>

            <div className="border border-border rounded-lg bg-card p-lg space-y-lg">
              <h2 className="text-xl font-bold text-foreground">
                Product Images
              </h2>

              <label
                htmlFor="product-images"
                className="block rounded-lg border border-dashed border-border bg-secondary p-2xl text-center transition hover:border-primary hover:bg-background cursor-pointer"
              >
                <input
                  id="product-images"
                  type="file"
                  accept="image/*"
                  multiple
                  className="sr-only"
                  onChange={handleImageChange}
                />
                <p className="text-foreground font-medium">Click to change images</p>
                <p className="text-sm text-muted-foreground mt-sm">Leave empty to keep current image</p>
              </label>

              {imagePreviews.length > 0 && (
                <div className="grid sm:grid-cols-3 gap-md">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-md overflow-hidden border border-border bg-secondary"
                    >
                      <img
                        src={preview}
                        alt={`Product preview ${index + 1}`}
                        className="h-full w-full object-cover"
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

            <div className="border border-border rounded-lg bg-card p-lg space-y-lg">
              <h2 className="text-xl font-bold text-foreground">
                Inventory & Sizes (EU)
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
            </div>

            <div className="flex gap-md justify-end">
              <Button variant="outline" asChild>
                <Link href="/seller/products">Cancel</Link>
              </Button>
              <Button type="submit" disabled={isSaving} size="lg">
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </>
  );
}
