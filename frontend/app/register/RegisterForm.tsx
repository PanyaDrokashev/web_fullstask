"use client";

import { FormEvent, useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { GoogleAuthProvider, createUserWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";

import Container from "@/components/Layout/Container";
import { getFirebaseAuth } from "@/shared/firebase/client";

function mapFirebaseError(message: string): string {
  if (message.includes("email-already-in-use")) {
    return "Пользователь с таким email уже существует";
  }
  if (message.includes("invalid-email")) {
    return "Некорректный email";
  }
  if (message.includes("weak-password")) {
    return "Слишком простой пароль (минимум 6 символов)";
  }
  return "Не удалось зарегистрироваться";
}

export default function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      throw new Error(payload.error ?? "Не удалось выполнить вход после регистрации");
    }

    const payload = (await response.json()) as { role?: string };
    window.location.href = payload.role?.toLowerCase() === "admin" ? "/admin" : "/";
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      const credentials = await createUserWithEmailAndPassword(auth, email, password);
      if (name.trim()) {
        await updateProfile(credentials.user, { displayName: name.trim() });
      }

      const idToken = await credentials.user.getIdToken(true);
      await completeLogin(idToken);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      setError(mapFirebaseError(message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError("");
    setIsLoading(true);

    try {
      const auth = getFirebaseAuth();
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credentials = await signInWithPopup(auth, provider);
      const idToken = await credentials.user.getIdToken(true);
      await completeLogin(idToken);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "";
      setError(mapFirebaseError(message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-16">
      <Container>
        <div className="max-w-md mx-auto bg-white rounded-3xl border border-[#00000010] p-8 shadow">
          <h1 className="text-2xl font-semibold text-dark mb-6">Регистрация</h1>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <Input
              value={name}
              onValueChange={(v) => {
                setName(v);
                setError("");
              }}
              label="Имя"
              placeholder="Введите имя"
            />
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
              placeholder="Минимум 6 символов"
              type="password"
              required
            />
            <Input
              value={confirmPassword}
              onValueChange={(v) => {
                setConfirmPassword(v);
                setError("");
              }}
              label="Повтор пароля"
              placeholder="Повторите пароль"
              type="password"
              required
            />

            {error ? <p className="text-red-600 text-sm">{error}</p> : null}

            <Button className="text-white" color="secondary" type="submit" isLoading={isLoading}>
              Зарегистрироваться
            </Button>
            <Button variant="bordered" type="button" onPress={handleGoogleRegister} isLoading={isLoading}>
              Регистрация через Google
            </Button>

            <a href="/login" className="text-sm text-[#505050] underline text-center">
              Уже есть аккаунт? Войти
            </a>
          </form>
        </div>
      </Container>
    </section>
  );
}
