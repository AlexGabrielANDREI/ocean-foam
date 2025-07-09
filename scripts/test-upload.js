const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testUpload() {
  console.log("🧪 Testing Upload Functionality");
  console.log("=".repeat(40));

  try {
    // Step 1: Check available buckets
    console.log("1️⃣ Checking available buckets...");
    const { data: buckets, error: bucketsError } =
      await supabase.storage.listBuckets();

    if (bucketsError) {
      console.log("❌ Error listing buckets:", bucketsError.message);
      return;
    }

    const bucketNames = buckets.map((b) => b.name);
    console.log("📋 Available buckets:", bucketNames);

    // Step 2: Check if required buckets exist
    const requiredBuckets = ["ml-models", "features-uploads"];
    const missingBuckets = requiredBuckets.filter(
      (name) => !bucketNames.includes(name)
    );

    if (missingBuckets.length > 0) {
      console.log("❌ Missing buckets:", missingBuckets);
      console.log("📝 Please run: npm run init-storage");
      return;
    }

    console.log("✅ All required buckets exist");

    // Step 3: Test upload to ml-models bucket
    console.log("\n2️⃣ Testing upload to ml-models bucket...");
    const testContent = "This is a test model file content";
    const testBuffer = Buffer.from(testContent, "utf8");
    const testPath = "test/test_model.pkl";

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("ml-models")
        .upload(testPath, testBuffer, {
          contentType: "application/octet-stream",
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        console.log("❌ Upload to ml-models failed:", uploadError.message);
      } else {
        console.log("✅ Upload to ml-models successful:", uploadData);
      }
    } catch (error) {
      console.log("❌ Upload to ml-models error:", error.message);
    }

    // Step 4: Test upload to features-uploads bucket
    console.log("\n3️⃣ Testing upload to features-uploads bucket...");
    const testFeatures = JSON.stringify({ test: "features", value: 123 });
    const featuresBuffer = Buffer.from(testFeatures, "utf8");
    const featuresPath = "test/test_features.json";

    try {
      const { data: featuresUploadData, error: featuresUploadError } =
        await supabase.storage
          .from("features-uploads")
          .upload(featuresPath, featuresBuffer, {
            contentType: "application/json",
            upsert: true,
            cacheControl: "3600",
          });

      if (featuresUploadError) {
        console.log(
          "❌ Upload to features-uploads failed:",
          featuresUploadError.message
        );
      } else {
        console.log(
          "✅ Upload to features-uploads successful:",
          featuresUploadData
        );
      }
    } catch (error) {
      console.log("❌ Upload to features-uploads error:", error.message);
    }

    // Step 5: Test download
    console.log("\n4️⃣ Testing download...");
    try {
      const { data: downloadData, error: downloadError } =
        await supabase.storage.from("ml-models").download(testPath);

      if (downloadError) {
        console.log("❌ Download failed:", downloadError.message);
      } else {
        const content = await downloadData.text();
        console.log("✅ Download successful, content length:", content.length);
      }
    } catch (error) {
      console.log("❌ Download error:", error.message);
    }

    // Step 6: Clean up test files
    console.log("\n5️⃣ Cleaning up test files...");
    try {
      const { error: deleteError } = await supabase.storage
        .from("ml-models")
        .remove([testPath]);

      if (deleteError) {
        console.log("⚠️  Could not delete test file:", deleteError.message);
      } else {
        console.log("✅ Test file deleted");
      }

      const { error: deleteFeaturesError } = await supabase.storage
        .from("features-uploads")
        .remove([featuresPath]);

      if (deleteFeaturesError) {
        console.log(
          "⚠️  Could not delete test features file:",
          deleteFeaturesError.message
        );
      } else {
        console.log("✅ Test features file deleted");
      }
    } catch (error) {
      console.log("⚠️  Cleanup error:", error.message);
    }

    console.log("\n🎉 Upload test completed!");
    console.log(
      "📝 If all tests passed, the upload API should work correctly."
    );
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

testUpload();
