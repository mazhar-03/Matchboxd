"use client";

import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/app/components/ui/use-toast";
import UserAvatar from "@/app/components/UserAvatar";

const profileSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const { toast } = useToast();

  const { register, handleSubmit } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: session?.user?.username || "",
      email: session?.user?.email || "",
    },
  });

  const handleAvatarUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Call your API endpoint here
      const response = await fetch("/api/upload-avatar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        await update({ image: data.url });
        toast({ title: "Avatar updated successfully!" });
      }
    } catch (error) {
      toast({ title: "Error uploading avatar", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <h2 className="text-lg font-semibold mb-4">Profile Picture</h2>
          <UserAvatar
            profileImageUrl={session?.user?.image}
            username={session?.user?.username}
            onUpload={handleAvatarUpload}  // Now properly typed
            className="w-24 h-24"
          />
        </div>

        <div className="md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          <form onSubmit={handleSubmit((data) => console.log(data))} className="space-y-4">
            <div>
              <label className="block mb-1">Username</label>
              <input
                {...register("username")}
                className="w-full p-2 border rounded"
              />
            </div>

            <div>
              <label className="block mb-1">Email</label>
              <input
                type="email"
                {...register("email")}
                className="w-full p-2 border rounded"
              />
            </div>

            <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
              Save Changes
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}