import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_HASURA_ENDPOINT || "http://localhost:8080/v1/graphql",
});

const authLink = setContext((_, { headers }) => {
  // Get the token from local storage or cookie
  // Since this is for the client side, we might use a cookie accessor
  // OR we can pass the token manually if needed.
  // For simplicity, we'll assume the token is stored in a cookie.
  const getCookie = (name: string) => {
    if (typeof document === 'undefined') return '';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return '';
  };

  const token = getCookie('auth-token');
  const adminSecret = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET;

  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
      ...(adminSecret ? { 'x-hasura-admin-secret': adminSecret } : {}),
    },
  };
});

export const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});
