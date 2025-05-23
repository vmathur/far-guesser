export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjE3NTkyLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4YUQ3YjNlMTBhZDc3NEMxOTM4ZGFDQzEyNGYxMTk4M2YwRTRkQTM3MSJ9",
      payload: "eyJkb21haW4iOiJmYXItZ3Vlc3Nlci52ZXJjZWwuYXBwIn0",
      signature: "MHgxNmM4NjFhMzY3MGZkYWViZjM0MGMzZWRmNjg3OGFjMGY4NjMzYzA5MmFlYzFiM2QwNDYyNWZhZmM2NDViNjU3NWIxOTExN2MxMmFlMWYyZGUwMzc3OGE2ODBkOTZhNzIwYzdjZGFhYzg4NTk5ZWEzMjJmYzgxNDlhMmZjNjgwZDFj"
    },
    frame: {
      version: "1",
      name: "FarGuesser",
      iconUrl: `${appUrl}icon.png`,
      homeUrl: `${appUrl}`,
      imageUrl: `${appUrl}icon.png`,
      buttonTitle: "Play",
      splashImageUrl: `${appUrl}splash.png`,
      splashBackgroundColor: "#f7f7f7",
      webhookUrl: `${appUrl}api/webhook`,
    },
  };

  return Response.json(config);
}