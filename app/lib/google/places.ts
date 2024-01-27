export async function searchText(text: string, referer: string) {
  const response = await fetch(
    "https://places.googleapis.com/v1/places:searchText",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        referer,
        "X-Goog-Api-Key": process.env.GOOGLE_MAPS_API_KEY!,
        "X-Goog-FieldMask": "places.id,places.displayName.text,places.location",
      },
      body: JSON.stringify({
        textQuery: text,
        maxResultCount: 3,
      }),
    },
  );

  const json = await response.json();

  json.places.map((p: any) => {
    console.log(p.location);
    console.log(p.displayName);
  });
}
