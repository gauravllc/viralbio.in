export async function onRequest(context) {
    const { env, request } = context;

    // Sirf POST requests allow karenge
    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const formData = await request.formData();
        const username = formData.get("username").trim().toLowerCase().replace(/[^a-z0-9-]/g, ""); // URL safe username
        const full_name = formData.get("full_name");
        const profession = formData.get("profession");
        const dob = formData.get("dob");
        const bio_text = formData.get("bio_text");
        const instagram = formData.get("instagram");
        const linkedin = formData.get("linkedin");
        const profile_pic_url = formData.get("profile_pic_url");

        if (!username || !full_name) {
            return new Response(JSON.stringify({ success: false, error: "Username and Full Name are required" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Database me data Insert ya Replace (Update) karein
        await env.DB.prepare(`
            INSERT OR REPLACE INTO biographies (username, full_name, profession, dob, bio_text, instagram, linkedin, profile_pic_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(username, full_name, profession, dob, bio_text, instagram, linkedin, profile_pic_url).run();

        // Success Response bhejein jisme naya URL hoga
        const generatedUrl = `/${username}`;
        return new Response(JSON.stringify({ success: true, url: generatedUrl }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
