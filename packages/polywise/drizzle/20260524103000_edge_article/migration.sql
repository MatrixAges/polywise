CREATE TABLE `edge_article` (
	`edge_id` text NOT NULL,
	`article_id` text NOT NULL,
	`created_at` integer,
	PRIMARY KEY(`edge_id`, `article_id`),
	CONSTRAINT `edge_article_edge_id_edge_id_fk` FOREIGN KEY (`edge_id`) REFERENCES `edge`(`id`) ON DELETE CASCADE,
	CONSTRAINT `edge_article_article_id_article_id_fk` FOREIGN KEY (`article_id`) REFERENCES `article`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `edge_article_article_id_idx` ON `edge_article` (`article_id`);
