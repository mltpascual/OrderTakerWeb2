/*
 * Design: Swiss Utility — Functional Minimalism
 * Login page: Split layout on desktop (hero left, form right), stacked on mobile
 * Teal accent (#0D9488), DM Sans headings, Inter body
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
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Hero section — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 bg-muted items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10" />
        <div className="relative z-10 flex flex-col items-center gap-8 max-w-md">
          <img
            src={LOGIN_HERO_URL}
            alt="Cafe counter illustration"
            className="w-full max-w-sm rounded-lg"
          />
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold text-foreground tracking-tight">
              Manage orders with ease
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              A fast, clean order-taking tool built for food and beverage businesses.
            </p>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <Card className="w-full max-w-sm border-0 shadow-none lg:shadow-sm lg:border">
          <CardHeader className="space-y-2 pb-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Order Taker</span>
            </div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive font-medium">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
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
