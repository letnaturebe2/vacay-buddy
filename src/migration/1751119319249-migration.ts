import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1751119319249 implements MigrationInterface {
    name = 'Migration1751119319249'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`last_notification_sent_at\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`last_notification_sent_at\``);
    }

}
