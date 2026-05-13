PRAGMA foreign_keys=OFF;
--> statement-breakpoint

CREATE TABLE `__new_agent` (
	`id` text PRIMARY KEY,
	`name` text NOT NULL,
	`role` text NOT NULL CHECK(length(trim(`role`)) > 0 AND length(`role`) <= 20),
	`description` text,
	`photo` blob,
	`avatar` text,
	`tools` text DEFAULT '[]' NOT NULL,
	`prompt` text,
	`soul` text,
	`identity` text,
	`memory` text DEFAULT '',
	`order` real NOT NULL,
	`model` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint

INSERT INTO `__new_agent` (
	`id`,
	`name`,
	`role`,
	`description`,
	`photo`,
	`avatar`,
	`tools`,
	`prompt`,
	`soul`,
	`identity`,
	`memory`,
	`order`,
	`model`,
	`created_at`,
	`updated_at`
)
SELECT
	`id`,
	`name`,
	CASE
		WHEN `description` = 'A strategic product leader focused on scaling user value through vision-led execution.' THEN 'Product Lead'
		WHEN `description` = 'Architect of resilient, high-performance backend systems and robust API ecosystems.' THEN 'Backend Architect'
		WHEN `description` = 'Extracts actionable intelligence and predictive patterns from massive unstructured datasets.' THEN 'Data Scientist'
		WHEN `description` = 'A seasoned UX/UI designer focused on crafting seamless user journeys and high-fidelity digital interfaces.' THEN 'UX Designer'
		WHEN `description` = 'Automates deployment pipelines and cloud systems with a focus on high-availability and security.' THEN 'DevOps Engineer'
		WHEN `description` = 'A meticulous quality assurance specialist dedicated to identifying edge cases and ensuring software reliability.' THEN 'QA Engineer'
		WHEN `description` = 'A data-driven strategist who engineers viral loops and optimizes acquisition funnels for explosive user expansion.' THEN 'Growth Strategist'
		WHEN `description` = 'A vigilant cybersecurity specialist dedicated to fortifying network infrastructure and neutralizing digital vulnerabilities.' THEN 'Security Engineer'
		WHEN `description` = 'A proactive agile facilitator focused on streamlining workflows and shielding the development team from external friction.' THEN 'Agile Coach'
		WHEN `description` = 'A specialized documentation architect transforming complex codebases into accessible, developer-centric guides.' THEN 'Docs Architect'
		WHEN lower(ifnull(`description`, '')) LIKE '%product%' THEN 'Product Lead'
		WHEN lower(ifnull(`description`, '')) LIKE '%backend%' OR lower(ifnull(`description`, '')) LIKE '%api%' THEN 'Backend Architect'
		WHEN lower(ifnull(`description`, '')) LIKE '%data%' OR lower(ifnull(`description`, '')) LIKE '%dataset%' THEN 'Data Scientist'
		WHEN lower(ifnull(`description`, '')) LIKE '%design%' OR lower(ifnull(`description`, '')) LIKE '%ux/ui%' OR lower(ifnull(`description`, '')) LIKE '%interface%' THEN 'UX Designer'
		WHEN lower(ifnull(`description`, '')) LIKE '%deploy%' OR lower(ifnull(`description`, '')) LIKE '%cloud%' OR lower(ifnull(`description`, '')) LIKE '%security%' THEN 'DevOps Engineer'
		WHEN lower(ifnull(`description`, '')) LIKE '%quality%' OR lower(ifnull(`description`, '')) LIKE '%qa%' THEN 'QA Engineer'
		WHEN lower(ifnull(`description`, '')) LIKE '%growth%' OR lower(ifnull(`description`, '')) LIKE '%acquisition%' OR lower(ifnull(`description`, '')) LIKE '%viral%' THEN 'Growth Strategist'
		WHEN lower(ifnull(`description`, '')) LIKE '%cyber%' OR lower(ifnull(`description`, '')) LIKE '%vulnerab%' THEN 'Security Engineer'
		WHEN lower(ifnull(`description`, '')) LIKE '%agile%' OR lower(ifnull(`description`, '')) LIKE '%workflow%' THEN 'Agile Coach'
		WHEN lower(ifnull(`description`, '')) LIKE '%document%' OR lower(ifnull(`description`, '')) LIKE '%guide%' THEN 'Docs Architect'
		ELSE 'Assistant'
	END,
	`description`,
	`photo`,
	`avatar`,
	`tools`,
	`prompt`,
	`soul`,
	`identity`,
	`memory`,
	`order`,
	`model`,
	`created_at`,
	`updated_at`
FROM `agent`;
--> statement-breakpoint

DROP TABLE `agent`;
--> statement-breakpoint
ALTER TABLE `__new_agent` RENAME TO `agent`;
--> statement-breakpoint

CREATE INDEX `agent_order_idx` ON `agent` (`order`);
--> statement-breakpoint
CREATE INDEX `agent_created_at_idx` ON `agent` (`created_at`);
--> statement-breakpoint
CREATE INDEX `agent_updated_at_idx` ON `agent` (`updated_at`);
--> statement-breakpoint

PRAGMA foreign_keys=ON;
