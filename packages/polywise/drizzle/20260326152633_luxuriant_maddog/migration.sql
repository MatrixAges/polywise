ALTER TABLE `article` ADD `sop` integer;--> statement-breakpoint
CREATE INDEX `article_sop_idx` ON `article` (`sop`);