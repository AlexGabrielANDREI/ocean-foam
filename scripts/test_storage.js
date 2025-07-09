const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testStorage() {
  try {
    console.log("🔍 Testing Supabase storage access...");

    // Test 1: List buckets
    console.log("\n1️⃣ Testing bucket listing...");
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log("❌ Error listing buckets:", bucketsError);
      return;
    }

    console.log(
      "✅ Buckets found:",
      buckets.map((b) => b.name)
    );

    // Test 2: List files in models bucket
    console.log("\n2️⃣ Testing models bucket access...");
    const { data: modelFiles, error: modelFilesError } = await supabase.storage
      .from("models")
      .list("", { limit: 10 });

    if (modelFilesError) {
      console.log("❌ Error listing model files:", modelFilesError);
    } else {
      console.log(
        "✅ Models bucket accessible, files:",
        modelFiles?.length || 0
      );
    }

    // Test 3: Try to upload a small test file
    console.log("\n3️⃣ Testing file upload...");
    const testContent = "This is a test file for storage verification";
    const testBuffer = Buffer.from(testContent, "utf8");

    // Test with different MIME types that should be allowed
    const testUploads = [
      {
        name: "test/upload_test.pkl",
        content: testBuffer,
        mimeType: "application/octet-stream",
      },
      {
        name: "test/upload_test.json",
        content: Buffer.from('{"test": "data"}', "utf8"),
        mimeType: "application/json",
      },
    ];

    for (const testUpload of testUploads) {
      console.log(
        `\n   Testing upload: ${testUpload.name} (${testUpload.mimeType})`
      );

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("models")
        .upload(testUpload.name, testUpload.content, {
          contentType: testUpload.mimeType,
          upsert: true,
        });

      if (uploadError) {
        console.log(`   ❌ Upload failed:`, uploadError);
      } else {
        console.log(`   ✅ Upload successful:`, uploadData);

        // Clean up test file
        const { error: deleteError } = await supabase.storage
          .from("models")
          .remove([testUpload.name]);

        if (deleteError) {
          console.log(`   ❌ Cleanup failed:`, deleteError);
        } else {
          console.log(`   ✅ Test file cleaned up`);
        }
      }
    }

    console.log("\n🎉 Storage test complete!");
  } catch (error) {
    console.error("❌ Storage test failed:", error);
  }
}

testStorage();
