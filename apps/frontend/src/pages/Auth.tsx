import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import {
  AlertCircleIcon,
  Loader2,
} from "lucide-react";

import { signup, signin } from "@/services/auth";
import { getOrganizations } from "@/services/organizations";

type AuthMode = "signin" | "signup";

interface AuthProps {
  mode: AuthMode;
}

export function Auth({ mode }: AuthProps) {
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const isSignIn = mode === "signin";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    try {
      let data;

      if (isSignIn) {
        data = await signin(email, password);
      } else {
        data = await signup(
          username,
          email,
          password
        );
      }

      // Store authentication token
      localStorage.setItem("token", data.token);

      // Store authenticated user in AuthContext
      setUser(data.user);

      // Check user's organizations
      const organizations = await getOrganizations();

      if (organizations.length === 0) {
        navigate("/create-organization");
      } else {
        navigate("/dashboard");
      }

    } catch (error) {
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md rounded-xl border bg-background p-8 shadow-sm">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">
            {isSignIn
              ? "Welcome back"
              : "Create an account"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            {isSignIn
              ? "Sign in to your account"
              : "Create your account to get started"}
          </p>
        </div>

        {/* Error */}
        {error && (
          <Alert
            variant="destructive"
            className="mb-6"
          >
            <AlertCircleIcon />

            <AlertTitle>
              {isSignIn
                ? "Sign in failed"
                : "Sign up failed"}
            </AlertTitle>

            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <FieldGroup>

            {!isSignIn && (
              <Field>
                <FieldLabel htmlFor="username">
                  Name
                </FieldLabel>

                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your name"
                  value={username}
                  onChange={(e) =>
                    setUsername(e.target.value)
                  }
                  disabled={loading}
                  required
                />
              </Field>
            )}

            <Field>
              <FieldLabel htmlFor="email">
                Email
              </FieldLabel>

              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                disabled={loading}
                required
              />

              <FieldDescription>
                We'll use this email for your account.
              </FieldDescription>
            </Field>

            <Field>
              <FieldLabel htmlFor="password">
                Password
              </FieldLabel>

              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                disabled={loading}
                required
              />
            </Field>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Please wait...
                </>
              ) : (
                isSignIn
                  ? "Sign In"
                  : "Sign Up"
              )}
            </Button>

          </FieldGroup>
        </form>

        {/* Bottom link */}
        <p className="mt-6 text-center text-sm text-muted-foreground">

          {isSignIn ? (
            <>
              Don't have an account?{" "}

              <button
                type="button"
                onClick={() =>
                  navigate("/signup")
                }
                className="font-medium text-primary hover:underline"
              >
                Sign Up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}

              <button
                type="button"
                onClick={() =>
                  navigate("/signin")
                }
                className="font-medium text-primary hover:underline"
              >
                Sign In
              </button>
            </>
          )}

        </p>

      </div>
    </div>
  );
}