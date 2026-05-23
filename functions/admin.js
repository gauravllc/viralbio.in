export async function onRequest(context) {
    const adminHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ViralBio - Admin Panel</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
        body { background-color: #f4f5f7; color: #333; padding: 40px 20px; display: flex; justify-content: center; }
        .admin-card { background: white; padding: 30px; border-radius: 16px; width: 100%; max-width: 550px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); }
        h2 { margin-bottom: 20px; color: #111; font-size: 24px; text-align: center; font-weight: 700; }
        label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #555; text-transform: uppercase; }
        input[type="text"], input[type="url"], textarea { width: 100%; padding: 12px; margin-bottom: 18px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; background: #f8fafc; transition: 0.2s; }
        input[type="file"] { width: 100%; background: white; padding: 9px; cursor: pointer; margin-bottom: 18px; border: 1px solid #e2e8f0; border-radius: 8px;}
        input:focus, textarea:focus { border-color: #3182ce; background: white; outline: none; }
        .btn-submit { width: 100%; padding: 14px; background: #3182ce; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.2s; margin-top: 10px; }
        .btn-submit:hover { background: #2b6cb0; }
        .btn-submit:disabled { background: #a0aec0; cursor: not-allowed; }
        .result-box { display: none; margin-top: 20px; padding: 15px; background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; text-align: center; }
        .result-box a { color: #2f855a; font-weight: 600; text-decoration: underline; word-break: break-all; }
        
        /* Modern Toggle Switch for Blue Tick */
        .toggle-wrapper { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; padding: 12px; background: #f0f4f8; border: 1px solid #cbd5e1; border-radius: 8px;}
        .toggle-wrapper label { margin-bottom: 0; font-size: 14px; color: #0f172a; display: flex; align-items: center; gap: 8px;}
        .switch { position: relative; display: inline-block; width: 46px; height: 24px; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: .4s; border-radius: 50%; }
        input:checked + .slider { background-color: #3b82f6; }
        input:checked + .slider:before { transform: translateX(22px); }
    </style>
</head>
<body>
<div class="admin-card">
    <h2>📝 Create Premium Portfolio</h2>
    <form id="bioForm">
        <label>Username (URL ke liye: e.g. rahul-sharma)</label>
        <input type="text" name="username" placeholder="rahul-sharma" required>
        
        <label>Full Name</label>
        <input type="text" name="full_name" placeholder="Rahul Sharma" required>
        
        <div class="toggle-wrapper">
            <label>Verified Blue Tick ☑️</label>
            <label class="switch">
                <input type="checkbox" name="blue_tick">
                <span class="slider"></span>
            </label>
        </div>

        <label>Profession / Title</label>
        <input type="text" name="profession" placeholder="Digital Marketer">
        
        <label>Date of Birth</label>
        <input type="text" name="dob" placeholder="15 August 1995">

        <label>Country / Location</label>
        <input type="text" name="country" placeholder="India">
        
        <label>Upload Profile Photo (PC/Mobile se)</label>
        <input type="file" id="imageFile" accept="image/*" required>
        <input type="hidden" name="profile_pic_url" id="profile_pic_url">
        
        <label>Short Bio (Highlight - 3 to 4 lines)</label>
        <textarea name="short_bio" rows="3" placeholder="Born in Delhi, Rahul is passionate about building digital brands..."></textarea>

        <label>Full Biography (Details)</label>
        <textarea name="bio_text" rows="5" placeholder="Detailed journey and achievements..."></textarea>

        <label>Favorite YouTube Song Link 🎵</label>
        <input type="url" name="yt_link" placeholder="https://www.youtube.com/watch?v=...">
        
        <label>Instagram Link (Optional)</label>
        <input type="url" name="instagram" placeholder="https://instagram.com/username">
        
        <label>LinkedIn Link (Optional)</label>
        <input type="url" name="linkedin" placeholder="https://linkedin.com/in/username">
        
        <button type="submit" class="btn-submit" id="submitBtn">Upload & Generate Premium Link</button>
    </form>
    <div class="result-box" id="resultBox">
        <p style="color: #22543d; margin-bottom: 5px; font-size: 14px;">🎉 Link Successfully Live!</p>
        <a id="generatedLink" href="#" target="_blank">Click here to open page</a>
    </div>
</div>
<script>
    document.getElementById('bioForm').onsubmit = async (e) => {
        e.preventDefault();
        const btn = document.getElementById('submitBtn');
        btn.disabled = true;

        const fileInput = document.getElementById('imageFile');
        let finalPhotoUrl = "";

        if (fileInput.files.length > 0) {
            btn.innerText = "Uploading Photo to R2...";
            const fileFormData = new FormData();
            fileFormData.append("file", fileInput.files[0]);

            try {
                const uploadRes = await fetch('/api/upload', { method: 'POST', body: fileFormData });
                const uploadData = await uploadRes.json();
                
                if (uploadData.success) {
                    finalPhotoUrl = uploadData.url;
                } else {
                    alert("Photo upload failed: " + uploadData.error);
                    btn.disabled = false;
                    btn.innerText = "Upload & Generate Premium Link";
                    return;
                }
            } catch (err) {
                alert("Error uploading photo. Check network.");
                btn.disabled = false;
                btn.innerText = "Upload & Generate Premium Link";
                return;
            }
        }

        btn.innerText = "Saving Profile Data...";
        const formData = new FormData(e.target);
        if (finalPhotoUrl) {
            formData.set("profile_pic_url", finalPhotoUrl);
        }

        try {
            const res = await fetch('/api/create', { method: 'POST', body: formData });
            const data = await res.json();
            if(data.success) {
                const finalUrl = window.location.origin + data.url;
                document.getElementById('generatedLink').href = finalUrl;
                document.getElementById('generatedLink').innerText = finalUrl;
                document.getElementById('resultBox').style.display = 'block';
                e.target.reset();
            } else {
                alert("Error: " + data.error);
            }
        } catch (err) {
            alert("Failed to save data to Database.");
        }
        btn.innerText = "Upload & Generate Premium Link";
        btn.disabled = false;
    }
</script>
</body>
</html>
    `;
    return new Response(adminHtml, { headers: { "Content-Type": "text/html" } });
}
