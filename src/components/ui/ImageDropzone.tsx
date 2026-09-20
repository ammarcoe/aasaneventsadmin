"use client";

import React, { useState, useRef } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import imageCompression from "browser-image-compression";
import { Upload, X, Check, Image as ImageIcon, Crop as CropIcon } from "lucide-react";
import { Button } from "./Button";

export interface ImageDropzoneProps {
  value?: string | null;
  onChange: (fileOrUrl: Blob | string) => Promise<void> | void;
  aspectRatio?: number; // e.g. 16/9
  disabled?: boolean;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageDropzone({
  value,
  onChange,
  aspectRatio = 16 / 9,
  disabled = false,
}: ImageDropzoneProps) {
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropping, setIsCropping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return;
    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );
  }, [completedCrop]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setSelectedFileUrl(reader.result?.toString() || "");
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, aspectRatio));
  };

  const getCroppedImg = async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) return null;

    const canvas = document.createElement("canvas");
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  };

  const handleConfirmCrop = async () => {
    try {
      setIsProcessing(true);
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        setIsProcessing(false);
        return;
      }

      // Compress to under 500KB
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(croppedBlob as File, options);
      await onChange(compressedFile);
      setIsCropping(false);
      setSelectedFileUrl(null);
    } catch (err) {
      console.error("Error processing image crop & compression:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSelectFile}
        className="hidden"
        disabled={disabled}
      />

      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-border bg-surface aspect-video w-full flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value}
            alt="Event banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-ink/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
            >
              <CropIcon className="w-3.5 h-3.5" />
              Replace Image
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => onChange("")}
              disabled={disabled}
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`border-2 border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-surface hover:bg-surface-subtle aspect-video w-full ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <div className="p-3 bg-surface-subtle rounded-full border border-border text-ink-muted mb-2">
            <Upload className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-ink">
            Upload banner image
          </span>
          <span className="text-xs text-ink-muted mt-0.5">
            16:9 ratio, auto-cropped and compressed to &lt;500KB
          </span>
        </div>
      )}

      {/* Cropping Modal */}
      {isCropping && selectedFileUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-surface border border-border rounded-lg p-5 max-w-xl w-full flex flex-col gap-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h4 className="text-base font-semibold text-ink flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-accent" />
                Crop 16:9 Banner
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsCropping(false);
                  setSelectedFileUrl(null);
                }}
                className="text-ink-faint hover:text-ink"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-auto flex items-center justify-center bg-surface-subtle p-2 rounded-md">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={selectedFileUrl}
                  alt="Crop source"
                  onLoad={onImageLoad}
                  className="max-h-[45vh] object-contain"
                />
              </ReactCrop>
            </div>

            {/* Dual-surface Live Preview */}
            <div className="p-3 bg-surface-subtle border border-border rounded-lg flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-[11px] font-bold text-ink uppercase tracking-wider">
                  Live Surface Preview
                </span>
                <span className="text-[10px] text-ink-muted">
                  How this crop renders across the app
                </span>
              </div>
              <div className="w-[140px] h-[70px] rounded-md border border-border bg-surface overflow-hidden shrink-0 shadow-xs flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsCropping(false);
                  setSelectedFileUrl(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                isLoading={isProcessing}
                onClick={handleConfirmCrop}
              >
                <Check className="w-4 h-4" />
                Apply & Compress
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
