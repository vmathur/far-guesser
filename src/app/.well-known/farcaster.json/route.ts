export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjE3NTkyLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4YUQ3YjNlMTBhZDc3NEMxOTM4ZGFDQzEyNGYxMTk4M2YwRTRkQTM3MSJ9",
      payload: "eyJkb21haW4iOiIzNDBmODlhMGU0ZmYubmdyb2suYXBwIn0",
      signature: "MHhhNmY5MDY3Mjg5NDFkM2ViNjE4ODA5NGI1YmIyZDAyNTc3YzFkMzZlOTYxNDBiNDQ0YTEzOGQ0OThiYWQxN2MzNjVjZGYyMGE0OGE4ZDljMzM0NjExZTg0NWJlNmQ1ZWQwODJkNDFlMWNhMjlmMTY4ZjkzMjcxNWI2ODljMzFjOTFi"
    },
    frame: {
      version: "1",
      name: "FarGuesser",
      iconUrl: `${appUrl}icon.png`,
      homeUrl: `${appUrl}`,
      imageUrl: `${appUrl}icon.png`,
      buttonTitle: "Launch Frame",
      splashImageUrl: `${appUrl}splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}api/webhook`,
    },
  };

  return Response.json(config);
}