-- Add message content storage for MESSAGE reports and editable report introductions.
ALTER TABLE `Report` ADD COLUMN `messageContent` TEXT NULL;
