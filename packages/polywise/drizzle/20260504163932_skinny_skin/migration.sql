CREATE TABLE `todo_session` (
	`todo_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `todo_session_pk` PRIMARY KEY(`todo_id`, `session_id`),
	CONSTRAINT `fk_todo_session_todo_id_todo_id_fk` FOREIGN KEY (`todo_id`) REFERENCES `todo`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_todo_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `todo_session_session_id_idx` ON `todo_session` (`session_id`);
