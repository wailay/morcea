export async function onRequestPost(context) {
  try {
    const { email, firstName, lastName } = await context.request.json();

    // Validate input
    if (!email || !firstName || !lastName) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Add to Airtable
    const res = await fetch(
      `https://api.airtable.com/v0/${context.env.AIRTABLE_BASE_ID}/Waitlist`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${context.env.AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: {
            "First Name": firstName,
            "Last Name": lastName,
            "Email": email,
            "Signed Up": new Date().toISOString(),
          },
        }),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error("Airtable error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
