CREATE TABLE `notification` (
	`id` text PRIMARY KEY,
	`title` text NOT NULL,
	`description` text,
	`is_read` integer DEFAULT false NOT NULL,
	`is_pushed` integer DEFAULT false NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `notification_session` (
	`notification_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	CONSTRAINT `notification_session_pk` PRIMARY KEY(`notification_id`, `session_id`),
	CONSTRAINT `fk_notification_session_notification_id_notification_id_fk` FOREIGN KEY (`notification_id`) REFERENCES `notification`(`id`) ON DELETE CASCADE,
	CONSTRAINT `fk_notification_session_session_id_session_id_fk` FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `notification_is_read_idx` ON `notification` (`is_read`);--> statement-breakpoint
CREATE INDEX `notification_is_pushed_idx` ON `notification` (`is_pushed`);--> statement-breakpoint
CREATE INDEX `notification_session_session_id_idx` ON `notification_session` (`session_id`);