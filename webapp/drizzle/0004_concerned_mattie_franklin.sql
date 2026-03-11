ALTER TABLE `skill_generations` ADD `mode` enum('create','fix') DEFAULT 'create' NOT NULL;--> statement-breakpoint
ALTER TABLE `skill_generations` ADD `originalSkillMd` mediumtext;