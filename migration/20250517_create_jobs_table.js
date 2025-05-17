/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('jobs', function(table) {
    table.increments('job_id').primary(); // Primary key

    table.integer('employer_id').unsigned().references('user_id').inTable('employers').onDelete('SET NULL');
    table.integer('category_id').unsigned().references('category_id').inTable('job_categories').onDelete('SET NULL');
    table.integer('location_id').unsigned().references('location_id').inTable('job_locations').onDelete('SET NULL');

    table.string('title', 100).nullable();
    table.text('description').nullable();
    table.text('requirements').nullable();
    table.string('salary_range', 50).nullable();
    table.enu('job_type', ['full-time', 'part-time', 'contract', 'internship']).nullable();
    table.timestamp('posted_at').defaultTo(knex.fn.now()).notNullable();
    table.date('deadline').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('jobs');
};
