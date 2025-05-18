/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('employers', function(table) {
    table.increments('user_id').primary(); // int(11), primary key, auto_increment
    table.string('company_name', 255).notNullable();
    table.string('industry', 255).notNullable();
    table.string('website', 255).nullable();
    table.string('profile_image', 255).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('employers');
};
