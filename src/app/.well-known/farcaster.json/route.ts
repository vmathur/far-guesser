export async function GET() {
  const appUrl = process.env.NEXT_PUBLIC_URL

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjE3NTkyLCJ0eXBlIjoiY3VzdG9keSIsImtleSI6IjB4YUQ3YjNlMTBhZDc3NEMxOTM4ZGFDQzEyNGYxMTk4M2YwRTRkQTM3MSJ9",
      payload: "eyJkb21haW4iOiJmYXItZ3Vlc3Nlci52ZXJjZWwuYXBwIn0",
      // payload: "eyJkb21haW4iOiI1Njg5MGU0NTg3MjQubmdyb2suYXBwIn0",
      signature: "MHgxNmM4NjFhMzY3MGZkYWViZjM0MGMzZWRmNjg3OGFjMGY4NjMzYzA5MmFlYzFiM2QwNDYyNWZhZmM2NDViNjU3NWIxOTExN2MxMmFlMWYyZGUwMzc3OGE2ODBkOTZhNzIwYzdjZGFhYzg4NTk5ZWEzMjJmYzgxNDlhMmZjNjgwZDFj"
      // signature: "MHgzNzIyMjRhMWQyYTk4OGVkMWNjMWRjMTA1NzgwOWRiZTI4NDBkYzIwOTU3Yzc4ZWE0NjIwZjYwZmM2NzI0OTUxMGI5YTE2NGNkOWQ0MGZmM2U0ZmUzNDI2M2QzNzdmZTU1Mzg1NjBlNGZlODc2MTljY2QwM2RmY2U3NDcwMDc1YTFi"
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