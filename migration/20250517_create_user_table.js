/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('user', function(table) {
    table.increments('user_id').primary(); // int(11) primary auto_increment
    table.string('email', 255).notNullable().unique();
    table.string('password', 255).notNullable();
    table.enu('user_type', ['employer', 'jobseeker']).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('user');
};
