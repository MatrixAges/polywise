CREATE TABLE `project_todo` (
	`id` text PRIMARY KEY,
	`project_id` text NOT NULL,
	`todo_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `fk_project_todo_project_id_project_id_fk` FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_project_todo_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
ALTER TABLE `project` ADD `order` integer NOT NULL;--> statement-breakpoint
CREATE INDEX `project_todo_project_id_idx` ON `project_todo` (`project_id`);--> statement-breakpoint
CREATE INDEX `project_todo_todo_id_idx` ON `project_todo` (`todo_id`);