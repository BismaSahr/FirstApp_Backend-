/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('saved_jobs', function(table) {
    table.increments('saved_id').primary(); // Primary key

    table.integer('jobseeker_id').unsigned().notNullable()
      .references('user_id').inTable('job_seekers').onDelete('CASCADE');

    table.integer('job_id').unsigned().notNullable()
      .references('job_id').inTable('jobs').onDelete('CASCADE');

    table.timestamp('saved_at').defaultTo(knex.fn.now()).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('saved_jobs');
};
