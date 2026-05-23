export async function onRequest(context) {
    const { env, request } = context;

    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const formData = await request.formData();
        const username = formData.get("username").trim().toLowerCase().replace(/[^a-z0-9-]/g, ""); 
        const full_name = formData.get("full_name");
        const profession = formData.get("profession");
        const dob = formData.get("dob");
        
        // Naye Fields
        const country = formData.get("country");
        const short_bio = formData.get("short_bio");
        const yt_link = formData.get("yt_link");
        const blue_tick = formData.get("blue_tick") === "on" ? "true" : "false"; // Toggle check
        
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

        // Updated Database Insert Query
        await env.DB.prepare(`
            INSERT OR REPLACE INTO biographies 
            (username, full_name, profession, dob, country, short_bio, bio_text, instagram, linkedin, profile_pic_url, yt_link, blue_tick)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(username, full_name, profession, dob, country, short_bio, bio_text, instagram, linkedin, profile_pic_url, yt_link, blue_tick).run();

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
