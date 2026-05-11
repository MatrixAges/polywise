ALTER TABLE `article` RENAME COLUMN `is_tripled` TO `is_pipelined`;
--> statement-breakpoint
DROP INDEX `article_is_tripled_idx`;
--> statement-breakpoint
CREATE INDEX `article_is_pipelined_idx` ON `article` (`is_pipelined`);
--> statement-breakpoint
ALTER TABLE `document` RENAME COLUMN `is_tripled` TO `is_pipelined`;
--> statement-breakpoint
DROP INDEX `document_is_tripled_idx`;
--> statement-breakpoint
CREATE INDEX `document_is_pipelined_idx` ON `document` (`is_pipelined`);
