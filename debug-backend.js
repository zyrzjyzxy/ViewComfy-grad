
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

async function test() {
    console.log('Testing imports...');
    try {
        console.log('Bcrypt version:', require('bcrypt/package.json').version);
    } catch (e) {
        console.error('Bcrypt import failed:', e);
    }

    console.log('Initializing Prisma...');
    const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
    const path = require('path');

    const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
    
    const adapter = new PrismaBetterSqlite3({
        url: `file:${dbPath}`
    });
    const prisma = new PrismaClient({ adapter });
    
    try {
        console.log('Connecting to database...');
        await prisma.$connect();
        console.log('Connected to database.');
        
        const userCount = await prisma.user.count();
        console.log('User count:', userCount);
        
        await prisma.$disconnect();
    } catch (e) {
        console.error('Prisma error:', e);
    }
}

test().catch(console.error);
