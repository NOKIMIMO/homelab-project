import "reflect-metadata";
import { DataSource } from "typeorm";
import { Asset } from "../entities/Asset";
import { Board } from "../entities/Board";
import { BoardAsset } from "../entities/BoardAsset";
import { Synchro } from "../entities/Synchro";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableDbError = (error: unknown): boolean => {
    const code = (error as { code?: string })?.code;
    return ["EAI_AGAIN", "ENOTFOUND", "ECONNREFUSED", "ETIMEDOUT"].includes(code ?? "");
};

const withRetries = async <T>(
    label: string,
    action: () => Promise<T>,
    maxAttempts = 15,
    delayMs = 2000
): Promise<T> => {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await action();
        } catch (error) {
            lastError = error;
            if (!isRetryableDbError(error) || attempt === maxAttempts) {
                throw error;
            }
            console.warn(`${label} unavailable (attempt ${attempt}/${maxAttempts}). Retrying in ${delayMs}ms...`);
            await sleep(delayMs);
        }
    }
    throw lastError;
};

const dbHost = process.env.DB_HOST || process.env.CORE_DB_HOST || "homelab-db";
const dbPort = parseInt(process.env.DB_PORT || process.env.CORE_DB_PORT || "5432", 10);
const dbUsername = process.env.DB_USERNAME || process.env.CORE_DB_USERNAME || "homelab_user";
const dbPassword = process.env.DB_PASSWORD || process.env.CORE_DB_PASSWORD || "homelab_password";
const photoDatabaseName = process.env.DB_DATABASE || "photo_module";

const quoteIdentifier = (identifier: string): string => `"${identifier.replace(/"/g, "\"\"")}"`;

const ensurePhotoDatabaseExists = async () => {
    const adminDatabase = process.env.CORE_DB_DATABASE || "homelab";
    const adminDataSource = new DataSource({
        type: "postgres",
        host: dbHost,
        port: dbPort,
        username: dbUsername,
        password: dbPassword,
        database: adminDatabase,
        synchronize: false,
        logging: false,
        entities: [],
    });

    try {
        await adminDataSource.initialize();
        const existing = await adminDataSource.query("SELECT 1 FROM pg_database WHERE datname = $1", [photoDatabaseName]);
        if (existing.length === 0) {
            await adminDataSource.query(`CREATE DATABASE ${quoteIdentifier(photoDatabaseName)}`);
            console.log(`Created database: ${photoDatabaseName}`);
        }
    } finally {
        if (adminDataSource.isInitialized) {
            await adminDataSource.destroy();
        }
    }
};

// DataSource for the module's own database
export const PhotoDataSource = new DataSource({
    type: "postgres",
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: photoDatabaseName,
    synchronize: true, // Auto-create tables for now
    logging: process.env.NODE_ENV === "development",
    entities: [Asset, Board, BoardAsset, Synchro],
    migrations: [],
    subscribers: [],
});

// DataSource for the core database
export const CoreDataSource = new DataSource({
    type: "postgres",
    host: dbHost,
    port: dbPort,
    username: dbUsername,
    password: dbPassword,
    database: process.env.CORE_DB_DATABASE || "homelab",
    synchronize: false, // Never sync core from a module
    logging: false,
    entities: [], // We don't define core entities here yet
});

export const initDB = async () => {
    try {
        await withRetries("Photo database", async () => {
            await ensurePhotoDatabaseExists();
            if (!PhotoDataSource.isInitialized) {
                await PhotoDataSource.initialize();
            }
        });
        console.log("Photo Module Database initialized");

        // Try to connect to core but don't fail if it's not available
        try {
            await CoreDataSource.initialize();
            console.log("Core Database connection established");
        } catch (error) {
            console.warn("Could not connect to Core Database. Some features might be unavailable.");
        }
    } catch (error) {
        console.error("Error during Data Source initialization", error);
        throw error;
    }
};
