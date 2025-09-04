-- Migration: add_tab_leave_limit_to_tests.sql
ALTER TABLE tests ADD COLUMN "tabLeaveLimit" INTEGER DEFAULT 3;
