// backend/src/server.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import authRouter from "./routes/auth";
import { tableOne } from "./routes/tableOne";
import { tableThree } from "./routes/tableThree";
import { tableFour } from "./routes/tableFour";
import { tableFive } from "./routes/tableFive";
import { tableTwo } from "./routes/tableTwo";
import { tableJoined } from "./routes/tableJoined";

import { requireAuth } from "./middleware/auth";

// 🔷 Apollo Server 5 + Express integration
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express4";
import { json as bodyParserJson } from "body-parser";

import {
    tableOneMonthlyTypeDefs,
    tableOneMonthlyResolvers,
} from "./graphql/tableOneMonthly";

const app = express();
const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.use(express.json());
app.use(cookieParser());

// =====================
// 🚀 Request Logging
// =====================
app.use(morgan("dev"));

// Dev CORS only; prod is same-origin via Nginx
if (NODE_ENV === "development") {
    app.use(
        cors({
            origin: "http://localhost:5173",
            credentials: true,
        })
    );
}

// Trust proxy for secure cookies behind Nginx/HTTPS
app.set("trust proxy", 1);

// Health
app.get("/health", (_req, res) => res.json({ ok: true }));

// IMPORTANT: backend has no /api prefix (Nginx strips /api/)
app.use("/auth", authRouter);
app.use("/table-one", tableOne);
app.use("/table-two", tableTwo);
app.use("/table-three", tableThree);
app.use("/table-four", tableFour);
app.use("/table-five", tableFive);
app.use("/table-joined", tableJoined);

// =====================
// 🔷 GraphQL setup
// =====================

// Root stub type so we can "extend type Query" elsewhere
const rootTypeDefs = `#graphql
  type Query {
    _empty: String
  }
`;

const typeDefs = [
    rootTypeDefs,
    tableOneMonthlyTypeDefs, // later: add tableTwoMonthlyTypeDefs etc
];

const resolvers = [
    tableOneMonthlyResolvers, // later: add tableTwoMonthlyResolvers etc
];

async function start() {
    // Create Apollo Server (Apollo v5)
    const apollo = new ApolloServer({
        typeDefs,
        resolvers,
    });

    await apollo.start();

    // /graphql uses same auth model as REST
    app.use(
        "/graphql",
        requireAuth,
        bodyParserJson(),
        expressMiddleware(apollo, {
            context: async ({ req }) => {
                // requireAuth has attached user to req
                return { user: (req as any).user };
            },
        })
    );

    // 404 fallback (AFTER all routes, including /graphql)
    app.use((_req, res) => res.status(404).json({ error: "Not Found" }));

    app.listen(PORT, () => {
        console.log(`API running on http://localhost:${PORT} (${NODE_ENV})`);
        console.log(`GraphQL endpoint at http://localhost:${PORT}/graphql`);
    });
}

// Start async server
start().catch((err) => {
    console.error("Failed to start server:", err);
    process.exit(1);
});
