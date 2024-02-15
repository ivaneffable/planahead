import { prisma } from "~/db.server";

interface NewPlace {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

async function createOrUpdatePlace(newPlace: NewPlace) {
  const { placeId, name, address, latitude, longitude } = newPlace;

  const place = await prisma.place.findFirst({
    where: { name, latitude, longitude },
  });

  if (!place) {
    return prisma.place.create({
      data: {
        placeId,
        name,
        address,
        latitude,
        longitude,
      },
    });
  }

  if (place.placeId !== placeId) {
    return prisma.place.update({
      where: { id: place.id },
      data: { placeId },
    });
  }

  return place;
}

export async function createPlan(newPlace: NewPlace, userId: string) {
  const place = await createOrUpdatePlace(newPlace);

  return prisma.plan.create({
    data: {
      user: {
        connect: {
          id: userId,
        },
      },
      place: {
        connect: {
          id: place.id,
        },
      },
    },
  });
}
