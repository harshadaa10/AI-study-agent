"use client";
import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type UserProfile = {
  id: string;
  full_name: string;
  avatar_url: string;
};

export default function ProfilePage() {
  const supabase = useMemo(() => createBrowserSupabase(), []);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);                                 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
  // Get logged-in user
  const {
    data: { user },
  } = await supabase.auth.getUser();
const router = useRouter();
  if (!user) {
    router.replace("/login");
    return;
  }

  // Fetch profile from API
  const res = await fetch(`/api/user/profile?userId=${user.id}`);
  const data = await res.json();

  console.log("GET status:", res.status);
  console.log("GET response:", data);

  if (data.profile) {
    // Existing profile
    setProfile(data.profile);
    setName(data.profile.full_name ?? "");
    setEmail(data.profile.avatar_url ?? "");
  } else {
    // No profile yet → create local state
    setProfile({
      id: user.id,
      full_name: "",
      avatar_url: "",
    });

    setName("");
    setEmail("");
  }

  setLoading(false);
};

    fetchProfile();
  }, [supabase]);
 if (loading) {
  return (
  <Card>
    <CardContent className="py-10 text-center">
      Loading profile...
    </CardContent>
  </Card>
);
}
 const handleUpdate = async () => {
  if (!profile?.id) {
    alert("Profile not loaded.");
    return;
  }

  try {
    console.log("Sending:", {
      userId: profile.id,
      full_name: name,
      avatar_url: email,
    });

    const res = await fetch("/api/user/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: profile.id,
        full_name: name,
        avatar_url: email,
      }),
    });

    const result = await res.json();

    console.log(result);

    if (!res.ok) {
      alert(result.error);
      return;
    }

    setProfile(result.profile);
    alert("Profile updated successfully!");
  } catch (err) {
    console.error(err);
    alert("Something went wrong.");
  }
};

  return (
    <main className="min-h-screen bg-[#f7f3ec] px-6 py-8 text-[#17201a]">
      <section className="mx-auto max-w-2xl space-y-6">
        <h1 className="text-3xl font-semibold">Profile</h1>

        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <label className="text-sm">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm">Email</label>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <Button onClick={handleUpdate}>
              Save Changes
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Information</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>User ID: {profile?.id}</p>
            <p>Full Name: {profile?.full_name}</p>
            <p>Email: {profile?.avatar_url}</p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}