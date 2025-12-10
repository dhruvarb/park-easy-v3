
import axios from 'axios';

async function testSignup() {
    try {
        const email = `test_admin_${Date.now()}@example.com`;
        console.log(`Attempting signup for ${email}...`);

        const response = await axios.post('http://localhost:5000/api/auth/signup', {
            fullName: "Test Admin",
            email: email,
            password: "password123",
            phone: "1234567890",
            role: "admin",
            upiId: "test@upi"
        });

        console.log("Signup successful!");
        console.log("User ID:", response.data.user.id);
        console.log("UPI ID in response:", response.data.user.upi_id);

        // Verify in DB
        // We can't directly check DB here easily without pg, but the response should have it if RETURNING worked.

    } catch (error) {
        console.error("Signup failed:", error.response?.data || error.message);
    }
}

testSignup();
