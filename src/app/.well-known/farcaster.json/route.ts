export async function GET() {
  // const appUrl = process.env.NEXT_PUBLIC_URL
    const appUrl = 'https://13588cbba2cc.ngrok.app/'

  const config = {
    accountAssociation: {
      header:
        "eyJmaWQiOjE3NTkyLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4YUQ3YjNlMTBhZDc3NEMxOTM4ZGFDQzEyNGYxMTk4M2YwRTRkQTM3MSJ9",
      payload: "eyJkb21haW4iOiIxMzU4OGNiYmEyY2Mubmdyb2suYXBwIn0",
      signature:
        "MHgyODEwNzUxYWRmMjFmNzMzMjkzYmJhNWMwYTkxNTIxN2E4MTkzNmYwNGNiNDJkOWNmM2U2NDI0YTY3ODA3ODYxMGE0ODY1Nzg4ZmYzOTNhYzk5ZDM5OGRmYzZkNzUxYmY4ZGFiY2Q0YWY5OGEzMWFhMWE5OGE0YTY2NTU4YWVlZDFi",
    },
    frame: {
      version: "1",
      name: "Frames v2 Demo",
      iconUrl: `${appUrl}icon.png`,
      homeUrl: `${appUrl}`,
      imageUrl: `${appUrl}frames/hello/opengraph-image`,
      buttonTitle: "Launch Frame",
      splashImageUrl: `${appUrl}splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}api/webhook`,
    },
  };

  return Response.json(config);
}