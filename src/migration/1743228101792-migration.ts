import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743228101792 implements MigrationInterface {
    name = 'Migration1743228101792'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`organization\` ADD \`installation\` text NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`organization\` DROP COLUMN \`installation\``);
    }

}
