import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { registerUserByGraphQL } from "@/shared/api/graphql-users";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const role = cookieStore.get("bruska_role")?.value ?? "";
  if (role.toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  try {
    const user = await registerUserByGraphQL({
      name: body.name ?? "",
      email: body.email ?? "",
      password: body.password ?? "",
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Не удалось зарегистрировать пользователя",
      },
      { status: 400 },
    );
  }
}
