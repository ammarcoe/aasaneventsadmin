"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import imageCompression from "browser-image-compression";
import { FastAverageColor } from "fast-average-color";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "@/lib/firebase";
import type { EventImage } from "@/types";
import { FocalPicker } from "./FocalPicker";
import { PreviewFrames } from "./PreviewFrames";
import { Plus, X, Star, RefreshCw, AlertCircle, Sparkles, Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadingItem {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "uploading" | "failed" | "done";
  error?: string;
  partialImage?: Partial<EventImage>;
}

interface SortableTileProps {
  id: string;
  index: number;
  image?: EventImage;
  uploadingItem?: UploadingItem;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onSetCover: () => void;
  onRetry?: () => void;
}

function SortableTile({
  id,
  index,
  image,
  uploadingItem,
  isSelected,
  onSelect,
  onRemove,
  onSetCover,
  onRetry,
}: SortableTileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  const isCover = index === 0;
  const isUploading = uploadingItem?.status === "uploading";
  const isFailed = uploadingItem?.status === "failed";
  const displaySrc =
    image?.sizes?.s || image?.sizes?.m || image?.sizes?.l || uploadingItem?.previewUrl;
  const isSmallWarning = image && (image.w < 1200 || image.h < 1200);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group w-[120px] h-[120px] rounded-[var(--radius-md)] overflow-hidden cursor-pointer select-none border transition-all ${
        isSelected
          ? "ring-2 ring-[var(--color-ink)] border-transparent"
          : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)]"
      } ${isDragging ? "opacity-40" : "opacity-100"}`}
      onClick={onSelect}
      {...attributes}
      {...listeners}
    >
      {/* Background/Image */}
      {displaySrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displaySrc} alt="Event" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[var(--color-surface-subtle)] flex items-center justify-center text-[var(--color-ink-faint)] text-xs">
          Loading...
        </div>
      )}

      {/* Cover Badge */}
      {isCover && (
        <div className="absolute top-1.5 left-1.5 z-20 bg-[var(--color-accent)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm tracking-wider flex items-center gap-1">
          <Star className="w-2.5 h-2.5 fill-current" />
          COVER
        </div>
      )}

      {/* Small Image Warning Dot */}
      {isSmallWarning && !isCover && (
        <div
          title="Small image — may look blurry on big screens"
          className="absolute top-1.5 left-1.5 z-20 w-3 h-3 rounded-full bg-amber-500 border border-white shadow-xs"
        />
      )}

      {/* Uploading Progress Overlay */}
      {isUploading && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2 text-white z-30">
          <div className="text-xs font-semibold mb-1">{uploadingItem?.progress || 0}%</div>
          <div className="w-full bg-white/30 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-[var(--color-accent)] h-full transition-all duration-150"
              style={{ width: `${uploadingItem?.progress || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Failed Retry Overlay */}
      {isFailed && (
        <div className="absolute inset-0 bg-red-950/80 flex flex-col items-center justify-center p-1 text-white z-30">
          <AlertCircle className="w-5 h-5 text-red-400 mb-1" />
          <span className="text-[10px] text-red-200 font-medium">Failed</span>
          {onRetry && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="mt-1 px-2 py-0.5 bg-white text-red-900 rounded text-[10px] font-semibold hover:bg-red-50 flex items-center gap-1"
            >
              <RefreshCw className="w-2.5 h-2.5" />
              Retry
            </button>
          )}
        </div>
      )}

      {/* Hover Overlay Actions */}
      {!isUploading && !isFailed && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex flex-col justify-between p-1.5 pointer-events-auto">
          <div className="flex justify-end">
            <button
              type="button"
              title="Remove image"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="p-1 rounded-full bg-black/60 text-white hover:bg-red-600 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {!isCover && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSetCover();
              }}
              className="w-full py-0.5 bg-white/90 hover:bg-white text-[var(--color-ink)] text-[10px] font-semibold rounded shadow-xs text-center"
            >
              Set as cover
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface ImageManagerProps {
  images: EventImage[];
  organizerId?: string | null;
  onChange: (images: EventImage[]) => void;
  onUploadingChange?: (isUploading: boolean) => void;
  error?: string;
}

