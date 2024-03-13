import { prisma } from "~/db.server";

interface NewPlace {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

interface PlanInfo {
  date: Date;
  tags: string[];
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

export async function getPlans(userId: string, type: "new" | "old" = "new") {
  const plans = await prisma.plan.findMany({
    where: {
      userId,
      date: type === "new" ? { gte: new Date() } : { lt: new Date() },
    },
    select: {
      id: true,
      date: true,
      place: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
  });

  return plans.map((plan) => ({
    ...plan,
    date: plan.date?.toISOString() || null,
  }));
}

export async function getPlan({ id, userId }: { id: string; userId: string }) {
  const plan = await prisma.plan.findFirst({
    where: {
      id,
      userId,
    },
    select: {
      date: true,
      details: true,
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
      place: {
        select: {
          id: true,
          name: true,
          address: true,
        },
      },
    },
  });

  return {
    ...plan,
    date: plan?.date?.toISOString() || null,
  };
}

export async function createPlan(userId: string, newPlace: NewPlace) {
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

export async function updatePlan(planId: string, planInfo: PlanInfo) {
  const plan = await prisma.plan.findFirst({
    where: { id: planId },
    select: {
      date: true,
      details: true,
      tags: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
  const tags = plan?.tags;
  const plansToCreate = planInfo.tags.filter(
    (tag) => tags?.every((t) => t.name !== tag),
  );

  return prisma.plan.update({
    where: { id: planId },
    data: {
      date: planInfo.date,
      tags: {
        connectOrCreate: plansToCreate.map((tag) => ({
          where: { name: tag },
          create: { name: tag },
        })),
      },
    },
  });
}
