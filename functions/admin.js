export async function onRequest(context) {
    const html = `
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
    <h2>📝 Create Wikipedia Style Bio</h2>
    <form id="bioForm">
        <label>Username (URL ke liye: e.g. rahul-sharma)</label>
        <input type="text" name="username" placeholder="rahul-sharma" required>

        <label>Full Name (Heading me dikhega)</label>
        <input type="text" name="full_name" placeholder="Rahul Sharma" required>

        <label>Profession / Title</label>
        <input type="text" name="profession" placeholder="Digital Marketer & Influencer">

        <label>Date of Birth</label>
        <input type="text" name="dob" placeholder="15 August 1995">

        <label>Profile Image URL (Direct Link)</label>
        <input type="url" name="profile_pic_url" placeholder="https://imgur.com/xyz.jpg">

        <label>Biography Text (Wikipedia Style Main Content)</label>
        <textarea name="bio_text" rows="5" placeholder="Rahul Sharma is an Indian entrepreneur..."></textarea>

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
        btn.innerText = "Generating...";
        btn.disabled = true;

        const formData = new FormData(e.target);

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
            alert("Failed to save data. Check configuration.");
        }
        
        btn.innerText = "Generate Link";
        btn.disabled = false;
    }
</script>
</body>
</html>
    `;
    return new Response(html, { headers: { "Content-Type": "text/html" } });
}
