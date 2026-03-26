CREATE TABLE `todo` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`description` text,
	`priority` text DEFAULT 'none',
	`status` text DEFAULT 'draft' NOT NULL,
	`order` real NOT NULL,
	`estimate` integer,
	`due_at` integer,
	`completed_at` integer,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `agent_sop` (
	`agent_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `agent_sop_pk` PRIMARY KEY(`agent_id`, `article_id`),
	CONSTRAINT `fk_agent_sop_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_sop_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `agent_todo` (
	`agent_id` text NOT NULL,
	`todo_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `agent_todo_pk` PRIMARY KEY(`agent_id`, `todo_id`),
	CONSTRAINT `fk_agent_todo_agent_id_agent_id_fk` FOREIGN KEY (`agent_id`) REFERENCES `agent`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_agent_todo_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session_sop` (
	`session_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `session_sop_pk` PRIMARY KEY(`session_id`, `article_id`),
	CONSTRAINT `fk_session_sop_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_session_sop_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `session_todo` (
	`session_id` text NOT NULL,
	`todo_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `session_todo_pk` PRIMARY KEY(`session_id`, `todo_id`),
	CONSTRAINT `fk_session_todo_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_session_todo_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `todo_status_idx` ON `todo` (`status`);--> statement-breakpoint
CREATE INDEX `todo_priority_idx` ON `todo` (`priority`);--> statement-breakpoint
CREATE INDEX `todo_order_idx` ON `todo` (`order`);--> statement-breakpoint
CREATE INDEX `todo_created_at_idx` ON `todo` (`created_at`);--> statement-breakpoint
CREATE INDEX `todo_updated_at_idx` ON `todo` (`updated_at`);--> statement-breakpoint
CREATE INDEX `agent_sop_article_id_idx` ON `agent_sop` (`article_id`);--> statement-breakpoint
CREATE INDEX `agent_todo_todo_id_idx` ON `agent_todo` (`todo_id`);--> statement-breakpoint
CREATE INDEX `session_sop_article_id_idx` ON `session_sop` (`article_id`);--> statement-breakpoint
CREATE INDEX `session_todo_todo_id_idx` ON `session_todo` (`todo_id`);