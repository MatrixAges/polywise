ALTER TABLE `article` ADD `for` text NOT NULL;--> statement-breakpoint
CREATE INDEX `article_for_idx` ON `article` (`for`);