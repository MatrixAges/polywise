CREATE TABLE `project` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`desc` text,
	`dir` text NOT NULL,
	`model` text,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `project_session` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `fk_project_session_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_project_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE `todo_tag` (
	`todo_id` text NOT NULL,
	`tag` text NOT NULL,
	CONSTRAINT `todo_tag_pk` PRIMARY KEY(`todo_id`, `tag`),
	CONSTRAINT `fk_todo_tag_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `project_name_idx` ON `project` (`name`);--> statement-breakpoint
CREATE INDEX `project_created_at_idx` ON `project` (`created_at`);--> statement-breakpoint
CREATE INDEX `project_updated_at_idx` ON `project` (`updated_at`);--> statement-breakpoint
CREATE INDEX `project_session_project_id_idx` ON `project_session` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_session_session_id_idx` ON `project_session` (`session_id`);--> statement-breakpoint
CREATE INDEX `todo_tag_tag_idx` ON `todo_tag` (`tag`);