


async function run() {
    try {
        const response = await fetch('http://localhost:5000/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                fullName: "Test User",
                email: "test_repro_" + Date.now() + "@example.com",
                password: "password123",
                role: "user"
            })
        });
        console.log("Status:", response.status);
        const text = await response.text();
        console.log("Body:", text);
    } catch (err) {
        console.error(err);
    }
}

run();
