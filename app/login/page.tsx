"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Lecturer login state
  const [lectureCode, setLectureCode] = useState("");

  // Admin login state
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleLecturerLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("lecturer", {
        code: lectureCode,
        redirect: true,
        callbackUrl: "/",
      });

      if (result?.error) {
        setError("Invalid lecture code");
        setLoading(false);
      } else if (result?.ok) {
        setTimeout(() => {
          router.push("/");
        }, 100);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signIn("admin", {
        username: adminUsername,
        password: adminPassword,
        redirect: true,
        callbackUrl: "/admin",
      });

      if (result?.error) {
        setError("Invalid username or password");
        setLoading(false);
      } else if (result?.ok) {
        setTimeout(() => {
          router.push("/admin");
        }, 100);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-2xl border-2">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Grading System
          </CardTitle>
          <CardDescription>Sign in to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="lecturer" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="lecturer" className="gap-2">
                <Users className="h-4 w-4" />
                Lecturer
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2">
                <Shield className="h-4 w-4" />
                Admin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="lecturer">
              <form onSubmit={handleLecturerLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="lectureCode">Lecture Code</Label>
                  <Input
                    id="lectureCode"
                    type="text"
                    placeholder="Enter your lecture code"
                    value={lectureCode}
                    onChange={(e) => setLectureCode(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in as Lecturer"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="admin">
              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="adminUsername">Username</Label>
                  <Input
                    id="adminUsername"
                    type="text"
                    placeholder="Enter username"
                    value={adminUsername}
                    onChange={(e) => setAdminUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adminPassword">Password</Label>
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="Enter password"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign in as Admin"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t text-center text-sm text-muted-foreground">
            <p>Students: Use the invitation link provided by your admin</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
