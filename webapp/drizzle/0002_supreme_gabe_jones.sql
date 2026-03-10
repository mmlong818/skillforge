ALTER TABLE `generation_steps` MODIFY COLUMN `output` mediumtext;--> statement-breakpoint
ALTER TABLE `generation_steps` MODIFY COLUMN `errorMessage` mediumtext;--> statement-breakpoint
ALTER TABLE `skill_generations` MODIFY COLUMN `errorMessage` mediumtext;