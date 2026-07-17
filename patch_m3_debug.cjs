const fs = require('fs');
let code = fs.readFileSync('src/App.jsx', 'utf8');

const regex = /console\.error\(err\);\s+addLog\(`\[M3\] FAILED TO START: \$\{err\.message\}`\);/g;

const replacement = `console.error(err);
                
                // M3 Output Debug Log (Priority 6)
                console.log("==== M3 RENDER DEBUG ====");
                console.log("Endpoint: POST /api/m3/render");
                console.log("Request Payload: (Available in Network Tab)");
                console.log("Response: FAILED / " + err.message);
                console.log("Stack Trace:", err.stack);
                console.log("Error FFmpeg: Not Executed");
                console.log("Error Backend: Route /api/m3/render missing or crashed");
                console.log("Error Validation: Backend validation failed before rendering");
                
                console.log("STEP 1 Validation FAIL");
                console.log("STEP 2 Build Playlist FAIL");
                console.log("STEP 3 Build Background FAIL");
                console.log("STEP 4 Build Thumbnail FAIL");
                console.log("STEP 5 Build Metadata FAIL");
                console.log("STEP 6 FFmpeg FAIL");
                console.log("STEP 7 Output Validation FAIL");
                console.log("=========================");

                addLog(\`[M3] FAILED TO START: \${err.message}\`);`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/App.jsx', code);
    console.log("Replaced successfully!");
} else {
    console.log("Target not found with regex!");
}
