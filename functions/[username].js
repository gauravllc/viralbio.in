export async function onRequest(context) {
    const { env, params } = context;
    const username = params.username.toLowerCase();

    // ==========================================
    // 1. ADMIN PANEL ROUTE (With R2 File Upload)
    // ==========================================
    if (username === 'admin') {
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
        input, textarea { width: 100%; padding: 12px; margin-bottom: 18px; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 15px; background: #f8fafc; transition: 0.2s; }
        input:focus, textarea:focus { border-color: #3182ce; background: white; outline: none; }
        .btn-submit { width: 100%; padding: 14px; background: #3182ce; color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .btn-submit:hover { background: #2b6cb0; }
        .result-box { display: none; margin-top: 20px; padding: 15px; background: #f0fff4; border: 1px solid #c6f6d5; border-radius: 8px; text-align: center; }
        .result-box a { color: #2f855a; font-weight: 600; text-decoration: underline; word-break: break-all; }
    </style>
</head>
<body>
<div class="admin-card">
    <h2>📝 Create Wikipedia Bio</h2>
    <form id="bioForm">
        <label>Username (URL ke liye: e.g. rahul)</label>
        <input type="text" name="username" placeholder="rahul-sharma" required>
        
        <label>Full Name</label>
        <input type="text" name="full_name" placeholder="Rahul Sharma" required>
        
        <label>Profession / Title</label>
        <input type="text" name="profession" placeholder="Digital Marketer">
        
        <label>Date of Birth</label>
        <input type="text" name="dob" placeholder="15 August 1995">
        
        <label>Upload Profile Photo (Direct Computer/Mobile Se)</label>
        <input type="file" id="imageFile" accept="image/*" required>
        <input type="hidden" name="profile_pic_url" id="profile_pic_url">
        
        <label>Biography Text</label>
        <textarea name="bio_text" rows="5" placeholder="Biography content..."></textarea>
        
        <label>Instagram Link (Optional)</label>
        <input type="url" name="instagram" placeholder="https://instagram.com/username">
        
        <label>LinkedIn Link (Optional)</label>
        <input type="url" name="linkedin" placeholder="https://linkedin.com/in/username">
        
        <button type="submit" class="btn-submit" id="submitBtn">Generate Link</button>
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

        // 1. Pehle photo ko R2 me upload karenge agar file select hui h to
        if (fileInput.files.length > 0) {
            btn.innerText = "Uploading Photo to R2 Storage...";
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
                    btn.innerText = "Generate Link";
                    return;
                }
            } catch (err) {
                alert("Error uploading photo. Check network.");
                btn.disabled = false;
                btn.innerText = "Generate Link";
                return;
            }
        }

        // 2. Ab photo URL milne ke baad main database me data save karenge
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
        btn.innerText = "Generate Link";
        btn.disabled = false;
    }
</script>
</body>
</html>
        `;
        return new Response(adminHtml, { headers: { "Content-Type": "text/html" } });
    }

    // ==========================================
    // 2. WIKIPEDIA PROFILE PAGE ROUTE
    // ==========================================
    const res = await env.DB.prepare("SELECT * FROM biographies WHERE username = ?").bind(username).first();

    if (!res) {
        return new Response(`
            <h1 style="font-family:sans-serif; text-align:center; margin-top:50px;">
                404 Not Found 💔<br><small style="color:gray;">Is URL par koi profile nahi mili.</small>
            </h1>
        `, { status: 404, headers: { "Content-Type": "text/html" } });
    }

    const defaultPic = "https://upload.wikimedia.org/wikipedia/commons/7/7c/Profile_avatar_placeholder_large.png";
    const profilePic = res.profile_pic_url || defaultPic;
    const formattedBio = res.bio_text ? res.bio_text.replace(/\n/g, '<br><br>') : '';

    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
        <title>${res.full_name} - Wikipedia</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Lato, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #eaecf0; color: #202122; line-height: 1.6; }
            .wiki-header { background: #fff; padding: 10px 20px; border-bottom: 1px solid #a2a9b1; display: flex; align-items: center; gap: 10px; }
            .wiki-header img { width: 35px; }
            .wiki-header span { font-family: 'Linux Libertine', 'Georgia', Times, serif; font-size: 20px; }
            .container { max-width: 960px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #a7d7f9; border-top: none; min-height: 100vh; }
            h1 { font-family: 'Linux Libertine', 'Georgia', Times, serif; font-weight: normal; font-size: 2.2em; margin-top: 0; margin-bottom: 5px; border-bottom: 1px solid #a2a9b1; padding-bottom: 5px; }
            .infobox { float: right; clear: right; width: 300px; background-color: #f8f9fa; border: 1px solid #a2a9b1; margin: 0.5em 0 1em 1.5em; padding: 5px; font-size: 0.85em; }
            .infobox th.main-header { background-color: #b0c4de; text-align: center; font-size: 1.2em; padding: 8px; }
            .infobox img { width: 100%; height: auto; display: block; margin-bottom: 5px; }
            .infobox table { width: 100%; border-collapse: collapse; }
            .infobox th, .infobox td { padding: 6px; border-top: 1px solid #eaecf0; vertical-align: top; }
            .infobox th { text-align: left; white-space: nowrap; color: #202122; width: 35%; }
            .infobox td { color: #202122; }
            a { color: #0645ad; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .content p { font-size: 0.95em; margin-bottom: 15px; }
            @media (max-width: 768px) {
                .container { padding: 15px; border: none; }
                .infobox { float: none; width: 100%; margin: 0 0 20px 0; }
            }
        </style>
    </head>
    <body>
        <div class="wiki-header">
            <img src="https://upload.wikimedia.org/wikipedia/commons/d/de/Wikipedia_Logo_1.0.png" alt="Wikipedia">
            <span>WIKIPEDIA</span>
        </div>
        <div class="container">
            <h1>${res.full_name}</h1>
            <div class="infobox">
                <th class="main-header" style="display:block;">${res.full_name}</th>
                <img src="${profilePic}" alt="${res.full_name}">
                <table>
                    ${res.profession ? `<tr><th>Occupation</th><td>${res.profession}</td></tr>` : ''}
                    ${res.dob ? `<tr><th>Born</th><td>${res.dob}</td></tr>` : ''}
                    ${res.instagram ? `<tr><th>Instagram</th><td><a href="${res.instagram}" target="_blank">@${res.instagram.split('/').pop() || 'Profile'}</a></td></tr>` : ''}
                    ${res.linkedin ? `<tr><th>LinkedIn</th><td><a href="${res.linkedin}" target="_blank">View Profile</a></td></tr>` : ''}
                </table>
            </div>
            <div class="content">
                <p><b>${res.full_name}</b> is an Indian ${res.profession ? res.profession.toLowerCase() : 'professional'}. ${formattedBio}</p>
            </div>
            <div style="clear: both;"></div>
        </div>
    </body>
    </html>
    `;

    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
