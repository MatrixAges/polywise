ALTER TABLE `todo` ADD `result` text;--> statement-breakpoint
ALTER TABLE `todo` ADD `error` text;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_edge` (
	`id` text PRIMARY KEY,
	`relation` text NOT NULL,
	`agent_id` text,
	`source_id` text NOT NULL,
	`target_id` text NOT NULL,
	`weight` real DEFAULT 1 NOT NULL,
	`growth` real DEFAULT 1 NOT NULL,
	`confidence` real DEFAULT 0.5 NOT NULL,
	`distance` real DEFAULT 1 NOT NULL,
	`bandwidth` real DEFAULT 1 NOT NULL,
	`active_times` integer DEFAULT 1 NOT NULL,
	`active_at` integer NOT NULL,
	`is_frozen` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_edge_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_edge_source_id_node_id_fk` FOREIGN KEY (`source_id`) REFERENCES `node`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_edge_target_id_node_id_fk` FOREIGN KEY (`target_id`) REFERENCES `node`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_edge`(`id`, `relation`, `agent_id`, `source_id`, `target_id`, `weight`, `growth`, `confidence`, `distance`, `bandwidth`, `active_times`, `active_at`, `is_frozen`, `created_at`) SELECT `id`, `relation`, `agent_id`, `source_id`, `target_id`, `weight`, `growth`, `confidence`, `distance`, `bandwidth`, `active_times`, `active_at`, `is_frozen`, `created_at` FROM `edge`;--> statement-breakpoint
DROP TABLE `edge`;--> statement-breakpoint
ALTER TABLE `__new_edge` RENAME TO `edge`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_node` (
	`id` text PRIMARY KEY,
	`agent_id` text,
	`name` text NOT NULL,
	`active_level` real DEFAULT 0 NOT NULL,
	`active_sens` real DEFAULT 0 NOT NULL,
	`active_times` integer DEFAULT 1 NOT NULL,
	`active_at` integer NOT NULL,
	`is_frozen` integer DEFAULT false NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `fk_node_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `node_agent_name_unique` UNIQUE(`agent_id`,`name`)
);
--> statement-breakpoint
INSERT INTO `__new_node`(`id`, `agent_id`, `name`, `active_level`, `active_sens`, `active_times`, `active_at`, `is_frozen`, `created_at`) SELECT `id`, `agent_id`, `name`, `active_level`, `active_sens`, `active_times`, `active_at`, `is_frozen`, `created_at` FROM `node`;--> statement-breakpoint
DROP TABLE `node`;--> statement-breakpoint
ALTER TABLE `__new_node` RENAME TO `node`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `edge_agent_id_idx` ON `edge` (`agent_id`);--> statement-breakpoint
CREATE INDEX `edge_source_idx` ON `edge` (`source_id`);--> statement-breakpoint
CREATE INDEX `edge_target_idx` ON `edge` (`target_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `edge_source_target_idx` ON `edge` (`source_id`,`target_id`);--> statement-breakpoint
CREATE INDEX `edge_created_at_idx` ON `edge` (`created_at`);--> statement-breakpoint
CREATE INDEX `node_agent_id_idx` ON `node` (`agent_id`);--> statement-breakpoint
CREATE INDEX `node_created_at_idx` ON `node` (`created_at`);