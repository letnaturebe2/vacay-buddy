import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1751770493701 implements MigrationInterface {
    name = 'Migration1751770493701'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`google_refresh_token\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`google_refresh_token\``);
    }

}
