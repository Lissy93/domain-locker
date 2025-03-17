#!/usr/bin/env node

/**
 * This is a standalone script which checks the environment and config,
 * tests everything should work, then prints welcome info to the user.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import https from 'https';

// Load environment variables from .env file if present
dotenv.config();

/**
 * Constants
 */
const REQUIRED_ENV_VARS = [];
const PACKAGE_JSON_PATH = path.resolve('./package.json');
const COLORS = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    purple: '\x1b[35m',
    grey: '\x1b[90m',
    bold: '\x1b[1m',
    light: '\x1b[2m',
    italic: '\x1b[3m',
};

/**
 * Colorizes console output using ANSI codes
 */
function colorize(colors, text) {
    const colorCodes = colors.split(' ').map(color => COLORS[color] || '').join('');
    return `${colorCodes}${text}${COLORS.reset}`;
}

/**
 * Loads and returns the version from package.json
 */
function getVersion() {
    try {
        const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf-8'));
        return packageJson.version || 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

/**
 * Prints the Domain Locker ASCII banner
 */
function printBanner() {
    console.log(colorize('purple', `
██████╗  ██████╗ ███╗   ███╗ █████╗ ██╗███╗   ██╗
██╔══██╗██╔═══██╗████╗ ████║██╔══██╗██║████╗  ██║
██║  ██║██║   ██║██╔████╔██║███████║██║██╔██╗ ██║
██║  ██║██║   ██║██║╚██╔╝██║██╔══██║██║██║╚██╗██║
██████╔╝╚██████╔╝██║ ╚═╝ ██║██║  ██║██║██║ ╚████║
╚═════╝  ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝
                                                 
██╗      ██████╗  ██████╗██╗  ██╗███████╗██████╗ 
██║     ██╔═══██╗██╔════╝██║ ██╔╝██╔════╝██╔══██╗
██║     ██║   ██║██║     █████╔╝ █████╗  ██████╔╝
██║     ██║   ██║██║     ██╔═██╗ ██╔══╝  ██╔══██╗
███████╗╚██████╔╝╚██████╗██║  ██╗███████╗██║  ██║
╚══════╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝
    `));
    console.log(colorize('purple bold underline', 'Licensed under MIT. Coded with ☕ and ❤️ by Lissy93'));
    console.log(colorize('purple bold underline', 'Source at https://github.com/lissy93/domain-locker\n'));
}

/**
 * Checks for required environment variables
 */
function checkRequiredEnvVars() {
    const missingVars = REQUIRED_ENV_VARS.filter((varName) => !process.env[varName]);
    if (missingVars.length > 0) {
        console.error(colorize('red', '❌ Missing required environment variables:'), missingVars.join(', '));
        process.exit(1);
    }
}

/**
 * Logs a message indicating the server will start soon
 */
function willSoonStart() {
    console.log(colorize('grey', '\n🚀 Getting ready to start...'));
    const port = process.env.PORT || 3000;
    const base = (process.env.BASE_URL || process.env.DL_BASE_URL || 'http://localhost').replace(/:\d+$/, '');
    console.log(colorize('magenta', `🤘 Server will soon start at ${base}:${port}`));
}

/**
 * Tests connection to Supabase
 * @returns {Promise<boolean>} Whether the connection was successful
 */
async function testSupabaseConnection() {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error(colorize('red', '❌ Missing Supabase credentials.'));
        return false;
    }

    return new Promise((resolve) => {
        const url = `${SUPABASE_URL}/rest/v1/`;
        const options = {
            headers: { apikey: SUPABASE_ANON_KEY },
            timeout: 5000,
        };

        const req = https.get(url, options, (res) => {
            if (res.statusCode === 200) {
                console.log(colorize('green', '✅ Successfully connected to Supabase.'));
                req.destroy();
                resolve(true);
                return;
            } else {
                console.error(colorize('red', `❌ Failed to connect to Supabase. HTTP ${res.statusCode}`));
                resolve(false);
                return;
            }
        });

        req.on('error', (err) => {
            console.error(colorize('red', `❌ Error connecting to Supabase: ${err.message}`));
            resolve(false);
            return;
        });

        req.on('timeout', () => {
            console.error(colorize('red', '❌ Supabase connection timed out.'));
            req.destroy();
            resolve(false);
        });
    });
}

/**
 * Tests connection to the specified database type
 * @param {string} dbType - 'Supabase' or 'Postgres'
 */
async function testDatabaseConnection(dbType) {
    console.log(colorize('grey', '\n🔌 Testing database connection...'));
    if (dbType === 'Supabase') {
        return testSupabaseConnection().finally((success) => {
            return;
        });
    }

    if (dbType === 'Postgres') {
        const { DL_PG_HOST, DL_PG_PORT, DL_PG_USER, DL_PG_PASSWORD, DL_PG_NAME } = process.env;
        if (!DL_PG_HOST || !DL_PG_PORT || !DL_PG_USER || !DL_PG_PASSWORD || !DL_PG_NAME) {
            console.error(colorize('red', '❌ Missing PostgreSQL connection details.'));
            process.exit(1);
        }

        try {
            execSync(
                `PGPASSWORD="${DL_PG_PASSWORD}" psql -h ${DL_PG_HOST} -p ${DL_PG_PORT} -U ${DL_PG_USER} -d ${DL_PG_NAME} -c "SELECT 1;"`,
                { stdio: 'ignore' }
            );
            console.log(colorize('green', '✅ Successfully connected to PostgreSQL.'));
        } catch (error) {
            console.error(colorize('red', '❌ Failed to connect to PostgreSQL:'), error.message);
            process.exit(1);
        }
        return;
    }

    console.error(colorize('yellow', '⚠️ Couldn\'t verify database type.'));
}

/**
 * Determines the database type based on environment variables
 * @returns {string} 'Supabase', 'Postgres', or 'Unknown'
 */
function getDatabaseType() {
    const {
        SUPABASE_URL,
        SUPABASE_ANON_KEY,
        DL_PG_HOST,
        DL_PG_PORT,
        DL_PG_USER,
        DL_PG_PASSWORD,
        DL_PG_NAME
    } = process.env;

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        return 'Supabase';
    }
    if (DL_PG_HOST && DL_PG_PORT && DL_PG_USER && DL_PG_PASSWORD && DL_PG_NAME) {
        return 'Postgres';
    }
    return 'Unknown';
}

/**
 * Main initialization sequence
 */
async function init() {
    console.clear();
    printBanner();

    const dbType = getDatabaseType();
    console.log(colorize('grey', '\n⚙️ Checking config...'));
    console.log(colorize('cyan', `🌍 Environment: ${process.env.DL_ENV_TYPE || 'Self-Hosted'}`));
    console.log(colorize('cyan', `📦 Version: ${getVersion()}`));
    console.log(colorize('cyan', `💾 Database Type: ${dbType}`));

    checkRequiredEnvVars();
    await testDatabaseConnection(dbType);

    willSoonStart();
    console.log();
}

/**
 * Entry point - catches errors and starts init
 */
init().catch((error) => {
    console.error(colorize('red', '❌ Unexpected error during initialization:'), error);
    process.exit(1);
});
