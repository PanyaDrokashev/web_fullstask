"use client";

import { FormEvent, useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";

import Container from "@/components/Layout/Container";
import { getFirebaseAuth } from "@/shared/firebase/client";

export default function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const completeLogin = async (idToken: string) => {
    const response = await fetch("/api/admin-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(payload.error ?? "Не удалось выполнить вход");
    }

    const payload = (await response.json()) as { role?: string };
    window.location.href = payload.role?.toLowerCase() === "admin" ? "/admin" : "/";
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      const creds = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await creds.user.getIdToken();
      await completeLogin(idToken);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось выполнить вход");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setIsLoading(true);
    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const creds = await signInWithPopup(auth, provider);
      const idToken = await creds.user.getIdToken();
      await completeLogin(idToken);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Не удалось выполнить вход через Google");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16">
      <Container>
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-[#00000010] p-8 shadow">
          <h1 className="text-2xl font-semibold text-dark mb-6">Вход в аккаунт</h1>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              value={email}
              onValueChange={(v) => {
                setEmail(v);
                setError("");
              }}
              label="Email"
              placeholder="Введите email"
              type="email"
              required
            />
            <Input
              value={password}
              onValueChange={(v) => {
                setPassword(v);
                setError("");
              }}
              label="Пароль"
              placeholder="Введите пароль"
              type="password"
              required
            />
            {error ? <p className="text-red-600 text-sm">{error}</p> : null}
            <Button className="text-white" color="secondary" type="submit" isLoading={isLoading}>
              Войти по Email
            </Button>
            <Button variant="bordered" type="button" onPress={handleGoogleLogin} isLoading={isLoading}>
              Войти через Google
            </Button>
            <a href="/register" className="text-sm text-[#505050] underline text-center">
              Нет аккаунта? Зарегистрироваться
            </a>
          </form>
        </div>
      </Container>
    </section>
  );
}
