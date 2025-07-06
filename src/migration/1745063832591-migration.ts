import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1745063832591 implements MigrationInterface {
    name = 'Migration1745063832591'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`google_access_token\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD \`google_refresh_token\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`google_refresh_token\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP COLUMN \`google_access_token\``);
    }

}
