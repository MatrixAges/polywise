ALTER TABLE `link` ADD `hash` text;--> statement-breakpoint
CREATE UNIQUE INDEX `link_hash_idx` ON `link` (`hash`);