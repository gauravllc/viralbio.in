export async function onRequest(context) {
    const { env, request } = context;

    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const formData = await request.formData();
        const baseUsername = formData.get("username").trim().toLowerCase().replace(/[^a-z0-9-]/g, ""); 
        const full_name = formData.get("full_name");
        const profession = formData.get("profession");
        const dob = formData.get("dob");
        const country = formData.get("country");
        const short_bio = formData.get("short_bio");
        const yt_link = formData.get("yt_link");
        const blue_tick = formData.get("blue_tick") === "on" ? "true" : "false"; 
        const bio_text = formData.get("bio_text");
        const instagram = formData.get("instagram");
        const linkedin = formData.get("linkedin");
        const profile_pic_url = formData.get("profile_pic_url");

        if (!baseUsername || !full_name) {
            return new Response(JSON.stringify({ success: false, error: "Username and Full Name are required" }), {
                status: 400, headers: { "Content-Type": "application/json" }
            });
        }

        // ==========================================
        // DUPLICATE USERNAME CHECK LOGIC (rahul-1, rahul-2)
        // ==========================================
        let finalUsername = baseUsername;
        let counter = 1;

        while (true) {
            const existing = await env.DB.prepare("SELECT username FROM biographies WHERE username = ?").bind(finalUsername).first();
            if (!existing) {
                break; // Name available hai, loop tod do
            }
            finalUsername = `${baseUsername}-${counter}`; // Agar available nahi h to -1, -2 laga do
            counter++;
        }

        await env.DB.prepare(`
            INSERT INTO biographies 
            (username, full_name, profession, dob, country, short_bio, bio_text, instagram, linkedin, profile_pic_url, yt_link, blue_tick)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(finalUsername, full_name, profession, dob, country, short_bio, bio_text, instagram, linkedin, profile_pic_url, yt_link, blue_tick).run();

        const generatedUrl = `/${finalUsername}`;
        return new Response(JSON.stringify({ success: true, url: generatedUrl }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500, headers: { "Content-Type": "application/json" }
        });
    }
}
