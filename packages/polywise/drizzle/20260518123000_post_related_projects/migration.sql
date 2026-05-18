CREATE TABLE `post_project` (
	`post_id` text NOT NULL,
	`project_id` text NOT NULL,
	`created_at` integer,
	PRIMARY KEY(`post_id`, `project_id`),
	FOREIGN KEY (`post_id`) REFERENCES `article`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `project`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `post_project_project_id_idx` ON `post_project` (`project_id`);
