CREATE TABLE `post_article` (
	`post_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	PRIMARY KEY(`post_id`, `article_id`),
	FOREIGN KEY (`post_id`) REFERENCES `article`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `post_article_article_id_idx` ON `post_article` (`article_id`);
--> statement-breakpoint
CREATE TABLE `post_session` (
	`post_id` text NOT NULL,
	`session_id` text NOT NULL,
	`created_at` integer,
	FOREIGN KEY (`post_id`) REFERENCES `article`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`session_id`) REFERENCES `session`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_session_post_id_idx` ON `post_session` (`post_id`);
--> statement-breakpoint
CREATE UNIQUE INDEX `post_session_session_id_idx` ON `post_session` (`session_id`);
--> statement-breakpoint
CREATE INDEX `post_session_created_at_idx` ON `post_session` (`created_at`);
