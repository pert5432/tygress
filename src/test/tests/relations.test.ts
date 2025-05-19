import { beforeAll, describe, expect, test } from "vitest";
import { TestHelper } from "../helpers";
import { TEST_DB } from "../client";
import { Users } from "../entities/users";
import { Pets } from "../entities/pets";
import { PetCategories } from "../entities/pet-categories";
import { PetCategoriesPet } from "../entities/pet-categories-pet";

describe("relations", async () => {
  await TestHelper.trunc();

  const user = (
    await TEST_DB.insert(
      Users,
      [
        {
          id: "36c6cacd-fcee-4150-ae6a-451b7f5f0127",
          username: "asdf",
        },
      ],
      { returning: "*" }
    )
  ).rows[0]!;

  const pets = (
    await TEST_DB.insert(
      Pets,
      [
        {
          id: "f244c51d-fbe4-439e-be15-fb46a7d16c47",
          name: "Pootis",
          userId: "36c6cacd-fcee-4150-ae6a-451b7f5f0127",
        },
        {
          id: "28f02008-9c96-4286-b54c-2d4a1a6647b8",
          name: "Muffin",
          userId: "36c6cacd-fcee-4150-ae6a-451b7f5f0127",
        },
      ],
      { returning: "*" }
    )
  ).rows;

  const categories = (
    await TEST_DB.insert(
      PetCategories,
      [
        { id: "f6b3cbb9-43ab-4561-8c8e-b8041b68a43a", name: "cat" },
        { id: "fe416dec-9918-4496-952b-51fb34517d86", name: "dog" },
        { id: "e1ee00f3-2a06-4d37-b989-d9aa8fb2baf9", name: "chonk" },
      ],
      { returning: "*" }
    )
  ).rows;

  const petCategories = (
    await TEST_DB.insert(
      PetCategoriesPet,
      [
        {
          petId: "f244c51d-fbe4-439e-be15-fb46a7d16c47",
          petCategoryId: "f6b3cbb9-43ab-4561-8c8e-b8041b68a43a",
        },
        {
          petId: "28f02008-9c96-4286-b54c-2d4a1a6647b8",
          petCategoryId: "f6b3cbb9-43ab-4561-8c8e-b8041b68a43a",
        },
        {
          petId: "28f02008-9c96-4286-b54c-2d4a1a6647b8",
          petCategoryId: "fe416dec-9918-4496-952b-51fb34517d86",
        },
        {
          petId: "28f02008-9c96-4286-b54c-2d4a1a6647b8",
          petCategoryId: "e1ee00f3-2a06-4d37-b989-d9aa8fb2baf9",
        },
      ],
      { returning: "*" }
    )
  ).rows;

  test("querying nested relations", async () => {
    user.pets = pets;

    petCategories[0]!.category = categories[0]!;
    petCategories[1]!.category = categories[0]!;
    petCategories[2]!.category = categories[1]!;
    petCategories[3]!.category = categories[2]!;

    pets[0]!.categories = [petCategories[0]!];
    pets[1]!.categories = [
      petCategories[1]!,
      petCategories[2]!,
      petCategories[3]!,
    ];

    const res = await TEST_DB.select(Users, {
      joins: { pets: { categories: { category: true } } },
    });

    expect(res[0]).toStrictEqual(user);
  });
});