export function ImageManager({
  images,
  organizerId,
  onChange,
  onUploadingChange,
  error,
}: ImageManagerProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [uploadQueue, setUploadQueue] = useState<UploadingItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Sync isUploading state to parent form
  useEffect(() => {
    const isUploading = uploadQueue.some((item) => item.status === "uploading");
    onUploadingChange?.(isUploading);
  }, [uploadQueue, onUploadingChange]);

  // Make sure selectedIndex is valid
  useEffect(() => {
    if (images.length === 0) {
      setSelectedIndex(0);
    } else if (selectedIndex >= images.length) {
      setSelectedIndex(images.length - 1);
    }
  }, [images.length, selectedIndex]);

  // Process and upload a single file
  const processAndUploadFile = async (file: File) => {
    const fileId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const previewUrl = URL.createObjectURL(file);

    // Initial check: size <= 15MB
    if (file.size > 15 * 1024 * 1024) {
      toast.error(`${file.name} is larger than 15MB.`);
      return;
    }

    // Supported formats
    const validTypes = ["image/jpeg", "image/png", "image/heic", "image/webp", "image/jpg"];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.name.toLowerCase().endsWith(".heic")) {
      toast.error(`${file.name} is not a supported image format (JPEG, PNG, HEIC, WebP).`);
      return;
    }

    const item: UploadingItem = {
      id: fileId,
      file,
      previewUrl,
      progress: 0,
      status: "uploading",
    };

    setUploadQueue((q) => [...q, item]);

    try {
      // 1. Compression, EXIF orientation correction, EXIF strip
      const options = {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2400,
        useWebWorker: true,
        fileType: "image/jpeg",
        initialQuality: 0.85,
      };
      const compressedFile = await imageCompression(file, options);

      // 2. Measure dimensions & dominant color
      const objectUrl = URL.createObjectURL(compressedFile);
      const fac = new FastAverageColor();
      const color = await fac.getColorAsync(objectUrl, { algorithm: "dominant" });
      const bg = color.hex || "#FAF6F0";

      const dimensions = await new Promise<{ w: number; h: number }>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
        img.onerror = () => reject(new Error("Failed to read image dimensions"));
        img.src = objectUrl;
      });

      if (dimensions.w < 600 && dimensions.h < 600) {
        toast.error("Image too small. Upload at least 600px wide.");
        setUploadQueue((q) => q.filter((x) => x.id !== fileId));
        return;
      }

      // Default fit vs fill per schema §2.6
      const isPortraitOrSquare = dimensions.h / dimensions.w >= 0.9;
      const defaultFit: "fill" | "fit" = isPortraitOrSquare ? "fit" : "fill";

      // 3. Upload to Firebase Storage
      const orgFolder = organizerId || "admin";
      const storagePath = `organizers/${orgFolder}/events/${fileId}.jpg`;
      const storageRef = ref(storage, storagePath);

      const uploadTask = uploadBytesResumable(storageRef, compressedFile, {
        contentType: "image/jpeg",
        cacheControl: "max-age=31536000",
      });

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadQueue((q) =>
            q.map((x) => (x.id === fileId ? { ...x, progress } : x))
          );
        },
        (err) => {
          console.error("Upload failed:", err);
          toast.error(`Upload failed: ${file.name}`);
          setUploadQueue((q) =>
            q.map((x) =>
              x.id === fileId ? { ...x, status: "failed", error: err.message } : x
            )
          );
        },
        async () => {
          // Upload complete -> Get download URL
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);

          const newEventImage: EventImage = {
            id: fileId,
            path: storagePath,
            sizes: {
              s: downloadUrl,
              m: downloadUrl,
              l: downloadUrl,
            },
            w: dimensions.w,
            h: dimensions.h,
            focalX: 0.5,
            focalY: 0.5,
            fit: defaultFit,
            bg,
            alt: null,
          };

          // Remove from queue and append to images
          setUploadQueue((q) => q.filter((x) => x.id !== fileId));
          onChange([...images, newEventImage]);
          toast.success(
            isPortraitOrSquare
              ? "Poster uploaded — whole image mode enabled"
              : "Image uploaded successfully"
          );
        }
      );
    } catch (err: any) {
      console.error("Processing image failed:", err);
      toast.error(err.message || "Failed to process image");
      setUploadQueue((q) =>
        q.map((x) =>
          x.id === fileId ? { ...x, status: "failed", error: err.message } : x
        )
      );
    }
  };

  // Handle incoming files (multi-upload queue max 3 concurrent)
  const handleFiles = async (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList);
    const availableSlots = 8 - (images.length + uploadQueue.length);

    if (availableSlots <= 0) {
      toast.error("Maximum 8 images allowed per event.");
      return;
    }

    const filesToUpload = incoming.slice(0, availableSlots);
    if (incoming.length > availableSlots) {
      toast.warning(`Only adding ${availableSlots} images (max 8 reached).`);
    }

    // Process files with max concurrency of 3
    const concurrencyLimit = 3;
    const queue = [...filesToUpload];
    const runWorker = async () => {
      while (queue.length > 0) {
        const next = queue.shift();
        if (next) {
          await processAndUploadFile(next);
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrencyLimit, filesToUpload.length) }, () =>
      runWorker()
    );
    await Promise.all(workers);
  };

  // Drag and drop handlers on the entire Images card
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Clipboard paste handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = e.clipboardData.items;
      const files: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) files.push(file);
        }
      }
      if (files.length > 0) {
        toast.info(`Pasted ${files.length} image(s) from clipboard`);
        handleFiles(files);
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [images, uploadQueue]);

  // Reorder images via DND
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newImages = arrayMove(images, oldIndex, newIndex);
        onChange(newImages);
        if (selectedIndex === oldIndex) {
          setSelectedIndex(newIndex);
        }
      }
    }
  };

  // Selected image modifications
  const selectedImage = images[selectedIndex] || null;

  const updateSelectedImage = (updates: Partial<EventImage>) => {
    if (!selectedImage) return;
    const updated = images.map((img, idx) =>
      idx === selectedIndex ? { ...img, ...updates } : img
    );
    onChange(updated);
  };

  const totalSlotsUsed = images.length + uploadQueue.length;

  return (
    <div
      ref={cardRef}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="space-y-6"
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/heic,image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      {/* Grid of Images + Upload Slots */}
      <div className="p-4 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-[var(--color-ink)]">
            Gallery & Cover ({images.length}/8)
          </div>
          <div className="text-xs text-[var(--color-ink-muted)]">
            Drop images here or paste from clipboard (JPEG, PNG, HEIC, WebP ≤ 15MB)
          </div>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex flex-wrap gap-3 items-center">
              {/* Ready Images */}
              {images.map((img, idx) => (
                <SortableTile
                  key={img.id}
                  id={img.id}
                  index={idx}
                  image={img}
                  isSelected={idx === selectedIndex}
                  onSelect={() => setSelectedIndex(idx)}
                  onRemove={() => {
                    const next = images.filter((_, i) => i !== idx);
                    onChange(next);
                  }}
                  onSetCover={() => {
                    if (idx === 0) return;
                    const next = arrayMove(images, idx, 0);
                    onChange(next);
                    setSelectedIndex(0);
                  }}
                />
              ))}

              {/* Uploading/Failed Items */}
              {uploadQueue.map((item) => (
                <div
                  key={item.id}
                  className="w-[120px] h-[120px] rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-border-subtle)]"
                >
                  <SortableTile
                    id={item.id}
                    index={-1}
                    uploadingItem={item}
                    isSelected={false}
                    onSelect={() => {}}
                    onRemove={() => {
                      setUploadQueue((q) => q.filter((x) => x.id !== item.id));
                    }}
                    onSetCover={() => {}}
                    onRetry={() => {
                      setUploadQueue((q) => q.filter((x) => x.id !== item.id));
                      processAndUploadFile(item.file);
                    }}
                  />
                </div>
              ))}

              {/* Add Tile Button */}
              {totalSlotsUsed < 8 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-[120px] h-[120px] rounded-[var(--radius-md)] border-2 border-dashed border-[var(--color-border-strong)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-subtle)] transition-colors flex flex-col items-center justify-center text-[var(--color-ink-muted)] hover:text-[var(--color-accent)] group"
                >
                  <Plus className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-semibold">Add image</span>
                </button>
              )}
            </div>
          </SortableContext>
        </DndContext>

        {error && <p className="text-xs text-[var(--color-crimson)] mt-1">{error}</p>}
      </div>

      {/* Inline Editor for Selected Image */}
      {selectedImage ? (
        <div className="p-5 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-[var(--color-ink)]">
                Selected: IMG {selectedIndex + 1}
              </span>
              {selectedIndex === 0 && (
                <span className="text-[10px] bg-[var(--color-accent)] text-white font-bold px-1.5 py-0.5 rounded tracking-wider">
                  COVER
                </span>
              )}
            </div>
            <span className="text-xs text-[var(--color-ink-muted)]">
              {selectedImage.w} × {selectedImage.h} px · Dominant:{" "}
              <span
                className="inline-block w-3 h-3 rounded-full border align-middle ml-1"
                style={{ backgroundColor: selectedImage.bg }}
              />{" "}
              {selectedImage.bg}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Focal Point Picker */}
            <div className="lg:col-span-6 space-y-2">
              <div className="text-xs font-semibold text-[var(--color-ink)] flex items-center justify-between">
                <span>Focal Point Picker</span>
                <span className="text-[11px] font-normal text-[var(--color-ink-muted)]">
                  {selectedImage.fit === "fill"
                    ? "Drag crosshair to position crop"
                    : "Letterboxed in fit mode"}
                </span>
              </div>

              <FocalPicker
                image={selectedImage}
                onChange={updateSelectedImage}
                className="w-full"
              />
            </div>

            {/* Right: Mode, Previews, Alt */}
            <div className="lg:col-span-6 space-y-5">
              {/* Display Mode Selection */}
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-muted)] block mb-2">
                  Display Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateSelectedImage({ fit: "fill" })}
                    className={`p-3 rounded-[var(--radius-md)] border text-left transition-all ${
                      selectedImage.fit === "fill"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] ring-1 ring-[var(--color-accent)]"
                        : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--color-ink)] mb-0.5">
                      Fill frame
                    </div>
                    <div className="text-[11px] text-[var(--color-ink-muted)] leading-tight">
                      Crops to each shape. Keep what matters in frame.
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateSelectedImage({ fit: "fit" })}
                    className={`p-3 rounded-[var(--radius-md)] border text-left transition-all ${
                      selectedImage.fit === "fit"
                        ? "border-[var(--color-accent)] bg-[var(--color-accent-subtle)] ring-1 ring-[var(--color-accent)]"
                        : "border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] bg-[var(--color-surface)]"
                    }`}
                  >
                    <div className="text-xs font-bold text-[var(--color-ink)] mb-0.5">
                      Show whole image
                    </div>
                    <div className="text-[11px] text-[var(--color-ink-muted)] leading-tight">
                      Shows full image with letterbox. Best for posters with text.
                    </div>
                  </button>
                </div>
              </div>

              {/* Live Previews */}
              <PreviewFrames image={selectedImage} />

              {/* Alt Text */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-[var(--color-ink)]">
                    Description (Alt Text)
                  </label>
                  <span className="text-[10px] text-[var(--color-ink-muted)]">
                    {(selectedImage.alt || "").length}/200
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={200}
                  placeholder="Describe the image for screen readers (optional)"
                  value={selectedImage.alt || ""}
                  onChange={(e) => updateSelectedImage({ alt: e.target.value || null })}
                  className="w-full text-xs px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]"
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-muted)]">
          <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--color-ink-faint)]" />
          <p className="text-sm font-semibold">No images uploaded yet</p>
          <p className="text-xs mt-1">Upload at least 1 image to serve as the event cover.</p>
        </div>
      )}
    </div>
  );
}
export default ImageManager;
