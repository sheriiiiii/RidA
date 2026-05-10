"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import Image from "next/image";
import { RIDA_PROTOTYPE_MODE, signInPrototypeAdmin } from "@/lib/prototype";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (RIDA_PROTOTYPE_MODE) {
        signInPrototypeAdmin();
        window.location.href = "/admin/dashboard";
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        window.location.href = "/admin/dashboard";
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rida-map-soft flex min-h-screen items-center justify-center p-4">
      <div className="rida-card flex w-full max-w-4xl overflow-hidden rounded-[2rem]">
        <div className="rida-map-panel relative hidden w-2/5 items-center justify-center md:flex">

          <Image
            src="/assets/rida-dashboard-logo.png"
            alt="Logo"
            width={352} // 88 * 4 (tailwind unit)
            height={176} // match aspect ratio
            className="z-10 h-auto w-72 object-contain mix-blend-screen"
            priority
          />
        </div>

        <div className="flex w-full flex-col justify-center p-8 md:w-3/5 md:p-12">
          <form
            onSubmit={handleSubmit}
            className="max-w-sm mx-auto w-full space-y-8"
          >
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome Back, Cashier/Admin
              </h1>
              <p className="text-gray-500 text-sm">
                <strong>RidA. Smarter rides, fewer hassles.</strong>
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-gray-700"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-200 placeholder:text-blue-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 h-4 w-4" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-12 border-gray-200 placeholder:text-blue-300 focus:border-blue-500 focus:ring-blue-500"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember me & Forgot */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) =>
                    setRememberMe(checked as boolean)
                  }
                  className="border-gray-400 data-[state=checked]:bg-slate-800 data-[state=checked]:border-slate-800 h-4 w-4"
                  disabled={loading}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm text-gray-700 cursor-pointer"
                >
                  Remember me
                </Label>
              </div>
              <Link
                href="#"
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit */}
            <div className="flex justify-center mt-6">
              <Button
                type="submit"
                className="rida-button h-12 w-[220px] rounded-full text-base font-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </div>

            <div className="text-center pt-6">
              <p className="text-xs text-gray-500">
                All rights reserved 2026
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
