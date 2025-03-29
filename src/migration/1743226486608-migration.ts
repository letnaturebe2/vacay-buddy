import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1743226486608 implements MigrationInterface {
    name = 'Migration1743226486608'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`organization\` CHANGE \`bot_token\` \`bot_token\` varchar(255) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`organization\` CHANGE \`bot_token\` \`bot_token\` varchar(255) NULL`);
    }

}
