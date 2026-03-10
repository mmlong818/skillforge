CREATE TABLE `generation_steps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`generationId` int NOT NULL,
	`stepNumber` int NOT NULL,
	`stepName` varchar(128) NOT NULL,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`output` text,
	`summary` varchar(512),
	`errorMessage` text,
	`startedAt` timestamp,
	`completedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `generation_steps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `skill_generations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`skillName` varchar(256) NOT NULL,
	`domain` varchar(256) NOT NULL,
	`features` text NOT NULL,
	`scenarios` text,
	`extraNotes` text,
	`status` enum('pending','running','completed','failed') NOT NULL DEFAULT 'pending',
	`currentStep` int NOT NULL DEFAULT 0,
	`result` json,
	`errorMessage` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`completedAt` timestamp,
	CONSTRAINT `skill_generations_id` PRIMARY KEY(`id`)
);
