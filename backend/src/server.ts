// src/server.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import jwt from "jsonwebtoken";

import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";

import authRouter from "./routes/auth";
import { tableOne } from "./routes/tableOne";
import { tableTwo } from "./routes/tableTwo";
import { tableThree } from "./routes/tableThree";
import { tableFour } from "./routes/tableFour";
import { tableFive } from "./routes/tableFive";
import { tableJoined } from "./routes/tableJoined";

import {
    tableOneMonthlyTypeDefs,
    tableOneMonthlyResolvers,
} from "./graphql/tableOneMonthly";

import {tableTwoMonthlyTypeDefs, tableTwoMonthlyResolvers} from "./graphql/tableTwoMonthly";
import { tableThreeMonthlyTypeDefs, tableThreeMonthlyResolvers } from "./graphql/tableThreeMonthly";
import {tableFourMonthlyTypeDefs, tableFourMonthlyResolvers} from "./graphql/tableFourMonthly";

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

// -----------------------------
// Core middleware
// -----------------------------
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));

// CORS for REST
if (NODE_ENV !== "production") {
    app.use(
        cors({
            origin: "http://localhost:5173",
            credentials: true,
        })
    );
}

// -----------------------------
// REST routes
// -----------------------------
app.use("/auth", authRouter);
app.use("/table-one", tableOne);
app.use("/table-two", tableTwo);
app.use("/table-three", tableThree);
app.use("/table-four", tableFour);
app.use("/table-five", tableFive);
app.use("/table-joined", tableJoined);

// -----------------------------
// GraphQL setup (/graphql)
// -----------------------------

// Small helper for decoding JWT from cookies for GraphQL
interface JwtPayload {
    id: number;
    email?: string;
}

async function startApollo() {
    const baseTypeDefs = /* GraphQL */ `
    type Query {
      _health: String!
    }
  `;

    const typeDefs = `
    ${baseTypeDefs}
    ${tableOneMonthlyTypeDefs}
    ${tableTwoMonthlyTypeDefs}
    ${tableThreeMonthlyTypeDefs}
    ${tableFourMonthlyTypeDefs}
  `;

    const resolvers = {
        Query: {
            _health: () => "ok",
            ...tableOneMonthlyResolvers.Query,
            ...tableTwoMonthlyResolvers.Query,
            ...tableThreeMonthlyResolvers.Query,
            ...tableFourMonthlyResolvers.Query,
        },
    };

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        plugins:
            NODE_ENV === "production"
                ? [ApolloServerPluginLandingPageDisabled()]
                : [],
    });

    await server.start();

    // Dedicated CORS for /graphql (must allow cookies)
    app.use(
        "/graphql",
        cors<cors.CorsRequest>({
            origin:
                NODE_ENV === "production"
                    ? "https://aftersurgerytwo.scaocoding.com"
                    : "http://localhost:5173",
            credentials: true,
        }),
        express.json(),
        expressMiddleware(server, {
            context: async ({ req }) => {
                // Read JWT from cookie
                const cookies = (req as any).cookies as Record<string, string> | undefined;
                const token = cookies?.access_token ?? cookies?.token;

                let user: { id: number } | undefined;

                if (token && process.env.JWT_SECRET) {
                    try {
                        const decoded = jwt.verify(
                            token,
                            process.env.JWT_SECRET
                        ) as JwtPayload;
                        user = { id: decoded.id };
                    } catch (err) {
                        console.warn("[GraphQL] Invalid JWT on /graphql", err);
                    }
                }

                // This becomes ctx.user in your resolvers
                return { user };
            },
        })
    );

    app.listen(PORT, () => {
        console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
    });
}

startApollo().catch((err) => {
    console.error("Error starting Apollo Server:", err);
    process.exit(1);
});
