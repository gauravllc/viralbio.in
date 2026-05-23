export async function onRequest(context) {
    const { env, params } = context;
    const name = params.name;

    // Bucket se photo dhoondhenge
    const object = await env.BUCKET.get(name);

    if (!object) {
        return new Response("Image Not Found", { status: 404 });
    }

    // Photo ko browser me sahi se render karne ke liye headers set karenge
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Cache-Control", "public, max-age=31536000"); // Fast loading ke liye cache

    return new Response(object.body, { headers });
}
