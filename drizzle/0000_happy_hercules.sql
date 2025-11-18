CREATE TABLE `staff_members` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`rank` integer NOT NULL,
	`start_of_service` integer NOT NULL,
	`qualifications` text NOT NULL,
	`constraints` text
);
