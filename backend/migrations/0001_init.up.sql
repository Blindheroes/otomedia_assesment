-- Task app schema.
-- Note: `active_flag` is a generated column used to enforce
-- "unique title among non-deleted rows" without a partial unique index
-- (MySQL 8 has no partial unique indexes). Active rows => active_flag = 1,
-- soft-deleted rows => active_flag = NULL (NULLs are not unique in MySQL).
CREATE TABLE IF NOT EXISTS tasks (
    id          BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    title       VARCHAR(255)    NOT NULL,
    description TEXT            NULL,
    status      ENUM('todo','in_progress','done') NOT NULL DEFAULT 'todo',
    assignee    VARCHAR(100)    NULL,
    created_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP       NULL DEFAULT NULL,
    active_flag TINYINT
        GENERATED ALWAYS AS (IF(deleted_at IS NULL, 1, NULL)) STORED,
    PRIMARY KEY (id),
    UNIQUE KEY uniq_tasks_title_active (title, active_flag),
    KEY idx_tasks_status      (status),
    KEY idx_tasks_assignee    (assignee),
    KEY idx_tasks_deleted_at  (deleted_at),
    KEY idx_tasks_created_at  (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;