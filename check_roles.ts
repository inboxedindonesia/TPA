import pool from './lib/database.js';

async function checkRoles() {
  try {
    const client = await pool.connect();
    
    // Check roles table
    const rolesResult = await client.query(`
      SELECT id, name, description 
      FROM roles 
      ORDER BY name
    `);
    
    console.log('Roles in database:');
    rolesResult.rows.forEach(role => {
      console.log(`- ID: ${role.id}, Name: ${role.name}, Description: ${role.description}`);
    });
    
    // Check users with their roles
    const usersResult = await client.query(`
      SELECT u.id, u.name, u.email, r.name as role_name, r.id as role_id
      FROM users u
      LEFT JOIN roles r ON u.role = r.id
      ORDER BY u.name
    `);
    
    console.log('\nUsers and their roles:');
    usersResult.rows.forEach(user => {
      console.log(`- ${user.name} (${user.email}): Role ID: ${user.role_id}, Role Name: ${user.role_name}`);
    });
    
    client.release();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkRoles();
