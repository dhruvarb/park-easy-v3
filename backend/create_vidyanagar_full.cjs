const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:anything123@localhost:5432/park_easy' });

async function run() {
  await client.connect();

  // 1. Get User ID for admin
  const userRes = await client.query('SELECT id FROM users LIMIT 1');
  const adminId = userRes.rows[0].id;

  // 2. Insert Vidyanagar Lot
  const lotRes = await client.query(`
    INSERT INTO parking_lots (admin_id, name, city, address, latitude, longitude, total_capacity, has_ev)
    VALUES ($1, 'Vidyanagar', 'Hubli', 'BVB Opposite', 15.437000, 75.022000, 30, true)
    RETURNING id
  `, [adminId]);

  const lotId = lotRes.rows[0].id;

  // 3. Create Slots for Vidyanagar (all Booked/Unavailable)
  // Create 30 slots
  for (let i = 1; i <= 30; i++) {
    await client.query(`
       INSERT INTO parking_slots (lot_id, label, vehicle_type, is_ev, is_available)
       VALUES ($1, $2, 'car', false, false)
     `, [lotId, `V-${i}`]);
  }

  // 4. Create Pricing
  await client.query(`
      INSERT INTO slot_pricing (lot_id, vehicle_type, hourly, daily, monthly)
      VALUES ($1, 'car', 8, 50, 1000)
  `, [lotId]);

  console.log('Created Vidyanagar lot with 0 available slots');
  await client.end();
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
