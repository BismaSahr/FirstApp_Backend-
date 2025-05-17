/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('job_seekers', function(table) {
    table.increments('user_id').primary();  // int(11), primary key, auto_increment
    table.string('full_name', 255).notNullable();
    table.string('phone', 20).nullable();
    table.string('location', 255).nullable();
    table.text('skills').nullable();
    table.string('experience_level', 100).nullable();
    table.text('desired_job_titles').nullable();
    table.text('education').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('job_seekers');
};
