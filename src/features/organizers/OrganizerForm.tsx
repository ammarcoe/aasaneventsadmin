"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { organizerSchema, OrganizerFormValues } from "./schema";
import { createOrganizer, updateOrganizer, uploadOrganizerAvatar } from "./api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { normalizePakistanPhone } from "@/lib/utils";
import { LinkAccountModal } from "./LinkAccountModal";
import type { Organizer } from "@/types";
import { ArrowLeft, Save, Upload, Link as LinkIcon, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export interface OrganizerFormProps {
  initialData?: Organizer | null;
}

export function OrganizerForm({ initialData }: OrganizerFormProps) {
  const router = useRouter();
  const isEditing = Boolean(initialData?.id);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isLinkingOpen, setIsLinkingOpen] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<OrganizerFormValues>({
    resolver: zodResolver(organizerSchema),
    defaultValues: {
      name: initialData?.name || "",
      email: initialData?.email || "",
      phone: initialData?.phone || "",
      avatarUrl: initialData?.avatarUrl || null,
      bio: initialData?.bio || "",
      linkedUserId: initialData?.linkedUserId || null,
      linkedUserEmail: initialData?.linkedUserEmail || null,
      status: initialData?.status || "active",
    },
  });

  const currentAvatarUrl = watch("avatarUrl");
  const currentName = watch("name");
  const currentLinkedUserEmail = watch("linkedUserEmail");
  const currentPhone = watch("phone");

  const handlePhoneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const normalized = normalizePakistanPhone(e.target.value);
    setValue("phone", normalized, { shouldValidate: true });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      try {
        setIsUploadingAvatar(true);
        const tempId = initialData?.id || `temp_${Date.now()}`;
        const downloadUrl = await uploadOrganizerAvatar(tempId, file);
        setValue("avatarUrl", downloadUrl, { shouldValidate: true });
        toast.success("Avatar uploaded successfully");
      } catch (err) {
        console.error("Avatar upload failed:", err);
        toast.error("Failed to upload avatar image.");
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const onSubmit = async (values: OrganizerFormValues) => {
    try {
      if (isEditing && initialData) {
        await updateOrganizer(initialData.id, values, initialData.name);
        toast.success("Organizer updated successfully");
      } else {
        const newId = await createOrganizer(values);
        toast.success("Organizer created successfully");
        router.push(`/organizers/${newId}`);
        return;
      }
      router.push("/organizers");
    } catch (err) {
      console.error("Error saving organizer:", err);
      toast.error("Failed to save organizer. Please verify permissions.");
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <Link
          href="/organizers"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Organizers
        </Link>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <Card variant="default">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Organizer" : "New Organizer"}</CardTitle>
            <CardDescription>
              Organizers host events and manage registrations through the mobile app.
            </CardDescription>
          </CardHeader>

          <div className="flex flex-col gap-6">
            {/* Avatar Row */}
            <div className="flex items-center gap-5 p-4 rounded-lg bg-surface-subtle border border-border">
              <Avatar src={currentAvatarUrl} name={currentName || "Org"} size="lg" />
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-ink uppercase tracking-wide">
                  Organizer Logo / Avatar
                </span>
                <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-surface border border-border hover:bg-control text-xs font-medium text-ink cursor-pointer transition-colors w-fit">
                  <Upload className="w-3.5 h-3.5 text-accent-deep" />
                  <span>{isUploadingAvatar ? "Uploading..." : "Upload Image"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                    disabled={isUploadingAvatar}
                  />
                </label>
                <span className="text-[11px] text-ink-faint">
                  Recommended: Square 400×400 JPG or PNG
                </span>
              </div>
            </div>

            {/* Name and Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Organizer Name"
                placeholder="e.g. Islamabad Cultural Society"
                {...register("name")}
                error={errors.name?.message}
                required
              />

              <Input
                type="email"
                label="Contact Email"
                placeholder="contact@org.pk"
                {...register("email")}
                error={errors.email?.message}
                required
              />
            </div>

            {/* Phone with Auto-normalization */}
            <div>
              <Input
                label="Mobile Phone (Pakistan)"
                placeholder="0300 1234567 or +923001234567"
                {...register("phone")}
                onBlur={handlePhoneBlur}
                error={errors.phone?.message}
                helperText={`Normalized: ${normalizePakistanPhone(currentPhone) || "+92..."}`}
                required
              />
            </div>

            {/* Bio */}
            <Textarea
              label="Bio / Description"
              placeholder="Tell attendees about this organization..."
              rows={4}
              maxLength={1000}
              currentLength={watch("bio")?.length || 0}
              {...register("bio")}
              error={errors.bio?.message}
            />

            {/* App Account Linking Section */}
            <div className="p-4 rounded-lg bg-surface-subtle border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-ink uppercase tracking-wide">
                  Mobile App Account
                </span>
                <span className="text-xs text-ink-muted mt-0.5">
                  {currentLinkedUserEmail ? (
                    <span className="flex items-center gap-1 text-accent-deep font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Linked to: <code className="font-mono">{currentLinkedUserEmail}</code>
                    </span>
                  ) : (
                    "Not currently linked to any mobile app user account."
                  )}
                </span>
              </div>

              {isEditing ? (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsLinkingOpen(true)}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  {currentLinkedUserEmail ? "Change Account" : "Link Account"}
                </Button>
              ) : (
                <span className="text-[11px] text-ink-faint italic">
                  Save organizer first to link an app account
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link href="/organizers">
            <Button type="button" variant="secondary">
              Cancel
            </Button>
          </Link>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            <Save className="w-4 h-4" />
            {isEditing ? "Save Changes" : "Create Organizer"}
          </Button>
        </div>
      </form>

      {/* Account Linking Modal */}
      {isEditing && initialData && (
        <LinkAccountModal
          isOpen={isLinkingOpen}
          onClose={() => setIsLinkingOpen(false)}
          organizerId={initialData.id}
          organizerName={initialData.name}
          onLinked={async (userId, userEmail) => {
            setValue("linkedUserId", userId);
            setValue("linkedUserEmail", userEmail);
            await updateOrganizer(initialData.id, {
              linkedUserId: userId,
              linkedUserEmail: userEmail,
            });
          }}
        />
      )}
    </div>
  );
}
