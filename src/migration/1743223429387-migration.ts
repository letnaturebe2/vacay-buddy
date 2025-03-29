import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1743223429387 implements MigrationInterface {
  name = 'Migration1743223429387';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE \`organization\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`organization_id\` varchar(255) NOT NULL, \`is_enterprise\` tinyint NOT NULL DEFAULT 0, INDEX \`IDX_ed1251fa3856cd1a6c98d7bcaa\` (\`organization_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`user_id\` varchar(255) NOT NULL, \`is_admin\` tinyint NOT NULL DEFAULT 0, \`name\` varchar(255) NULL, \`annual_pto_days\` float NOT NULL DEFAULT '15', \`used_pto_days\` float NOT NULL DEFAULT '0', \`organization_id\` int NULL, INDEX \`IDX_758b8ce7c18b9d347461b30228\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pto_template\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`title\` varchar(255) NOT NULL, \`description\` varchar(1024) NULL, \`content\` text NOT NULL, \`enabled\` tinyint NOT NULL DEFAULT 1, \`days_consumed\` float NOT NULL DEFAULT '1', \`organization_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pto_request\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`start_date\` date NOT NULL, \`end_date\` date NOT NULL, \`title\` varchar(255) NOT NULL, \`reason\` text NOT NULL, \`status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`current_approval_id\` int NULL, \`user_id\` int NULL, \`template_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `CREATE TABLE \`pto_approval\` (\`id\` int NOT NULL AUTO_INCREMENT, \`created\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`approver_id\` int NOT NULL, \`status\` enum ('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending', \`comment\` text NULL, \`action_date\` datetime NULL, \`request_id\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`,
    );
    await queryRunner.query(
      `ALTER TABLE \`user\` ADD CONSTRAINT \`FK_3e103cdf85b7d6cb620b4db0f0c\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pto_template\` ADD CONSTRAINT \`FK_8dc983d073556ce8eb5c1eb988f\` FOREIGN KEY (\`organization_id\`) REFERENCES \`organization\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pto_request\` ADD CONSTRAINT \`FK_b84ed90fdaf36bff22569f82f6f\` FOREIGN KEY (\`user_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pto_request\` ADD CONSTRAINT \`FK_c9cabec8bc8664b0093bfc72338\` FOREIGN KEY (\`template_id\`) REFERENCES \`pto_template\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pto_approval\` ADD CONSTRAINT \`FK_1ed6912af9e0e3f66322419724e\` FOREIGN KEY (\`request_id\`) REFERENCES \`pto_request\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE \`pto_approval\` ADD CONSTRAINT \`FK_209015e91b704e936f5653d2e57\` FOREIGN KEY (\`approver_id\`) REFERENCES \`user\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE \`pto_approval\` DROP FOREIGN KEY \`FK_209015e91b704e936f5653d2e57\``);
    await queryRunner.query(`ALTER TABLE \`pto_approval\` DROP FOREIGN KEY \`FK_1ed6912af9e0e3f66322419724e\``);
    await queryRunner.query(`ALTER TABLE \`pto_request\` DROP FOREIGN KEY \`FK_c9cabec8bc8664b0093bfc72338\``);
    await queryRunner.query(`ALTER TABLE \`pto_request\` DROP FOREIGN KEY \`FK_b84ed90fdaf36bff22569f82f6f\``);
    await queryRunner.query(`ALTER TABLE \`pto_template\` DROP FOREIGN KEY \`FK_8dc983d073556ce8eb5c1eb988f\``);
    await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_3e103cdf85b7d6cb620b4db0f0c\``);
    await queryRunner.query(`DROP TABLE \`pto_approval\``);
    await queryRunner.query(`DROP TABLE \`pto_request\``);
    await queryRunner.query(`DROP TABLE \`pto_template\``);
    await queryRunner.query(`DROP INDEX \`IDX_758b8ce7c18b9d347461b30228\` ON \`user\``);
    await queryRunner.query(`DROP TABLE \`user\``);
    await queryRunner.query(`DROP INDEX \`IDX_ed1251fa3856cd1a6c98d7bcaa\` ON \`organization\``);
    await queryRunner.query(`DROP TABLE \`organization\``);
  }
}
