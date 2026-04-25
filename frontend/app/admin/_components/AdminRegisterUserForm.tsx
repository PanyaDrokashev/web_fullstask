"use client";

import { FormEvent, useState } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";

import { IUser } from "@/shared/types/content";

export default function AdminRegisterUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [createdUser, setCreatedUser] = useState<IUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");
    setCreatedUser(null);

    try {
      const response = await fetch("/api/users/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const payload = (await response.json()) as {
        user?: IUser;
        error?: string;
      };

      if (!response.ok || !payload.user) {
        setError(payload.error ?? "Не удалось зарегистрировать пользователя");
        return;
      }

      setCreatedUser(payload.user);
      setName("");
      setEmail("");
      setPassword("");
    } catch {
      setError("Не удалось зарегистрировать пользователя");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article className="rounded-3xl border border-[#00000010] bg-white p-6 shadow">
      <h2 className="text-2xl font-semibold text-dark mb-3">Регистрация пользователя</h2>
      <p className="text-[#404040] mb-5">
        Заглушечная форма для создания пользователя через GraphQL.
      </p>

      <form className="grid gap-4" onSubmit={handleSubmit}>
        <Input
          label="Имя"
          placeholder="Иван"
          value={name}
          onValueChange={(v) => {
            setName(v);
            setError("");
          }}
          required
        />
        <Input
          label="Почта"
          placeholder="ivan@example.com"
          type="email"
          value={email}
          onValueChange={(v) => {
            setEmail(v);
            setError("");
          }}
          required
        />
        <Input
          label="Пароль"
          placeholder="Минимум 4 символа"
          type="password"
          value={password}
          onValueChange={(v) => {
            setPassword(v);
            setError("");
          }}
          required
        />
        <Button className="text-white" color="secondary" type="submit" isLoading={isSubmitting}>
          Зарегистрировать
        </Button>
      </form>

      {error ? (
        <p className="mt-4 rounded-xl border border-[#d82525] bg-[#fff2f2] px-4 py-3 text-sm text-[#b51717]">
          {error}
        </p>
      ) : null}

      {createdUser ? (
        <p className="mt-4 rounded-xl border border-[#208b3a] bg-[#f0fff4] px-4 py-3 text-sm text-[#166534]">
          Пользователь создан. Логин для входа: <b>{createdUser.login}</b>
        </p>
      ) : null}
    </article>
  );
}
