#!/bin/bash
# Docker 환경의 coldchain_postgres 컨테이너에서 audit_logs 테이블을 초기화합니다.

echo "Clearing audit_logs table in coldchain_postgres container..."
docker exec coldchain_postgres psql -U postgres -d coldchain_db -c "TRUNCATE TABLE audit_logs RESTART IDENTITY CASCADE;"

if [ $? -eq 0 ]; then
    echo "audit_logs table successfully truncated."
else
    echo "Failed to truncate audit_logs table. Make sure coldchain_postgres container is running."
fi
