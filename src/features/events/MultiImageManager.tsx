"use client";

import React, { useState } from "react";
import { ImageDropzone } from "@/components/ui/ImageDropzone";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import {
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  Plus,
  Image as ImageIcon,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export interface MultiImageManagerProps {
  imageUrls: string[];
  onChange: (urls: string[]) => void;
  onUploadFile: (file: Blob | File) => Promise<string>;
  disabled?: boolean;
}

export function MultiImageManager({
  imageUrls,
  onChange,
  onUploadFile,
  disabled = false,
}: MultiImageManagerProps) {
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);

  const coverUrl = imageUrls[0] || null;
  const galleryUrls = imageUrls.slice(1);

  // Cover image change
  const handleCoverChange = async (fileOrUrl: Blob | string) => {
    if (typeof fileOrUrl === "string" && !fileOrUrl) {
      // Remove cover
      onChange(galleryUrls);
      return;
    }
    if (fileOrUrl instanceof Blob) {
      try {
        setIsUploadingCover(true);
        const url = await onUploadFile(fileOrUrl);
        onChange([url, ...galleryUrls]);
        toast.success("Cover image uploaded");
      } catch (err) {
        console.error("Cover upload failed:", err);
        toast.error("Failed to upload cover image");
      } finally {
        setIsUploadingCover(false);
      }
    }
  };

  // Gallery image add
  const handleAddGalleryImage = async (fileOrUrl: Blob | string) => {
    if (fileOrUrl instanceof Blob) {
      if (galleryUrls.length >= 4) {
        toast.error("Maximum 4 gallery images allowed.");
        return;
      }
      try {
        setIsUploadingGallery(true);
        const url = await onUploadFile(fileOrUrl);
        onChange([coverUrl || url, ...(coverUrl ? [...galleryUrls, url] : galleryUrls)]);
        toast.success("Gallery image added");
      } catch (err) {
        console.error("Gallery upload failed:", err);
        toast.error("Failed to upload gallery image");
      } finally {
        setIsUploadingGallery(false);
      }
    }
  };

  // Remove gallery image
  const handleRemoveGallery = (index: number) => {
    const nextGallery = [...galleryUrls];
    nextGallery.splice(index, 1);
    onChange(coverUrl ? [coverUrl, ...nextGallery] : nextGallery);
  };

  // Reorder gallery image left
  const handleMoveGalleryLeft = (index: number) => {
    if (index === 0) return;
    const nextGallery = [...galleryUrls];
    const temp = nextGallery[index - 1];
    nextGallery[index - 1] = nextGallery[index];
    nextGallery[index] = temp;
    onChange(coverUrl ? [coverUrl, ...nextGallery] : nextGallery);
  };

  // Reorder gallery image right
  const handleMoveGalleryRight = (index: number) => {
    if (index === galleryUrls.length - 1) return;
    const nextGallery = [...galleryUrls];
    const temp = nextGallery[index + 1];
    nextGallery[index + 1] = nextGallery[index];
    nextGallery[index] = temp;
    onChange(coverUrl ? [coverUrl, ...nextGallery] : nextGallery);
  };

  return (
    <Card variant="default">
      <CardHeader>
        <CardTitle>5. Media &amp; Artwork</CardTitle>
        <CardDescription>
          Primary cover banner (2.4:1) for mobile feed and detail header, plus up to 4 gallery photos (4:3).
        </CardDescription>
      </CardHeader>

      <div className="flex flex-col gap-5">
        {/* Cover Image Slot */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink uppercase tracking-wide flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-accent-deep" />
              Primary Cover Banner (2.4:1 Aspect Ratio)
            </span>
            {coverUrl && (
              <span className="text-[11px] text-accent-deep font-medium">
                ✓ Cover active
              </span>
            )}
          </div>

          <ImageDropzone
            value={coverUrl}
            onChange={handleCoverChange}
            aspectRatio={2.4 / 1}
            disabled={disabled || isUploadingCover}
          />
        </div>

        {/* Gallery Images Slots */}
        <div className="flex flex-col gap-2 pt-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-ink uppercase tracking-wide">
                Gallery Photos (4:3) — {galleryUrls.length} / 4
              </span>
              <span className="text-[11px] text-ink-muted">
                Additional photos displayed in event detail carousel
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {galleryUrls.map((url, idx) => (
              <div
                key={url + idx}
                className="relative group rounded-lg overflow-hidden border border-border bg-surface aspect-[4/3] flex items-center justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Hover Action Overlay */}
                <div className="absolute inset-0 bg-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-on-ink bg-ink/70 px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGallery(idx)}
                      className="p-1 rounded bg-crimson/80 hover:bg-crimson text-white transition-colors cursor-pointer"
                      title="Remove Photo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2">
                    {idx > 0 && (
                      <button
                        type="button"
                        onClick={() => handleMoveGalleryLeft(idx)}
                        className="p-1.5 rounded-full bg-white/80 hover:bg-white text-ink transition-colors cursor-pointer"
                        title="Move Earlier"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {idx < galleryUrls.length - 1 && (
                      <button
                        type="button"
                        onClick={() => handleMoveGalleryRight(idx)}
                        className="p-1.5 rounded-full bg-white/80 hover:bg-white text-ink transition-colors cursor-pointer"
                        title="Move Later"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Add Gallery Item Dropzone */}
            {galleryUrls.length < 4 && (
              <div className="aspect-[4/3]">
                <ImageDropzone
                  value={null}
                  onChange={handleAddGalleryImage}
                  aspectRatio={4 / 3}
                  disabled={disabled || isUploadingGallery}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
