--> statement-breakpoint
ALTER TABLE message ALTER COLUMN "role" TYPE message_type USING role::message_type;
