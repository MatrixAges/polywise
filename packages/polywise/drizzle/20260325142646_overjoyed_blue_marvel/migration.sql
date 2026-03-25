CREATE TABLE `session_agent` (
	`session_id` text NOT NULL,
	`agent_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `session_agent_pk` PRIMARY KEY(`session_id`, `agent_id`),
	CONSTRAINT `fk_session_agent_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_session_agent_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `agent` ADD `provider` text;--> statement-breakpoint
CREATE INDEX `session_agent_agent_idx` ON `session_agent` (`agent_id`);--> statement-breakpoint
ALTER TABLE `session` DROP COLUMN `provider`;--> statement-breakpoint
ALTER TABLE `session` DROP COLUMN `model`;--> statement-breakpoint
ALTER TABLE `session` DROP COLUMN `effort`;--> statement-breakpoint
ALTER TABLE `session` DROP COLUMN `options`;