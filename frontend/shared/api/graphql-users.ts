import { getBackendApiBaseUrl } from "@/shared/api/base-url";
import { IUser } from "@/shared/types/content";

const API_BASE_URL = getBackendApiBaseUrl();

interface GraphQLError {
  message?: string;
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

async function fetchGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${API_BASE_URL}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({ query, variables }),
  });

  const payload = (await response.json()) as GraphQLResponse<T>;

  if (!response.ok) {
    throw new Error(payload.errors?.[0]?.message ?? `GraphQL request failed (${response.status})`);
  }

  if (payload.errors?.length) {
    throw new Error(payload.errors[0]?.message ?? "GraphQL request failed");
  }

  if (!payload.data) {
    throw new Error("GraphQL response has no data");
  }

  return payload.data;
}

export async function registerUserByGraphQL(input: {
  name: string;
  email: string;
  password: string;
}): Promise<IUser> {
  const data = await fetchGraphQL<{ registerUser: IUser }>(
    `
      mutation RegisterUser($input: RegisterUserInput!) {
        registerUser(input: $input) {
          id
          name
          login
          email
          role
        }
      }
    `,
    { input },
  );

  return data.registerUser;
}

export async function loginUserByGraphQL(input: {
  loginOrEmail: string;
  password: string;
}): Promise<{ authorized: boolean; user?: IUser }> {
  const data = await fetchGraphQL<{
    loginUser: {
      authorized: boolean;
      user?: IUser;
    };
  }>(
    `
      mutation LoginUser($input: LoginInput!) {
        loginUser(input: $input) {
          authorized
          user {
            id
            name
            login
            email
            role
          }
        }
      }
    `,
    { input },
  );

  return data.loginUser;
}
