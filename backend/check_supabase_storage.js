
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("❌ URL or KEY missing in .env");
    process.exit(1);
}

console.log(`Testing connection to: ${supabaseUrl}`);
console.log(`Key length: ${supabaseKey.length}`);

const supabase = createClient(supabaseUrl, supabaseKey);

const testStorage = async () => {
    try {
        console.log("Listing buckets...");
        const { data, error } = await supabase.storage.listBuckets();

        if (error) {
            console.error("❌ Failed to list buckets:", error.message);
            return;
        }

        console.log("✅ buckets:", data.map(b => b.name));

        const bucketName = 'parking-lot-images';
        const bucket = data.find(b => b.name === bucketName);

        if (!bucket) {
            console.log(`⚠️ Bucket '${bucketName}' not found. Attempting to create...`);
            const { data: newBucket, error: createError } = await supabase.storage.createBucket(bucketName, {
                public: true
            });

            if (createError) {
                console.error("❌ Failed to create bucket:", createError.message);
            } else {
                console.log("✅ Bucket created successfully!");
            }
        } else {
            console.log(`✅ Bucket '${bucketName}' exists.`);
        }

    } catch (err) {
        console.error("Unexpected error:", err);
    }
};

testStorage();
