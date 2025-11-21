// src/lib/apollo.ts
import { ApolloClient, InMemoryCache, HttpLink } from "@apollo/client";

export const apolloClient = new ApolloClient({
    link: new HttpLink({
        uri: "/graphql",        // same-origin; Vite dev should proxy /graphql -> backend:4000
        credentials: "include", // send cookies for your auth
    }),
    cache: new InMemoryCache(),
});
