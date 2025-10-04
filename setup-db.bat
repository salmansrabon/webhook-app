@echo off
echo Setting up webhookdb database...
npx prisma generate
npx prisma db push
echo Database setup complete. File: webhookdb.db