ALTER TABLE `agent` ADD `photo` blob;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_agent` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`photo` blob,
	`avatar` text,
	`prompt` text,
	`soul` text,
	`identity` text,
	`memory` text DEFAULT '',
	`model` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_agent`(`id`, `name`, `description`, `avatar`, `prompt`, `soul`, `identity`, `memory`, `model`, `created_at`, `updated_at`) SELECT `id`, `name`, `description`, `avatar`, `prompt`, `soul`, `identity`, `memory`, `model`, `created_at`, `updated_at` FROM `agent`;--> statement-breakpoint
DROP TABLE `agent`;--> statement-breakpoint
ALTER TABLE `__new_agent` RENAME TO `agent`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `agent_created_at_idx` ON `agent` (`created_at`);--> statement-breakpoint
CREATE INDEX `agent_updated_at_idx` ON `agent` (`updated_at`);