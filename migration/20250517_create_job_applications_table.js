/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('job_applications', function(table) {
    table.increments('application_id').primary(); // Primary key

    table.integer('job_id').unsigned().notNullable()
      .references('job_id').inTable('jobs').onDelete('CASCADE');

    table.integer('jobseeker_id').unsigned().notNullable()
      .references('user_id').inTable('job_seekers').onDelete('CASCADE');

    table.integer('employer_id').unsigned().notNullable()
      .references('user_id').inTable('employers').onDelete('CASCADE');

    table.string('full_name', 255).notNullable();
    table.string('email', 255).notNullable();
    table.string('phone', 20).notNullable();
    table.text('cover_letter').nullable();
    table.string('resume_link', 500).nullable();
    table.timestamp('application_date').defaultTo(knex.fn.now()).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('job_applications');
};
