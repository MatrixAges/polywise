CREATE TABLE `agent` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`description` text,
	`avatar` blob,
	`prompt` text,
	`soul` text,
	`memory` text DEFAULT '',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `article` (
	`id` text PRIMARY KEY,
	`document_id` text,
	`content` text NOT NULL,
	`title` text,
	`url` text,
	`hash` text UNIQUE,
	`metadata` text DEFAULT '{}',
	`is_long` integer GENERATED ALWAYS AS (length(content) > 12000) VIRTUAL,
	`is_tripled` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer,
	CONSTRAINT `fk_article_document_id_document_id_fk` FOREIGN KEY (`document_id`) REFERENCES `document`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `chunk` (
	`id` text PRIMARY KEY,
	`article_id` text,
	`content` text,
	`keywords` text NOT NULL,
	`is_body` integer DEFAULT false NOT NULL,
	`position` integer,
	`created_at` integer,
	CONSTRAINT `fk_chunk_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `document` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`description` text,
	`is_tripled` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `edge` (
	`id` text PRIMARY KEY,
	`relation` text NOT NULL,
	`agent_id` text NOT NULL,
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
CREATE TABLE `node` (
	`id` text PRIMARY KEY,
	`agent_id` text NOT NULL,
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
CREATE TABLE `task` (
	`id` text PRIMARY KEY,
	`type` text NOT NULL,
	`args` text NOT NULL,
	`progress` text,
	`status` text DEFAULT 'pending',
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `agent_article` (
	`agent_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `agent_article_pk` PRIMARY KEY(`agent_id`, `article_id`),
	CONSTRAINT `fk_agent_article_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_article_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `agent_document` (
	`agent_id` text NOT NULL,
	`document_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `agent_document_pk` PRIMARY KEY(`agent_id`, `document_id`),
	CONSTRAINT `fk_agent_document_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_document_document_id_document_id_fk` FOREIGN KEY (`document_id`) REFERENCES `document`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `node_chunk` (
	`node_id` text NOT NULL,
	`chunk_id` text NOT NULL,
	`created_at` integer NOT NULL,
	CONSTRAINT `node_chunk_pk` PRIMARY KEY(`node_id`, `chunk_id`),
	CONSTRAINT `fk_node_chunk_node_id_node_id_fk` FOREIGN KEY (`node_id`) REFERENCES `node`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_node_chunk_chunk_id_chunk_id_fk` FOREIGN KEY (`chunk_id`) REFERENCES `chunk`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `article_document_id_idx` ON `article` (`document_id`);--> statement-breakpoint
CREATE INDEX `article_is_tripled_idx` ON `article` (`is_tripled`);--> statement-breakpoint
CREATE INDEX `chunk_article_id_idx` ON `chunk` (`article_id`);--> statement-breakpoint
CREATE INDEX `document_is_tripled_idx` ON `document` (`is_tripled`);--> statement-breakpoint
CREATE INDEX `edge_agent_id_idx` ON `edge` (`agent_id`);--> statement-breakpoint
CREATE INDEX `edge_source_idx` ON `edge` (`source_id`);--> statement-breakpoint
CREATE INDEX `edge_target_idx` ON `edge` (`target_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `edge_source_target_idx` ON `edge` (`source_id`,`target_id`);--> statement-breakpoint
CREATE INDEX `node_agent_id_idx` ON `node` (`agent_id`);--> statement-breakpoint
CREATE INDEX `task_type_idx` ON `task` (`type`);--> statement-breakpoint
CREATE INDEX `agent_article_article_id_idx` ON `agent_article` (`article_id`);--> statement-breakpoint
CREATE INDEX `agent_document_document_id_idx` ON `agent_document` (`document_id`);--> statement-breakpoint
CREATE INDEX `node_chunk_chunk_id_idx` ON `node_chunk` (`chunk_id`);