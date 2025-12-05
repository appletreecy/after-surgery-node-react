// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import {
    ApolloClient,
    InMemoryCache,
    HttpLink,
    ApolloProvider,
} from "@apollo/client";

import App from "./App";
import "./styles/index.css";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Records from "./pages/Records";
// @ts-ignore
import NotFound from "./pages/NotFound.tsx";
import TableOne from "@/pages/TableOne";
import TableTwo from "@/pages/TableTwo";
import TableThree from "@/pages/TableThree";
import TableFour from "@/pages/TableFour";
import TableFive from "@/pages/tableFive";
import TableJoined from "@/pages/TableJoined";
import TableOneMonthly from "@/pages/TableOneMonthly";
import TableTwoMonthly from "@/pages/TableTwoMonthly";
import TableThreeMonthly from "@/pages/TableThreeMonthly";
import TableFourMonthly from "@/pages/TableFourMonthly";
import TableFiveMonthly from "@/pages/TableFiveMonthly";

// Quarterly
import TableOneQuarterly from "@/pages/TableOneQuarterly";
import TableTwoQuarterly from "@/pages/TableTwoQuarterly";
import TableFiveQuarterly from "@/pages/TableFiveQuarterly";

// Apollo Client
const httpLink = new HttpLink({
    uri: import.meta.env.DEV
        ? "http://localhost:8080/graphql" // 🔹 dev backend runs on 8080
        : "/graphql",                     // 🔹 prod via Nginx / same-origin
    credentials: "include",
});

const apolloClient = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache(),
});

// Router
const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            { index: true, element: <TableOne /> },
            { path: "records", element: <Records /> },
            { path: "table-one", element: <TableOne /> },
            { path: "table-one-monthly", element: <TableOneMonthly /> },
            { path: "table-two-monthly", element: <TableTwoMonthly /> },
            { path: "table-three-monthly", element: <TableThreeMonthly /> },
            { path: "table-four-monthly", element: <TableFourMonthly /> },
            { path: "table-five-monthly", element: <TableFiveMonthly /> },
            {path: "table-one-quarterly", element: <TableOneQuarterly /> },
            { path: "table-two-quarterly", element: <TableTwoQuarterly /> },
            { path: "table-five-quarterly", element: <TableFiveQuarterly /> },
            { path: "table-two", element: <TableTwo /> },
            { path: "table-three", element: <TableThree /> },
            { path: "table-four", element: <TableFour /> },
            { path: "table-five", element: <TableFive /> },
            { path: "table-joined", element: <TableJoined /> },
        ],
    },
    { path: "/login", element: <Login /> },
    { path: "/register", element: <Register /> },
    { path: "*", element: <NotFound /> },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <ApolloProvider client={apolloClient}>
            <AuthProvider>
                <RouterProvider router={router} />
            </AuthProvider>
        </ApolloProvider>
    </React.StrictMode>
);
