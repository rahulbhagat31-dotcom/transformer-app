-- ============================================
-- PHASE A VERIFICATION QUERIES
-- ============================================

-- 1. Verify schema tables
SELECT name, type FROM sqlite_master WHERE type IN ('table', 'trigger') ORDER BY type, name;

-- 2. Verify design_revisions structure
PRAGMA table_info(design_revisions);

-- 3. Verify audit_logs structure
PRAGMA table_info(audit_logs);

-- 4. Test immutability - Insert test revision
INSERT INTO design_revisions (
    wo, revision, designData, calculationHash, 
    validationStatus, calculatorVersion, engineVersion, createdBy, frozen
)
VALUES ('VERIFY-001', 1, '{"test": true}', 'abc123', 'PASS', '2.0.0', 'IEC-2024', 'admin', 1);

-- 5. Test immutability - Try to update (should fail)
-- UPDATE design_revisions SET notes = 'test' WHERE wo = 'VERIFY-001';
-- Expected: Error: Frozen revisions are immutable

-- 6. Test immutability - Try to delete (should fail)
-- DELETE FROM design_revisions WHERE wo = 'VERIFY-001';
-- Expected: Error: Frozen revisions cannot be deleted

-- 7. Verify triggers exist
SELECT name, tbl_name, sql FROM sqlite_master WHERE type = 'trigger';

-- 8. Cleanup (must set frozen = 0 first)
UPDATE design_revisions SET frozen = 0 WHERE wo = 'VERIFY-001';
DELETE FROM design_revisions WHERE wo = 'VERIFY-001';
