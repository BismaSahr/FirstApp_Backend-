/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('job_categories', function(table) {
    table.increments('category_id').primary(); // int(11) auto_increment primary key
    table.string('category_name', 100).notNullable().unique(); // unique category name
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('job_categories');
};
