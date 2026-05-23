export async function onRequest(context) {
    const { env, request } = context;

    if (request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get("file");

        if (!file) {
            return new Response(JSON.stringify({ success: false, error: "No file uploaded" }), {
                status: 400,
                headers: { "Content-Type": "application/json" }
            });
        }

        // Photo ka ek unique naam generate karenge extension ke sath
        const extension = file.name.split('.').pop() || 'jpg';
        const fileName = `${crypto.randomUUID()}.${extension}`;

        // Photo ko R2 bucket me daal rahe hain
        await env.BUCKET.put(fileName, file.stream(), {
            httpMetadata: { contentType: file.type }
        });

        // Photo ka naya URL return karenge
        return new Response(JSON.stringify({ success: true, url: `/images/${fileName}` }), {
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }
}
