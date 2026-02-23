/*
 * Design: Warm Craft — Premium Food-Tech Aesthetic
 * Login page: Warm gradient background, centered frosted card
 * Amber-orange accent, Plus Jakarta Sans
 */
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, UtensilsCrossed } from "lucide-react";
import { useLocation } from "wouter";

const LOGIN_HERO_URL = "https://private-us-east-1.manuscdn.com/sessionFile/HpU7xop10LO54a7ywm8mXF/sandbox/ySfWRC7P7dIqWJXfcTJbTO-img-1_1771752429000_na1fn_bG9naW4taGVybw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvSHBVN3hvcDEwTE81NGE3eXdtOG1YRi9zYW5kYm94L3lTZldSQzdQN2RJcVdKWGZjVEpiVE8taW1nLTFfMTc3MTc1MjQyOTAwMF9uYTFmbl9iRzluYVc0dGFHVnlidy5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=hfkqQzM9tE5rCaqYxcK0UgX-23LiBaIC~2gtPplS4c1t7Ng4MFsqzx45LbX7nuZtXXtnx2ht3byMCQ13QSSJ0CQ0XZWxWD-bjzr-d4Klr6BNhAnZSlE1jdrEQ5dxh5Rnlb189~XQlcECeFEakE1IqekbBaAUqyTMI-GluwmXXf2VSTuxVviqDMYBiWqkZVqUi-JQAbVb4ZF7LzNfLj0li28EJNnkXe45JSw9N-prz0aSw8QzsCP9ZMtOGePvro9toPTG0F0JmuqnaJTGV0h37qbePxa9Pfk2N8xEBXhfP3Nv8ZpYixlpiDX7cLbIQgFQeo~m-IvzK6BgFdE7~3dgUg__";

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      setLocation("/");
    } catch (err: any) {
      setError(err.message?.includes("invalid") ? "Invalid email or password" : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row relative overflow-hidden">
      {/* Warm gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/8" />
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
        backgroundSize: '32px 32px'
      }} />

      {/* Hero section — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 items-center justify-center p-12 relative">
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md">
          <div className="relative">
            <div className="absolute -inset-8 bg-primary/5 rounded-3xl blur-2xl" />
            <img
              src={LOGIN_HERO_URL}
              alt="Cafe counter illustration"
              className="relative w-full max-w-sm rounded-2xl shadow-warm-xl"
            />
          </div>
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              Manage orders with ease
            </h2>
            <p className="text-muted-foreground leading-relaxed text-[0.9375rem]">
              A fast, clean order-taking tool built for food and beverage businesses.
            </p>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <Card className="w-full max-w-[26rem] border border-border/60 shadow-warm-xl bg-card/80 backdrop-blur-sm rounded-2xl">
          <CardHeader className="space-y-2 pb-6 px-7 pt-8">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                <UtensilsCrossed className="w-5.5 h-5.5 text-primary" />
              </div>
              <span className="text-xl font-bold tracking-tight">Order Taker</span>
            </div>
            <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
            <CardDescription className="text-[0.875rem]">Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent className="px-7 pb-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[0.8125rem] font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 rounded-xl text-[0.9375rem] px-4"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[0.8125rem] font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl text-[0.9375rem] px-4"
                />
              </div>
              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full h-12 rounded-xl text-[0.9375rem] font-semibold shadow-warm-sm hover:shadow-warm transition-all duration-200" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
